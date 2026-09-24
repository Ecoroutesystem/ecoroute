import express from 'express';
import cors from 'cors';
import crypto from 'crypto';
import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config();

const app = express();
const { Pool } = pg;
const port = Number(process.env.PORT || 5000);
const adminEmail = (process.env.ADMIN_EMAIL || 'diope2diope@gmail.com').toLowerCase();
const adminPassword = process.env.ADMIN_PASSWORD || 'Diope00132';

app.use(cors());
app.use(express.json());

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 5432),
  database: process.env.DB_NAME || 'isukuRoute',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
});

const hashPassword = (value) => crypto.createHash('sha256').update(String(value)).digest('hex');

async function initializeDatabase() {
  await pool.query('CREATE EXTENSION IF NOT EXISTS pgcrypto;');

  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role VARCHAR(50) NOT NULL DEFAULT 'customer',
      full_name VARCHAR(255),
      email_verified BOOLEAN NOT NULL DEFAULT FALSE,
      verification_token TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);
  await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT FALSE;');
  await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_token TEXT;');
  await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_expires_at TIMESTAMPTZ;');

  await pool.query(`
    CREATE TABLE IF NOT EXISTS admins (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      full_name VARCHAR(255),
      role VARCHAR(50) NOT NULL DEFAULT 'admin',
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS companies (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      phone VARCHAR(255),
      office_phone VARCHAR(255),
      address TEXT,
      tin VARCHAR(255),
      business_description TEXT,
      province VARCHAR(255),
      district VARCHAR(255),
      sector VARCHAR(255),
      cell VARCHAR(255),
      street VARCHAR(255),
      building VARCHAR(255),
      rdb_number VARCHAR(255),
      document_company_name VARCHAR(255),
      verification_document_name VARCHAR(255),
      password_hash TEXT,
      status VARCHAR(50) NOT NULL DEFAULT 'Pending approval',
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  await pool.query('ALTER TABLE companies ADD COLUMN IF NOT EXISTS office_phone VARCHAR(255);');
  await pool.query('ALTER TABLE companies ADD COLUMN IF NOT EXISTS business_description TEXT;');
  await pool.query('ALTER TABLE companies ADD COLUMN IF NOT EXISTS province VARCHAR(255);');
  await pool.query('ALTER TABLE companies ADD COLUMN IF NOT EXISTS district VARCHAR(255);');
  await pool.query('ALTER TABLE companies ADD COLUMN IF NOT EXISTS sector VARCHAR(255);');
  await pool.query('ALTER TABLE companies ADD COLUMN IF NOT EXISTS cell VARCHAR(255);');
  await pool.query('ALTER TABLE companies ADD COLUMN IF NOT EXISTS street VARCHAR(255);');
  await pool.query('ALTER TABLE companies ADD COLUMN IF NOT EXISTS building VARCHAR(255);');
  await pool.query('ALTER TABLE companies ADD COLUMN IF NOT EXISTS rdb_number VARCHAR(255);');
  await pool.query('ALTER TABLE companies ADD COLUMN IF NOT EXISTS document_company_name VARCHAR(255);');
  await pool.query('ALTER TABLE companies ADD COLUMN IF NOT EXISTS verification_document_name VARCHAR(255);');

  await pool.query(
    `INSERT INTO users (email, password_hash, role, full_name, email_verified)
     VALUES ($1, $2, $3, $4, TRUE)
     ON CONFLICT (email) DO UPDATE SET
       password_hash = EXCLUDED.password_hash,
       role = 'admin',
       full_name = EXCLUDED.full_name,
       email_verified = TRUE`,
    [adminEmail, hashPassword(adminPassword), 'admin', 'System Administrator']
  );

  await pool.query(
    `INSERT INTO admins (email, password_hash, role, full_name)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (email) DO UPDATE SET
       password_hash = EXCLUDED.password_hash,
       role = 'admin',
       full_name = EXCLUDED.full_name`,
    [adminEmail, hashPassword(adminPassword), 'admin', 'System Administrator']
  );
}

app.get('/', (_req, res) => {
  res.json({ message: 'Ecoroute backend is running.' });
});

app.get('/health', async (_req, res) => {
  try {
    const result = await pool.query('SELECT NOW() as current_time');
    res.json({
      status: 'ok',
      database: process.env.DB_NAME || 'isukuRoute',
      current_time: result.rows[0].current_time,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Database connection failed.',
      details: error.message,
    });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const email = String(req.body?.email ?? '').trim().toLowerCase();
    const password = String(req.body?.password ?? '');

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const result = await pool.query(
      'SELECT id, email, role, full_name, password_hash FROM users WHERE email = $1',
      [email]
    );

    if (result.rowCount === 0) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const user = result.rows[0];
    if (user.password_hash !== hashPassword(password)) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }
    return res.json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        full_name: user.full_name,
      },
      message: 'Login successful.'
    });

  } catch (error) {
    return res.status(500).json({ error: 'Login failed.', details: error.message });
  }
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const fullName = String(req.body?.fullName ?? '').trim();
    const email = String(req.body?.email ?? '').trim().toLowerCase();
    const password = String(req.body?.password ?? '');
    if (!fullName || !email || password.length < 8) {
      return res.status(400).json({ error: 'Full name, email and a password of at least 8 characters are required.' });
    }
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rowCount > 0) return res.status(409).json({ error: 'An account with this email already exists.' });
    await pool.query(
      `INSERT INTO users (email, password_hash, role, full_name, email_verified)
       VALUES ($1, $2, 'customer', $3, TRUE)`,
      [email, hashPassword(password), fullName]
    );
    return res.status(201).json({ message: 'Customer account created. You can sign in now.' });
  } catch (error) {
    return res.status(500).json({ error: 'Customer registration failed.', details: error.message });
  }
});

app.post('/api/auth/google', async (req, res) => {
  try {
    const credential = String(req.body?.credential ?? '');
    if (!credential) return res.status(400).json({ error: 'Google verification credential is required.' });
    const googleResponse = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`);
    if (!googleResponse.ok) return res.status(401).json({ error: 'Google verification could not be completed.' });
    const profile = await googleResponse.json();
    if (process.env.GOOGLE_CLIENT_ID && profile.aud !== process.env.GOOGLE_CLIENT_ID) {
      return res.status(401).json({ error: 'Google account verification is not valid for this application.' });
    }
    if (profile.email_verified !== 'true' || !profile.email) {
      return res.status(401).json({ error: 'Google must verify your email before you can continue.' });
    }
    const email = String(profile.email).toLowerCase();
    const fullName = String(profile.name || profile.email);
    const existing = await pool.query('SELECT id, email, role, full_name FROM users WHERE email = $1', [email]);
    let user = existing.rows[0];
    if (!user) {
      const created = await pool.query(
        `INSERT INTO users (email, password_hash, role, full_name, email_verified)
         VALUES ($1, $2, 'customer', $3, TRUE)
         RETURNING id, email, role, full_name`,
        [email, hashPassword(crypto.randomUUID()), fullName]
      );
      user = created.rows[0];
    } else {
      await pool.query('UPDATE users SET email_verified = TRUE WHERE id = $1', [user.id]);
    }
    return res.json({ user, message: 'Google sign-in successful.' });
  } catch (error) {
    return res.status(500).json({ error: 'Google sign-in failed.', details: error.message });
  }
});

