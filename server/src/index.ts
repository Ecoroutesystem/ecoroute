import 'dotenv/config'
import cors from 'cors'
import express from 'express'
import { createClient } from '@supabase/supabase-js'
import { sendApprovalEmail } from './email.js'

type CollectionStatus = 'Scheduled' | 'In Progress' | 'Completed' | 'Missed' | 'Cancelled'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY
if (!supabaseUrl || !supabaseSecretKey) throw new Error('SUPABASE_URL and SUPABASE_SECRET_KEY are required')

const supabase = createClient(supabaseUrl, supabaseSecretKey, { auth: { autoRefreshToken: false, persistSession: false } })
const app = express()
const port = Number(process.env.PORT ?? 4000)

app.use(cors())
app.use(express.json())

function makeId(prefix: string) { return `${prefix}-${Date.now().toString().slice(-6)}` }
function sendDatabaseError(response: express.Response, error: { message: string; code?: string; details?: string; hint?: string }) { console.error({ code: error.code, message: error.message, details: error.details, hint: error.hint }); const message = error.code === 'PGRST204' ? 'Supabase schema is missing company registration columns. Run server/supabase/schema.sql in the Supabase SQL Editor, then restart the API.' : process.env.NODE_ENV === 'development' ? error.message : 'Database operation failed'; response.status(500).json({ error: message, code: process.env.NODE_ENV === 'development' ? error.code : undefined }) }

app.get('/api/health', (_request, response) => {
  response.json({ status: 'ok', service: 'ecoroute-server', persistence: 'supabase', timestamp: new Date().toISOString() })
})

app.get('/api/dashboard/summary', async (_request, response) => {
  const [collections, completed, customers, pendingPayments, allCompanies, approvedCompanies, pendingCompanies, cancelledCompanies] = await Promise.all([
    supabase.from('collections').select('id', { count: 'exact', head: true }),
    supabase.from('collections').select('id', { count: 'exact', head: true }).eq('status', 'Completed'),
    supabase.from('customers').select('id', { count: 'exact', head: true }).eq('status', 'Active'),
    supabase.from('customers').select('id', { count: 'exact', head: true }).neq('balance', '$0.00'),
    supabase.from('companies').select('*').order('created_at', { ascending: false }),
    supabase.from('companies').select('id', { count: 'exact', head: true }).eq('status', 'Approved'),
    supabase.from('companies').select('id', { count: 'exact', head: true }).eq('status', 'Pending approval'),
    supabase.from('companies').select('id', { count: 'exact', head: true }).eq('status', 'Cancelled'),
  ])
  const firstError = [collections, completed, customers, pendingPayments, allCompanies, approvedCompanies, pendingCompanies, cancelledCompanies].find((result) => result.error)
  if (firstError?.error) { sendDatabaseError(response, firstError.error); return }
  response.json({ collectionsToday: collections.count ?? 0, completedCollections: completed.count ?? 0, activeHouseholds: customers.count ?? 0, pendingPayments: pendingPayments.count ?? 0, companiesTotal: allCompanies.data?.length ?? 0, companiesApproved: approvedCompanies.count ?? 0, companiesPending: pendingCompanies.count ?? 0, companiesCancelled: cancelledCompanies.count ?? 0, pendingCompanyRecords: allCompanies.data?.filter((company) => company.status === 'Pending approval').slice(0, 3) ?? [] })
})

app.get('/api/collections', async (_request, response) => {
  const { data, error } = await supabase.from('collections').select('*').order('date', { ascending: true }).order('time', { ascending: true })
  if (error) { sendDatabaseError(response, error); return }
  response.json(data)
})
app.post('/api/collections', async (request, response) => {
  const { data, error } = await supabase.from('collections').insert({ id: makeId('COL'), status: 'Scheduled', ...request.body }).select().single()
  if (error) { sendDatabaseError(response, error); return }
  response.status(201).json(data)
})
app.patch('/api/collections/:id/status', async (request, response) => {
  const { data, error } = await supabase.from('collections').update({ status: request.body.status as CollectionStatus }).eq('id', request.params.id).select().single()
  if (error) { response.status(error.code === 'PGRST116' ? 404 : 500).json({ error: error.code === 'PGRST116' ? 'Collection not found' : 'Database operation failed' }); return }
  response.json(data)
})

