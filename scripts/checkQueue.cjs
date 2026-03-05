const { Client } = require('pg');
require('dotenv').config();

(async () => {
  const c = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  await c.connect();

  // Users for mus
  const users = await c.query("SELECT id, full_name, role, clinic_id, clinic_ids FROM users WHERE client_id=3");
  console.log('=== USERS (client_id=3) ===');
  users.rows.forEach(u => console.log(`  ${u.id}: ${u.full_name} | role=${u.role} | clinic_id=${u.clinic_id} | clinic_ids=${JSON.stringify(u.clinic_ids)}`));

  // Clinics for mus
  const clinics = await c.query("SELECT id, name FROM clinics WHERE client_id=3");
  console.log('\n=== CLINICS (client_id=3) ===');
  clinics.rows.forEach(cl => console.log(`  ${cl.id}: ${cl.name}`));

  // Active patients (with visit)
  const patients = await c.query("SELECT id, full_name, current_visit FROM patients WHERE client_id=3 AND current_visit::text != '{}'");
  console.log('\n=== PATIENTS WITH ACTIVE VISITS ===');
  patients.rows.forEach(p => {
    const v = typeof p.current_visit === 'string' ? JSON.parse(p.current_visit) : p.current_visit;
    if (v.visitId && v.visitId.trim() !== '') {
      console.log(`  ${p.id}: ${p.full_name} | clinicId=${v.clinicId} | status=${v.status} | date=${new Date(v.date).toLocaleString()}`);
    }
  });

  await c.end();
})();