app.get('/api/companies', async (_req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, name, email, phone, office_phone, address, tin, business_description,
             province, district, sector, cell, street, building,
             rdb_number, document_company_name, verification_document_name, status,
             COALESCE(address, 'N/A') AS location
      FROM companies
      ORDER BY created_at DESC
    `);

    const companies = result.rows.map((company) => ({
      id: company.id,
      name: company.name,
      email: company.email,
      phone: company.phone,
      officePhone: company.office_phone,
      address: company.address,
      tin: company.tin,
      registration: company.rdb_number ?? company.document_company_name ?? '',
      businessDescription: company.business_description,
      province: company.province,
      district: company.district,
      sector: company.sector,
      cell: company.cell,
      street: company.street,
      building: company.building,
      rdbNumber: company.rdb_number,
      documentCompanyName: company.document_company_name,
      verificationDocumentName: company.verification_document_name,
      location: company.location,
      status: company.status === 'Approved' ? 'Approved' : company.status === 'Cancelled' ? 'Cancelled' : 'Pending approval',
    }));

    return res.json(companies);
  } catch (error) {
    return res.status(500).json({ error: 'Could not load companies.', details: error.message });
  }
});

app.post('/api/companies', async (req, res) => {
  try {
    const payload = req.body || {};
    const companyName = String(payload.companyName || '').trim();
    const email = String(payload.email || '').trim().toLowerCase();
    const phone = String(payload.phone || '').trim();
    const officePhone = String(payload.officePhone || '').trim();
    const address = String(payload.address || '').trim();
    const tin = String(payload.tin || '').trim();
    const province = String(payload.province || '').trim();
    const district = String(payload.district || '').trim();
    const sector = String(payload.sector || '').trim();
    const cell = String(payload.cell || '').trim();
    const street = String(payload.street || '').trim();
    const building = String(payload.building || '').trim();
    const description = String(payload.description || '').trim();
    const rdbNumber = String(payload.rdbNumber || '').trim();
    const documentCompanyName = String(payload.documentCompanyName || '').trim();
    const verificationDocumentName = String(payload.verificationDocumentName || '').trim();
    const password = String(payload.password || '');

    const finalAddress = [province, district, sector, cell, street, building].filter(Boolean).join(', ') || address;

    if (!companyName || !email || !phone || !finalAddress || !password) {
      return res.status(400).json({ error: 'Company name, email, phone, address and password are required.' });
    }

    const existingCompany = await pool.query('SELECT id FROM companies WHERE email = $1', [email]);
    if (existingCompany.rowCount > 0) {
      return res.status(409).json({ error: 'A company with this email already exists.' });
    }

    const companyResult = await pool.query(
      `INSERT INTO companies (
        name, email, phone, office_phone, address, tin, business_description,
        province, district, sector, cell, street, building,
        rdb_number, document_company_name, verification_document_name, password_hash, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
       RETURNING id, name, email, phone, office_phone, address, tin, business_description, province, district, sector, cell, street, building, rdb_number, document_company_name, verification_document_name, status`,
      [
        companyName,
        email,
        phone,
        officePhone || null,
        finalAddress,
        tin || null,
        description || null,
        province || null,
        district || null,
        sector || null,
        cell || null,
        street || null,
        building || null,
        rdbNumber || null,
        documentCompanyName || null,
        verificationDocumentName || null,
        hashPassword(password),
        'Pending approval'
      ]
    );

    await pool.query(
      `INSERT INTO users (email, password_hash, role, full_name, email_verified)
       VALUES ($1, $2, 'company', $3, TRUE)
       ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, role = 'company', full_name = EXCLUDED.full_name`,
      [email, hashPassword(password), companyName]
    );

    return res.status(201).json({
      ...companyResult.rows[0],
      status: 'Pending approval',
    });
  } catch (error) {
    return res.status(500).json({ error: 'Company registration failed.', details: error.message });
  }
});

app.patch('/api/companies/:id/approve', async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE companies SET status = 'Approved' WHERE id = $1 RETURNING id, name, email, phone, address, tin, status`,
      [req.params.id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Company not found.' });
    }

    return res.json({ ...result.rows[0], status: 'Approved' });
  } catch (error) {
    return res.status(500).json({ error: 'Could not approve company.', details: error.message });
  }
});

app.patch('/api/companies/:id/cancel', async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE companies SET status = 'Cancelled' WHERE id = $1 RETURNING id, name, email, phone, address, tin, status`,
      [req.params.id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Company not found.' });
    }

    return res.json({ ...result.rows[0], status: 'Cancelled' });
  } catch (error) {
    return res.status(500).json({ error: 'Could not cancel company.', details: error.message });
  }
});

app.delete('/api/companies/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM companies WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Company not found.' });
    }
    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: 'Could not delete company.', details: error.message });
  }
});

async function startServer() {
  await initializeDatabase();
  app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
    console.log(`Database target: ${process.env.DB_NAME || 'isukuRoute'}`);
    console.log(`Admin login: ${adminEmail} / ${adminPassword}`);
  });
}

startServer().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

process.on('SIGINT', () => {
  pool.end();
  process.exit(0);
});