app.get('/api/customers', async (_request, response) => {
  const { data, error } = await supabase.from('customers').select('*').order('created_at', { ascending: false })
  if (error) { sendDatabaseError(response, error); return }
  response.json(data)
})
app.post('/api/customers', async (request, response) => {
  const { data, error } = await supabase.from('customers').insert({ id: makeId('CUS'), status: 'Active', balance: '$0.00', ...request.body }).select().single()
  if (error) { sendDatabaseError(response, error); return }
  response.status(201).json(data)
})
app.delete('/api/customers/:id', async (request, response) => {
  const { error } = await supabase.from('customers').update({ status: 'Archived' }).eq('id', request.params.id)
  if (error) { sendDatabaseError(response, error); return }
  response.status(204).send()
})

app.get('/api/companies', async (_request, response) => {
  const { data, error } = await supabase.from('companies').select('*').order('created_at', { ascending: false })
  if (error) { sendDatabaseError(response, error); return }
  response.json(data)
})
app.post('/api/companies', async (request, response) => {
  const { companyName, email, phone, address, tin, password, confirmPassword } = request.body as Record<string, string>
  if (!companyName || !email || !phone || !address || !tin || !password || !confirmPassword) { response.status(400).json({ error: 'Company name, email, phone, address, TIN and password are required' }); return }
  if (password !== confirmPassword) { response.status(400).json({ error: 'Passwords do not match' }); return }
  if (password.length < 8) { response.status(400).json({ error: 'Password must contain at least 8 characters' }); return }
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    app_metadata: { role: 'company' },
    user_metadata: { role: 'company', company_name: companyName },
  })
  if (authError) { response.status(authError.message.toLowerCase().includes('already') ? 409 : 500).json({ error: authError.message.toLowerCase().includes('already') ? 'An account with this email already exists' : 'Company account could not be created' }); return }
  const { data, error } = await supabase.from('companies').insert({ id: makeId('CMP'), auth_user_id: authData.user?.id, name: companyName, email, phone, address, tin, registration: tin, location: address, customers: 0, status: 'Pending approval' }).select().single()
  if (error) { if (authData.user) await supabase.auth.admin.deleteUser(authData.user.id); if (error.code === '23505') { response.status(409).json({ error: 'A company with this TIN already exists' }); return } sendDatabaseError(response, error); return }
  response.status(201).json(data)
})
app.patch('/api/companies/:id/approve', async (request, response) => {
  const currentCompany = await supabase.from('companies').select('*').eq('id', request.params.id).single()
  if (currentCompany.error) { if (currentCompany.error.code === 'PGRST116') { response.status(404).json({ error: 'Company not found' }); return } sendDatabaseError(response, currentCompany.error); return }

  const userId = currentCompany.data?.auth_user_id
  if (userId) {
    const { error: userUpdateError } = await supabase.auth.admin.updateUserById(userId, {
      app_metadata: { role: 'company' },
      user_metadata: { role: 'company', company_name: currentCompany.data?.name ?? '' },
    })
    if (userUpdateError) {
      console.warn('Company auth role could not be updated during approval', userUpdateError)
    }
  }

  const { data, error } = await supabase.from('companies').update({ status: 'Approved' }).eq('id', request.params.id).select().single()
  if (error) { if (error.code === 'PGRST116') { response.status(404).json({ error: 'Company not found' }); return } sendDatabaseError(response, error); return }

  const companyEmail = String(currentCompany.data?.email ?? '').trim()
  if (companyEmail) {
    try {
      await sendApprovalEmail({
        companyName: String(currentCompany.data?.name ?? 'Your company'),
        recipientEmail: companyEmail,
      })
    } catch (emailError) {
      console.warn('Approval email could not be sent', emailError)
    }
  }

  response.json(data)
})
app.patch('/api/companies/:id/cancel', async (request, response) => {
  const { data, error } = await supabase.from('companies').update({ status: 'Cancelled' }).eq('id', request.params.id).select().single()
  if (error) { if (error.code === 'PGRST116') { response.status(404).json({ error: 'Company not found' }); return } if (error.code === '23514') { response.status(409).json({ error: 'Run the updated schema.sql to allow Cancelled company status.' }); return } sendDatabaseError(response, error); return }
  response.json(data)
})
app.delete('/api/companies/:id', async (request, response) => {
  const { data, error } = await supabase.from('companies').delete().eq('id', request.params.id).select('id').single()
  if (error) { if (error.code === 'PGRST116') { response.status(404).json({ error: 'Company not found' }); return } sendDatabaseError(response, error); return }
  response.json({ deleted: true, id: data.id })
})

app.use((_request, response) => response.status(404).json({ error: 'Route not found' }))
app.use((error: unknown, _request: express.Request, response: express.Response, _next: express.NextFunction) => { console.error(error); response.status(500).json({ error: 'Unexpected server error' }) })
app.listen(port, () => console.log(`EcoRoute API listening on http://localhost:${port}`))
