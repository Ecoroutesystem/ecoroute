import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
const email = process.env.ADMIN_EMAIL ?? 'diope2diope@gmail.com';
const password = process.env.ADMIN_PASSWORD;
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SECRET_KEY)
    throw new Error('SUPABASE_URL and SUPABASE_SECRET_KEY are required in server/.env');
if (!password)
    throw new Error('ADMIN_PASSWORD is required for this one-time command and must not be committed');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, { auth: { autoRefreshToken: false, persistSession: false } });
const { data: existing, error: listError } = await supabase.auth.admin.listUsers({ perPage: 1000 });
if (listError)
    throw new Error(`Unable to access Supabase Auth: ${listError.message}`);
const existingUser = existing.users.find((user) => user.email?.toLowerCase() === email.toLowerCase());
if (existingUser) {
    const { error } = await supabase.auth.admin.updateUserById(existingUser.id, { password, email_confirm: true, user_metadata: { role: 'admin' }, app_metadata: { role: 'admin' } });
    if (error)
        throw new Error(`Unable to update admin: ${error.message}`);
    console.log(`Admin account updated: ${email}`);
}
else {
    const { error } = await supabase.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { role: 'admin' }, app_metadata: { role: 'admin' } });
    if (error)
        throw new Error(`Unable to create admin: ${error.message}`);
    console.log(`Admin account created: ${email}`);
}
