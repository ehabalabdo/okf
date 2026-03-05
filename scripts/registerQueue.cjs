/**
 * Register the 10 seeded patients into the waiting queue for clinic gya (id=7)
 * Each patient gets a different check-in time
 */
const { Client } = require('pg');
require('dotenv').config();

const CLIENT_ID = 3;
const CLINIC_ID = '7'; // gya clinic

(async () => {
  const client = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  await client.connect();
  console.log('✅ Connected');

  // Get the 10 seeded patients (they have empty visitId)
  const { rows } = await client.query(
    `SELECT id, full_name, current_visit FROM patients 
     WHERE client_id=$1 AND created_by='seed-script' 
     ORDER BY id`,
    [CLIENT_ID]
  );

  console.log(`📋 Found ${rows.length} seeded patients`);

  const now = Date.now();
  let updated = 0;

  for (let i = 0; i < rows.length; i++) {
    const p = rows[i];
    // Stagger check-in times: first patient arrived 45 min ago, each next one 5 min later
    const checkInTime = now - (45 - i * 5) * 60 * 1000;
    
    // Alternate priorities — make 2 patients urgent
    const priority = (i === 2 || i === 4) ? 'urgent' : 'normal';
    
    // Reasons for visit
    const reasons = [
      'متابعة ضغط الدم',
      'متابعة السكري',
      'ألم في البطن',
      'صداع متكرر',
      'ضيق تنفس ومتابعة القلب',
      'نوبة ربو',
      'ألم أسفل الظهر',
      'متابعة الغدة الدرقية',
      'حرارة وكحة',
      'متابعة تكيس المبايض'
    ];

    const visit = {
      visitId: `visit_${Date.now()}_${i}`,
      clinicId: CLINIC_ID,
      date: checkInTime,
      status: 'waiting',
      priority,
      reasonForVisit: reasons[i] || 'فحص عام',
      source: 'walk-in'
    };

    await client.query(
      `UPDATE patients SET current_visit = $1::jsonb WHERE id = $2`,
      [JSON.stringify(visit), p.id]
    );

    const timeStr = new Date(checkInTime).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
    console.log(`✅ ${i + 1}. ${p.full_name} → ${timeStr} | ${priority === 'urgent' ? '🔴 URGENT' : '🟢 normal'} | ${reasons[i]}`);
    updated++;
  }

  console.log(`\n🎉 تم تسجيل ${updated} مريض في طابور الانتظار بعيادة gya`);
  await client.end();
})();
