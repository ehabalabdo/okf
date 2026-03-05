/**
 * Seed dummy patients for client_id=3 (mus clinic)
 * Run: node scripts/seedPatients.cjs
 */
const { Client } = require('pg');
require('dotenv').config();

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not found in .env');
  process.exit(1);
}

const CLIENT_ID = 3; // mus clinic

// First, let's get the clinics for this client
async function main() {
  const client = new Client({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });
  await client.connect();
  console.log('✅ Connected to database');

  // Get clinics for client_id=3
  const { rows: clinics } = await client.query('SELECT id, name FROM clinics WHERE client_id=$1', [CLIENT_ID]);
  console.log('📋 Clinics found:', clinics);

  if (clinics.length === 0) {
    console.log('⚠️ No clinics found. Creating a default one...');
    const { rows: newClinic } = await client.query(
      `INSERT INTO clinics (name, client_id, is_active) VALUES ('عيادة عامة', $1, true) RETURNING id, name`,
      [CLIENT_ID]
    );
    clinics.push(newClinic[0]);
    console.log('✅ Created clinic:', newClinic[0]);
  }

  const clinicId = String(clinics[0].id);

  // Arabic dummy patient data — realistic
  const patients = [
    {
      name: 'أحمد محمد العلي',
      phone: '0791234567',
      gender: 'male',
      dob: '1985-03-15',
      medicalProfile: {
        allergies: { exists: true, details: 'حساسية من البنسلين' },
        chronicConditions: { exists: true, details: 'ضغط دم مرتفع' },
        currentMedications: { exists: true, details: 'أملوديبين 5mg يومياً' },
        previousSurgeries: { exists: false, details: '' },
        isPregnant: false,
        notes: ''
      },
      history: [
        {
          visitId: 'v_seed_1a',
          clinicId,
          date: Date.now() - 30 * 86400000,
          status: 'completed',
          priority: 'normal',
          reasonForVisit: 'فحص دوري للضغط',
          chiefComplaint: 'ارتفاع ضغط الدم مع صداع متكرر',
          presentIllness: 'يعاني المريض من ارتفاع ضغط الدم منذ 5 سنوات',
          generalExamination: 'مريض واعي ومتعاون',
          vitalSigns: { bloodPressure: '150/95', pulse: 82, temperature: 36.8, respiratoryRate: 18, oxygenSaturation: 98 },
          preliminaryDiagnosis: 'ارتفاع ضغط الدم الأساسي - غير منتظم على العلاج',
          prescriptions: [
            { drugName: 'أملوديبين', dosage: '10mg', frequency: 'مرة يومياً', duration: '3 أشهر' },
            { drugName: 'هيدروكلوروثيازيد', dosage: '25mg', frequency: 'صباحاً', duration: '3 أشهر' }
          ],
          labOrders: [
            { id: 'lab_s1', testName: 'فحص وظائف الكلى', notes: '', status: 'Completed', createdAt: Date.now() - 30 * 86400000 },
            { id: 'lab_s2', testName: 'فحص الدهنيات', notes: '', status: 'Completed', createdAt: Date.now() - 30 * 86400000 }
          ],
          doctorNotes: 'يجب المتابعة بعد شهر وتعديل الجرعة حسب القراءات'
        }
      ]
    },
    {
      name: 'فاطمة حسين الزعبي',
      phone: '0782345678',
      gender: 'female',
      dob: '1990-07-22',
      medicalProfile: {
        allergies: { exists: false, details: '' },
        chronicConditions: { exists: true, details: 'سكري نوع 2' },
        currentMedications: { exists: true, details: 'ميتفورمين 850mg مرتين يومياً' },
        previousSurgeries: { exists: false, details: '' },
        isPregnant: false,
        notes: ''
      },
      history: [
        {
          visitId: 'v_seed_2a',
          clinicId,
          date: Date.now() - 45 * 86400000,
          status: 'completed',
          priority: 'normal',
          reasonForVisit: 'متابعة السكري',
          chiefComplaint: 'ارتفاع معدل السكر التراكمي',
          presentIllness: 'مريضة مصابة بالسكري منذ 3 سنوات، غير منتظمة على الحمية',
          pastMedicalHistory: 'تاريخ عائلي للسكري',
          generalExamination: 'الحالة العامة جيدة',
          vitalSigns: { bloodPressure: '125/80', pulse: 76, temperature: 36.7, respiratoryRate: 16, oxygenSaturation: 99 },
          preliminaryDiagnosis: 'سكري نوع 2 - غير منضبط',
          prescriptions: [
            { drugName: 'ميتفورمين', dosage: '1000mg', frequency: 'مرتين يومياً', duration: '3 أشهر' },
            { drugName: 'جليمبيريد', dosage: '2mg', frequency: 'قبل الفطور', duration: '3 أشهر' }
          ],
          labOrders: [
            { id: 'lab_s3', testName: 'HbA1c - السكر التراكمي', notes: 'نتيجة: 8.2%', status: 'Completed', createdAt: Date.now() - 45 * 86400000 },
            { id: 'lab_s4', testName: 'فحص شامل CBC', notes: '', status: 'Completed', createdAt: Date.now() - 45 * 86400000 }
          ],
          doctorNotes: 'تحتاج إلى تعديل الجرعة وتعليمات غذائية'
        },
        {
          visitId: 'v_seed_2b',
          clinicId,
          date: Date.now() - 10 * 86400000,
          status: 'completed',
          priority: 'normal',
          reasonForVisit: 'متابعة بعد تعديل العلاج',
          chiefComplaint: 'تحسن في معدل السكر',
          presentIllness: 'المريضة ملتزمة بالحمية الجديدة',
          vitalSigns: { bloodPressure: '120/78', pulse: 72, temperature: 36.6 },
          preliminaryDiagnosis: 'سكري نوع 2 - تحسن ملحوظ',
          labOrders: [
            { id: 'lab_s5', testName: 'HbA1c - السكر التراكمي', notes: 'نتيجة: 7.1%', status: 'Completed', createdAt: Date.now() - 10 * 86400000 },
            { id: 'lab_s6', testName: 'فحص وظائف الكلى', notes: '', status: 'Completed', createdAt: Date.now() - 10 * 86400000 }
          ],
          doctorNotes: 'نتائج ممتازة، الاستمرار على نفس العلاج مع مراجعة بعد 3 أشهر'
        }
      ]
    },
    {
      name: 'خالد سعيد المصري',
      phone: '0773456789',
      gender: 'male',
      dob: '1978-11-08',
      medicalProfile: {
        allergies: { exists: true, details: 'حساسية من السلفا والأسبرين' },
        chronicConditions: { exists: false, details: '' },
        currentMedications: { exists: false, details: '' },
        previousSurgeries: { exists: true, details: 'استئصال المرارة 2019' },
        isPregnant: false,
        notes: ''
      },
      history: [
        {
          visitId: 'v_seed_3a',
          clinicId,
          date: Date.now() - 20 * 86400000,
          status: 'completed',
          priority: 'urgent',
          reasonForVisit: 'ألم حاد في البطن',
          chiefComplaint: 'ألم شديد في الجهة اليمنى العلوية من البطن',
          presentIllness: 'بدأ الألم منذ يومين ويزداد بعد الأكل',
          surgicalHistory: 'استئصال مرارة بالمنظار 2019',
          generalExamination: 'مريض يبدو متعباً، حرارة خفيفة',
          systemicExamination: 'ألم عند الضغط على الربع العلوي الأيمن',
          vitalSigns: { bloodPressure: '130/85', pulse: 92, temperature: 37.8, respiratoryRate: 20, oxygenSaturation: 97 },
          preliminaryDiagnosis: 'التهاب في القنوات الصفراوية',
          differentialDiagnosis: 'حصوة في القناة الصفراوية، التهاب بنكرياس',
          prescriptions: [
            { drugName: 'سيبروفلوكساسين', dosage: '500mg', frequency: 'مرتين يومياً', duration: '10 أيام' },
            { drugName: 'ميترونيدازول', dosage: '500mg', frequency: '3 مرات يومياً', duration: '10 أيام' },
            { drugName: 'بانتوبرازول', dosage: '40mg', frequency: 'قبل الفطور', duration: '14 يوم' }
          ],
          labOrders: [
            { id: 'lab_s7', testName: 'CBC', notes: 'كريات بيضاء مرتفعة', status: 'Completed', createdAt: Date.now() - 20 * 86400000 },
            { id: 'lab_s8', testName: 'وظائف الكبد', notes: 'AST/ALT مرتفع', status: 'Completed', createdAt: Date.now() - 20 * 86400000 },
            { id: 'lab_s9', testName: 'Amylase/Lipase', notes: '', status: 'Completed', createdAt: Date.now() - 20 * 86400000 }
          ],
          imagingOrders: [
            { id: 'img_s1', imagingType: 'Ultrasound', bodyPart: 'البطن', notes: 'تمدد في القنوات الصفراوية', status: 'Completed', createdAt: Date.now() - 20 * 86400000 },
            { id: 'img_s2', imagingType: 'CT', bodyPart: 'البطن والحوض', notes: '', status: 'Completed', createdAt: Date.now() - 20 * 86400000 }
          ],
          doctorNotes: 'يحتاج تحويل لأخصائي جراحة عامة في حال عدم الاستجابة للعلاج'
        }
      ]
    },
    {
      name: 'نور عبدالله القاسم',
      phone: '0794567890',
      gender: 'female',
      dob: '1995-02-14',
      medicalProfile: {
        allergies: { exists: false, details: '' },
        chronicConditions: { exists: false, details: '' },
        currentMedications: { exists: false, details: '' },
        previousSurgeries: { exists: false, details: '' },
        isPregnant: false,
        notes: ''
      },
      history: [
        {
          visitId: 'v_seed_4a',
          clinicId,
          date: Date.now() - 5 * 86400000,
          status: 'completed',
          priority: 'normal',
          reasonForVisit: 'صداع متكرر',
          chiefComplaint: 'صداع نصفي متكرر منذ شهرين',
          presentIllness: 'صداع نصفي يأتي 2-3 مرات أسبوعياً، يسبقه اضطراب بصري',
          familyHistory: 'الأم تعاني من صداع نصفي',
          socialHistory: 'ضغط عمل كبير، قلة نوم',
          generalExamination: 'الحالة العامة جيدة',
          vitalSigns: { bloodPressure: '110/70', pulse: 68, temperature: 36.5 },
          preliminaryDiagnosis: 'صداع نصفي مع هالة بصرية (Migraine with Aura)',
          prescriptions: [
            { drugName: 'سوماتريبتان', dosage: '50mg', frequency: 'عند الحاجة', duration: 'شهر' },
            { drugName: 'بروبرانولول', dosage: '40mg', frequency: 'مرتين يومياً', duration: 'شهرين' }
          ],
          doctorNotes: 'نصحت بتنظيم النوم وتقليل الكافيين، مراجعة بعد شهر'
        }
      ]
    },
    {
      name: 'محمد يوسف الطراونة',
      phone: '0785678901',
      gender: 'male',
      dob: '1970-06-30',
      medicalProfile: {
        allergies: { exists: false, details: '' },
        chronicConditions: { exists: true, details: 'قصور قلبي مزمن، سكري نوع 2' },
        currentMedications: { exists: true, details: 'إنالابريل 10mg، ميتفورمين 500mg، أسبرين 81mg' },
        previousSurgeries: { exists: true, details: 'قسطرة قلبية مع تركيب دعامة 2022' },
        isPregnant: false,
        notes: 'مريض يحتاج متابعة دورية'
      },
      history: [
        {
          visitId: 'v_seed_5a',
          clinicId,
          date: Date.now() - 60 * 86400000,
          status: 'completed',
          priority: 'urgent',
          reasonForVisit: 'ضيق تنفس وتورم في القدمين',
          chiefComplaint: 'ضيق تنفس متزايد خاصة عند النوم',
          presentIllness: 'بدأ ضيق التنفس منذ أسبوع وتورم في القدمين',
          pastMedicalHistory: 'قصور قلبي، سكري، جلطة قلبية سابقة',
          surgicalHistory: 'قسطرة قلبية 2022 مع تركيب stent',
          currentMedications: 'إنالابريل، ميتفورمين، أسبرين',
          generalExamination: 'ضيق تنفس أثناء الكلام، وذمة في الساقين',
          systemicExamination: 'خراخر في قاعدتي الرئتين، JVP مرتفع',
          vitalSigns: { bloodPressure: '160/100', pulse: 98, temperature: 36.9, respiratoryRate: 24, oxygenSaturation: 92 },
          preliminaryDiagnosis: 'تفاقم حاد في قصور القلب (Acute Heart Failure Exacerbation)',
          differentialDiagnosis: 'التهاب رئوي، انسداد رئوي',
          prescriptions: [
            { drugName: 'فوروسيميد', dosage: '40mg', frequency: 'مرتين يومياً', duration: 'أسبوعين' },
            { drugName: 'كارفيديلول', dosage: '6.25mg', frequency: 'مرتين يومياً', duration: '3 أشهر' },
            { drugName: 'سبيرونولاكتون', dosage: '25mg', frequency: 'مرة يومياً', duration: '3 أشهر' }
          ],
          labOrders: [
            { id: 'lab_s10', testName: 'BNP', notes: 'مرتفع: 850 pg/ml', status: 'Completed', createdAt: Date.now() - 60 * 86400000 },
            { id: 'lab_s11', testName: 'Troponin', notes: 'سلبي', status: 'Completed', createdAt: Date.now() - 60 * 86400000 },
            { id: 'lab_s12', testName: 'وظائف الكلى', notes: 'Creatinine 1.4', status: 'Completed', createdAt: Date.now() - 60 * 86400000 }
          ],
          imagingOrders: [
            { id: 'img_s3', imagingType: 'X-ray', bodyPart: 'الصدر', notes: 'تضخم في القلب، احتقان رئوي', status: 'Completed', createdAt: Date.now() - 60 * 86400000 }
          ],
          doctorNotes: 'تم تحويل المريض لأخصائي قلب للمتابعة، يحتاج إيكو قلب'
        },
        {
          visitId: 'v_seed_5b',
          clinicId,
          date: Date.now() - 15 * 86400000,
          status: 'completed',
          priority: 'normal',
          reasonForVisit: 'متابعة بعد العلاج',
          chiefComplaint: 'تحسن ملحوظ في ضيق التنفس',
          presentIllness: 'تراجع التورم وتحسن التنفس بعد المدرات',
          generalExamination: 'الحالة العامة أفضل، لا وذمة',
          vitalSigns: { bloodPressure: '135/85', pulse: 78, temperature: 36.7, respiratoryRate: 18, oxygenSaturation: 96 },
          preliminaryDiagnosis: 'قصور قلبي مزمن - مستقر بعد العلاج',
          labOrders: [
            { id: 'lab_s13', testName: 'BNP', notes: 'تحسن: 320 pg/ml', status: 'Completed', createdAt: Date.now() - 15 * 86400000 },
            { id: 'lab_s14', testName: 'وظائف الكلى', notes: 'Creatinine 1.2 - تحسن', status: 'Completed', createdAt: Date.now() - 15 * 86400000 },
            { id: 'lab_s15', testName: 'الكتروليتات', notes: 'K+ 4.2', status: 'Completed', createdAt: Date.now() - 15 * 86400000 }
          ],
          doctorNotes: 'تحسن جيد، تقليل جرعة الفوروسيميد إلى 20mg، متابعة بعد شهر'
        }
      ]
    },
    {
      name: 'ليلى أحمد الشمري',
      phone: '0776789012',
      gender: 'female',
      dob: '2000-09-10',
      medicalProfile: {
        allergies: { exists: true, details: 'حساسية من المكسرات' },
        chronicConditions: { exists: true, details: 'ربو شعبي' },
        currentMedications: { exists: true, details: 'بخاخ سالبوتامول عند الحاجة' },
        previousSurgeries: { exists: false, details: '' },
        isPregnant: false,
        notes: ''
      },
      history: [
        {
          visitId: 'v_seed_6a',
          clinicId,
          date: Date.now() - 7 * 86400000,
          status: 'completed',
          priority: 'urgent',
          reasonForVisit: 'نوبة ربو حادة',
          chiefComplaint: 'ضيق تنفس شديد مع صفير في الصدر',
          presentIllness: 'نوبة ربو بدأت بعد التعرض للغبار، لم تستجب للبخاخ',
          pastMedicalHistory: 'ربو شعبي منذ الطفولة',
          allergies: 'حساسية من المكسرات والغبار',
          generalExamination: 'مريضة قلقة مع ضيق تنفس واضح',
          systemicExamination: 'صفير ثنائي منتشر في الرئتين، استخدام عضلات التنفس المساعدة',
          vitalSigns: { bloodPressure: '115/75', pulse: 110, temperature: 36.8, respiratoryRate: 28, oxygenSaturation: 91 },
          preliminaryDiagnosis: 'نوبة ربو حادة متوسطة الشدة',
          prescriptions: [
            { drugName: 'بريدنيزولون', dosage: '40mg', frequency: 'مرة يومياً', duration: '5 أيام' },
            { drugName: 'بخاخ فلوتيكازون/سالميتيرول', dosage: '250/50mcg', frequency: 'مرتين يومياً', duration: '3 أشهر' },
            { drugName: 'مونتيلوكاست', dosage: '10mg', frequency: 'مساءً', duration: '3 أشهر' }
          ],
          doctorNotes: 'تم إعطاء نيبيلايزر في العيادة مع تحسن فوري. تحتاج خطة علاج وقائي'
        }
      ]
    },
    {
      name: 'عمر فيصل الحداد',
      phone: '0797890123',
      gender: 'male',
      dob: '1988-04-25',
      medicalProfile: {
        allergies: { exists: false, details: '' },
        chronicConditions: { exists: false, details: '' },
        currentMedications: { exists: false, details: '' },
        previousSurgeries: { exists: false, details: '' },
        isPregnant: false,
        notes: ''
      },
      history: [
        {
          visitId: 'v_seed_7a',
          clinicId,
          date: Date.now() - 3 * 86400000,
          status: 'completed',
          priority: 'normal',
          reasonForVisit: 'ألم في أسفل الظهر',
          chiefComplaint: 'ألم في أسفل الظهر يمتد للساق اليسرى منذ أسبوعين',
          presentIllness: 'ألم بدأ بعد حمل أثقال، يزداد مع الجلوس الطويل',
          socialHistory: 'يعمل في مكتب، جلوس طويل',
          generalExamination: 'مشية طبيعية مع انحناء خفيف',
          systemicExamination: 'Straight leg raise إيجابي يسار عند 45 درجة',
          vitalSigns: { bloodPressure: '120/80', pulse: 74, temperature: 36.6 },
          preliminaryDiagnosis: 'انزلاق غضروفي قطني مشتبه (Lumbar Disc Herniation)',
          differentialDiagnosis: 'تشنج عضلي، تضيق القناة الشوكية',
          prescriptions: [
            { drugName: 'ديكلوفيناك', dosage: '75mg', frequency: 'مرتين يومياً بعد الأكل', duration: '10 أيام' },
            { drugName: 'باراسيتامول', dosage: '1g', frequency: '3 مرات يومياً', duration: '10 أيام' },
            { drugName: 'ثيوكولشيسيد', dosage: '8mg', frequency: 'مرتين يومياً', duration: '7 أيام' }
          ],
          imagingOrders: [
            { id: 'img_s4', imagingType: 'MRI', bodyPart: 'الفقرات القطنية', notes: 'لتأكيد التشخيص', status: 'Pending', createdAt: Date.now() - 3 * 86400000 }
          ],
          doctorNotes: 'تحويل للعلاج الطبيعي مع مراجعة بعد نتيجة الرنين'
        }
      ]
    },
    {
      name: 'سارة علي الرفاعي',
      phone: '0788901234',
      gender: 'female',
      dob: '1992-12-03',
      medicalProfile: {
        allergies: { exists: false, details: '' },
        chronicConditions: { exists: true, details: 'قصور الغدة الدرقية' },
        currentMedications: { exists: true, details: 'ليفوثيروكسين 75mcg صباحاً' },
        previousSurgeries: { exists: false, details: '' },
        isPregnant: false,
        notes: ''
      },
      history: [
        {
          visitId: 'v_seed_8a',
          clinicId,
          date: Date.now() - 40 * 86400000,
          status: 'completed',
          priority: 'normal',
          reasonForVisit: 'متابعة الغدة الدرقية',
          chiefComplaint: 'تعب مستمر وزيادة في الوزن',
          presentIllness: 'أعراض قصور الغدة مستمرة رغم العلاج',
          pastMedicalHistory: 'قصور الغدة الدرقية منذ 2 سنة',
          generalExamination: 'جلد جاف، بطء في الحركة',
          vitalSigns: { bloodPressure: '105/65', pulse: 58, temperature: 36.2 },
          preliminaryDiagnosis: 'قصور الغدة الدرقية - بحاجة لتعديل الجرعة',
          prescriptions: [
            { drugName: 'ليفوثيروكسين', dosage: '100mcg', frequency: 'صباحاً على الريق', duration: '3 أشهر' }
          ],
          labOrders: [
            { id: 'lab_s16', testName: 'TSH', notes: 'مرتفع: 12.5 mIU/L', status: 'Completed', createdAt: Date.now() - 40 * 86400000 },
            { id: 'lab_s17', testName: 'Free T4', notes: 'منخفض: 0.6 ng/dL', status: 'Completed', createdAt: Date.now() - 40 * 86400000 }
          ],
          doctorNotes: 'تم رفع الجرعة، فحص بعد 6 أسابيع'
        }
      ]
    },
    {
      name: 'زياد محمود البطاينة',
      phone: '0779012345',
      gender: 'male',
      dob: '2015-01-18',
      medicalProfile: {
        allergies: { exists: true, details: 'حساسية من البيض' },
        chronicConditions: { exists: false, details: '' },
        currentMedications: { exists: false, details: '' },
        previousSurgeries: { exists: false, details: '' },
        isPregnant: false,
        notes: 'طفل'
      },
      history: [
        {
          visitId: 'v_seed_9a',
          clinicId,
          date: Date.now() - 2 * 86400000,
          status: 'completed',
          priority: 'normal',
          reasonForVisit: 'حرارة وكحة',
          chiefComplaint: 'ارتفاع حرارة منذ يومين مع كحة جافة',
          presentIllness: 'طفل 11 سنة، حرارة 38.5 مع كحة جافة وسيلان أنف',
          familyHistory: 'لا يوجد أمراض وراثية',
          generalExamination: 'طفل واعي، احمرار في البلعوم',
          systemicExamination: 'أذنان سليمتان، رئتان نظيفتان',
          vitalSigns: { bloodPressure: '95/60', pulse: 100, temperature: 38.5, respiratoryRate: 22, oxygenSaturation: 98 },
          preliminaryDiagnosis: 'التهاب بلعوم فيروسي (Viral Pharyngitis)',
          differentialDiagnosis: 'التهاب لوزتين بكتيري',
          prescriptions: [
            { drugName: 'باراسيتامول شراب', dosage: '250mg/5ml', frequency: 'كل 6 ساعات عند الحرارة', duration: '5 أيام' },
            { drugName: 'شراب كحة', dosage: '5ml', frequency: '3 مرات يومياً', duration: '5 أيام' }
          ],
          doctorNotes: 'RADT سلبي للمجموعة أ. علاج عرضي فقط، مراجعة إذا استمرت الحرارة أكثر من 3 أيام'
        }
      ]
    },
    {
      name: 'هند سليمان المعايطة',
      phone: '0790123456',
      gender: 'female',
      dob: '1983-08-20',
      medicalProfile: {
        allergies: { exists: false, details: '' },
        chronicConditions: { exists: true, details: 'تكيس المبايض' },
        currentMedications: { exists: true, details: 'ميتفورمين 500mg' },
        previousSurgeries: { exists: false, details: '' },
        isPregnant: false,
        notes: ''
      },
      history: [
        {
          visitId: 'v_seed_10a',
          clinicId,
          date: Date.now() - 25 * 86400000,
          status: 'completed',
          priority: 'normal',
          reasonForVisit: 'متابعة تكيس المبايض',
          chiefComplaint: 'عدم انتظام الدورة الشهرية',
          presentIllness: 'دورة غير منتظمة، تأتي كل 40-50 يوم',
          pastMedicalHistory: 'تكيس مبايض مشخص منذ 5 سنوات',
          generalExamination: 'BMI 31 - زيادة وزن',
          vitalSigns: { bloodPressure: '120/78', pulse: 76, temperature: 36.6 },
          preliminaryDiagnosis: 'متلازمة تكيس المبايض - PCOS',
          prescriptions: [
            { drugName: 'ميتفورمين', dosage: '850mg', frequency: 'مرتين يومياً', duration: '3 أشهر' }
          ],
          labOrders: [
            { id: 'lab_s18', testName: 'هرمونات (FSH, LH, Testosterone)', notes: 'LH/FSH نسبة مرتفعة', status: 'Completed', createdAt: Date.now() - 25 * 86400000 },
            { id: 'lab_s19', testName: 'فحص سكر صائم', notes: 'طبيعي', status: 'Completed', createdAt: Date.now() - 25 * 86400000 }
          ],
          imagingOrders: [
            { id: 'img_s5', imagingType: 'Ultrasound', bodyPart: 'الحوض', notes: 'تكيسات على المبيضين', status: 'Completed', createdAt: Date.now() - 25 * 86400000 }
          ],
          doctorNotes: 'نصحت بتخفيف الوزن والرياضة، مراجعة بعد 3 أشهر'
        }
      ]
    }
  ];

  // Hash a default password
  const bcrypt = require('bcrypt');
  const defaultPassword = await bcrypt.hash('123456', 10);

  let insertedCount = 0;
  for (const p of patients) {
    const age = calculateAge(p.dob);
    const username = p.phone;
    
    try {
      await client.query(
        `INSERT INTO patients (
          full_name, age, date_of_birth, gender, phone, username, email, password, has_access,
          notes, medical_profile, current_visit, history,
          client_id, created_at, updated_at, created_by, updated_by, is_archived
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::jsonb, $12::jsonb, $13::jsonb,
                $14, NOW(), NOW(), 'seed-script', 'seed-script', false)`,
        [
          p.name,
          age,
          p.dob,
          p.gender,
          p.phone,
          username,
          null,
          defaultPassword,
          false,
          p.medicalProfile.notes || '',
          JSON.stringify(p.medicalProfile),
          JSON.stringify({
            visitId: '',
            clinicId: '',
            date: 0,
            status: 'waiting',
            priority: 'normal',
            reasonForVisit: '',
            source: 'walk-in'
          }),
          JSON.stringify(p.history),
          CLIENT_ID
        ]
      );
      insertedCount++;
      console.log(`✅ ${insertedCount}. ${p.name} — تمت الإضافة`);
    } catch (err) {
      if (err.code === '23505') {
        console.log(`⚠️ ${p.name} — موجود مسبقاً (تخطي)`);
      } else {
        console.error(`❌ ${p.name} — خطأ:`, err.message);
      }
    }
  }

  console.log(`\n🎉 تم إضافة ${insertedCount} مريض بنجاح لعيادة mus (client_id=${CLIENT_ID})`);
  await client.end();
}

function calculateAge(dobStr) {
  const dob = new Date(dobStr);
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
  return age;
}

main().catch(err => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});
