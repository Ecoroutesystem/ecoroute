import test from 'node:test'
import assert from 'node:assert/strict'
import { buildApprovalEmail } from './email.js'

test('buildApprovalEmail includes company name and approval status', () => {
  const email = buildApprovalEmail({
    companyName: 'GreenLine Waste Services',
    recipientEmail: 'hello@greenline.example',
  })

  assert.equal(email.to, 'hello@greenline.example')
  assert.match(email.subject, /approved/i)
  assert.match(email.text, /approved/i)
  assert.match(email.html, /GreenLine Waste Services/i)
})
