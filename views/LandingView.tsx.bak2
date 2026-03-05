import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/* ═══════════════════════════ TYPES ═══════════════════════════════ */
interface Feature {
  icon: string;
  title: string;
  titleEn: string;
  desc: string;
  color: string;
  details: string[];
}
interface FeatureCategory {
  id: string;
  label: string;
  labelEn: string;
  icon: string;
  gradient: string;
  features: Feature[];
}

/* ═══════════════════════ COUNT-UP HOOK ═══════════════════════════ */
const useCountUp = (end: number, duration = 2200, start = 0) => {
  const [value, setValue] = useState(start);
  const ref = useRef<HTMLDivElement>(null);
  const counted = useRef(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting && !counted.current) {
          counted.current = true;
          const t0 = performance.now();
          const tick = (now: number) => {
            const p = Math.min((now - t0) / duration, 1);
            const ease = 1 - Math.pow(1 - p, 4);
            setValue(Math.round(start + (end - start) * ease));
            if (p < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.3 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [end, duration, start]);
  return { value, ref };
};

/* ═══════════════════════ FEATURE DATA ═══════════════════════════ */
const featureCategories: FeatureCategory[] = [
  {
    id: 'clinic', label: 'إدارة العيادة', labelEn: 'Clinic Ops', icon: 'fa-hospital', gradient: 'from-cyan-500 to-blue-600',
    features: [
      { icon: 'fa-hospital-user', title: 'إدارة العيادات المتعددة', titleEn: 'Multi-Clinic', desc: 'عيادات وأقسام غير محدودة من لوحة تحكم واحدة.', color: 'cyan', details: ['إنشاء عيادات وأقسام غير محدودة','تعيين كوادر بصلاحيات منفصلة','لوحة تحكم مركزية','تقارير مقارنة بين الفروع','إعدادات مستقلة لكل عيادة'] },
      { icon: 'fa-user-nurse', title: 'الاستقبال الذكي', titleEn: 'Smart Reception', desc: 'تسجيل المرضى وإدارة الانتظار بنقرة واحدة.', color: 'cyan', details: ['تسجيل دخول بنقرة واحدة','إدارة قائمة الانتظار','تحويل فوري للعيادة','إشعارات فورية للطبيب','بحث بالاسم أو الهاتف أو الرقم الوطني','عرض حالة المريض لحظياً'] },
      { icon: 'fa-calendar-check', title: 'نظام المواعيد', titleEn: 'Appointments', desc: 'حجز وتأكيد وتذكير تلقائي بدون تضارب.', color: 'cyan', details: ['عرض يومي/أسبوعي/شهري','حالات: مؤكد، معلق، ملغي، مكتمل','منع التضارب التلقائي','ملاحظات وسبب الزيارة','ربط مع شاشة الانتظار','تذكير عبر واتساب'] },
      { icon: 'fa-tv', title: 'شاشة الانتظار', titleEn: 'Queue Display', desc: 'شاشة حية بنداء صوتي تلقائي.', color: 'cyan', details: ['تصميم احترافي للـ TV','نداء صوتي باسم المريض','تحديث Real-time','رقم الدور والطبيب والعيادة','دعم عربي/إنجليزي','بدون تحديث يدوي للصفحة'] },
    ]
  },
  {
    id: 'medical', label: 'الملف الطبي', labelEn: 'Medical', icon: 'fa-stethoscope', gradient: 'from-emerald-500 to-teal-600',
    features: [
      { icon: 'fa-user-doctor', title: 'لوحة الطبيب', titleEn: 'Doctor Dashboard', desc: 'تشخيص، وصفات، خطط علاجية، مرفقات.', color: 'emerald', details: ['ملف طبي شامل لكل مريض','تشخيصات وملاحظات تفصيلية','وصفات طبية قابلة للطباعة','رفع صور وأشعة وتحاليل','خطط علاجية متعددة الجلسات','قوالب جاهزة للتشخيصات الشائعة'] },
      { icon: 'fa-clipboard-list', title: 'السجل السريري', titleEn: 'Clinical History', desc: 'تاريخ كامل لكل زيارة وعلاج.', color: 'emerald', details: ['عرض زمني للزيارات','تصفية حسب التاريخ أو النوع','ملاحظات ومرفقات لكل زيارة','طباعة ملخص السجل','مشاركة مع طبيب آخر','أرشيف كامل قابل للبحث'] },
      { icon: 'fa-address-book', title: 'سجل المرضى', titleEn: 'Patient Registry', desc: 'قاعدة بيانات شاملة مع بحث متقدم.', color: 'emerald', details: ['بيانات ديموغرافية كاملة','بحث متقدم وفلترة','تصدير إلى Excel','إحصائيات جدد وعائدين','تاريخ أول وآخر زيارة','أرقام التواصل والرقم الوطني'] },
      { icon: 'fa-mobile-screen', title: 'بوابة المريض', titleEn: 'Patient Portal', desc: 'المريض يحجز ويتابع ملفه بنفسه.', color: 'emerald', details: ['تسجيل دخول بالجوال','عرض السجل الطبي الكامل','حجز وإلغاء المواعيد','عرض الوصفات والتعليمات','متابعة الطلبات والحجوزات','واجهة بسيطة للمريض'] },
    ]
  },
  {
    id: 'financial', label: 'المالية', labelEn: 'Finance', icon: 'fa-coins', gradient: 'from-amber-500 to-orange-600',
    features: [
      { icon: 'fa-file-invoice-dollar', title: 'الفواتير والمحاسبة', titleEn: 'Billing', desc: 'فواتير تفصيلية ودفعات جزئية وتقارير مالية.', color: 'amber', details: ['فواتير تفصيلية مع بنود','دفعات جزئية ومتابعة المتبقي','تقارير يومية وشهرية وسنوية','طباعة احترافية','خصومات مرنة','ربط مع ملف المريض'] },
      { icon: 'fa-tags', title: 'كتالوج الخدمات', titleEn: 'Service Catalog', desc: 'إدارة الخدمات والأسعار بمرونة تامة.', color: 'amber', details: ['قائمة خدمات شاملة','تصنيف حسب القسم','تعديل أسعار مع حفظ التاريخ','ربط مع الفواتير','تصدير إلى Excel','دعم العملات المختلفة'] },
      { icon: 'fa-chart-pie', title: 'التقارير والـ KPI', titleEn: 'Reports & KPI', desc: 'لوحة مؤشرات أداء ورسوم بيانية تفاعلية.', color: 'amber', details: ['إيرادات ومصروفات','إحصائيات المرضى','أداء الأطباء','رسوم بيانية تفاعلية','مقارنة بين الفترات','لوحة KPI للإدارة'] },
    ]
  },
  {
    id: 'hr', label: 'الموارد البشرية', labelEn: 'HR', icon: 'fa-people-group', gradient: 'from-violet-500 to-purple-600',
    features: [
      { icon: 'fa-id-card', title: 'إدارة الموظفين', titleEn: 'Employees', desc: 'ملفات كاملة، هيكل تنظيمي، صلاحيات.', color: 'violet', details: ['ملف شامل لكل موظف','تحديد القسم والراتب','بدلات وخصومات','هيكل تنظيمي شجري','تاريخ التوظيف والترقيات','صلاحيات حسب الدور'] },
      { icon: 'fa-fingerprint', title: 'الحضور والبصمة', titleEn: 'Biometric', desc: 'ربط مع أجهزة البصمة وحساب الساعات آلياً.', color: 'violet', details: ['ربط أجهزة البصمة','تسجيل يدوي بديل','حساب ساعات العمل والتأخير','تقارير حضور مفصلة','إشعارات تأخير وغياب','دعم الورديات المرنة'] },
      { icon: 'fa-money-check-dollar', title: 'الرواتب و PDF', titleEn: 'Payroll', desc: 'معالجة رواتب وكشف PDF يحمله الموظف.', color: 'violet', details: ['حساب الراتب آلياً بناءً على الحضور','بدلات وخصومات مرنة','كشف راتب PDF احترافي','الموظف يحمّل كشفه','تقارير رواتب للإدارة','دعم العملات المحلية'] },
      { icon: 'fa-chart-bar', title: 'تقارير HR', titleEn: 'HR Reports', desc: 'تقارير حضور ورواتب وأداء.', color: 'violet', details: ['تقارير حضور وغياب','تكلفة رواتب شهرية','إحصائيات إنتاجية','تقارير إجازات','تصدير Excel و PDF','مقارنة أداء الأقسام'] },
    ]
  },
  {
    id: 'specialty', label: 'وحدات متخصصة', labelEn: 'Specialty', icon: 'fa-puzzle-piece', gradient: 'from-rose-500 to-pink-600',
    features: [
      { icon: 'fa-tooth', title: 'مختبر الأسنان', titleEn: 'Dental Lab', desc: 'إدارة حالات المختبر مع تتبع لحظي.', color: 'rose', details: ['إرسال حالة من الطبيب مباشرة','تتبع (جديد، قيد التنفيذ، جاهز)','ملاحظات ومواصفات تفصيلية','ربط مع ملف المريض','تقارير إنتاجية','إشعارات فورية'] },
      { icon: 'fa-screwdriver-wrench', title: 'شركة الزراعات', titleEn: 'Implant Co.', desc: 'مخزون زراعات وطلبات وتقارير.', color: 'rose', details: ['كتالوج منتجات الزراعة','تتبع المخزون','طلبات الأطباء','ربط مع المريض والطبيب','تقارير مبيعات','إشعارات انخفاض المخزون'] },
      { icon: 'fa-graduation-cap', title: 'الأكاديمية', titleEn: 'Academy', desc: 'دورات تدريبية وشهادات وحضور.', color: 'rose', details: ['إنشاء دورات تدريبية','تسجيل طلاب ومجموعات','جدولة جلسات','متابعة حضور','إصدار شهادات إتمام','تقييم المدربين'] },
      { icon: 'fa-microchip', title: 'ربط الأجهزة الطبية', titleEn: 'Device Integration', desc: 'استقبال نتائج HL7 تلقائياً في الملف الطبي.', color: 'rose', details: ['بروتوكول HL7','نتائج مباشرة في الملف','Serial Port و MLLP','تنبيهات القيم غير الطبيعية','أرشفة تلقائية','Bridge Agent سحابي'] },
    ]
  },
  {
    id: 'platform', label: 'المنصة', labelEn: 'Platform', icon: 'fa-shield-halved', gradient: 'from-sky-500 to-indigo-600',
    features: [
      { icon: 'fa-shield-halved', title: 'الأمان والخصوصية', titleEn: 'Security', desc: 'تشفير، صلاحيات، حماية متقدمة.', color: 'sky', details: ['تشفير SSL/TLS','صلاحيات متعددة المستويات','Rate Limiting + Helmet + CORS','JWT Token','تسجيل أنشطة','فصل بيانات العملاء'] },
      { icon: 'fa-language', title: 'عربي وإنجليزي', titleEn: 'Multi-Language', desc: 'تبديل فوري بين اللغتين.', color: 'sky', details: ['واجهة عربية RTL كاملة','تبديل فوري للإنجليزية','تقارير وفواتير بكلتا اللغتين','تذكر اللغة المفضلة','خدمات وتشخيصات بكلتا اللغتين','قابل لإضافة لغات مستقبلاً'] },
      { icon: 'fa-moon', title: 'الوضع الليلي', titleEn: 'Dark Mode', desc: 'وضع ليلي مريح مع تبديل فوري.', color: 'sky', details: ['وضع ليلي مريح للعين','وضع نهاري واضح','تبديل فوري','حفظ تفضيل المستخدم','تصميم متجاوب','ألوان احترافية لكلا الوضعين'] },
      { icon: 'fa-building', title: 'SaaS متعددة العملاء', titleEn: 'Multi-Tenant', desc: 'كل مركز برابطه وبياناته المستقلة.', color: 'sky', details: ['رابط مخصص لكل عميل','بيانات منفصلة تماماً','لوحة Super Admin','إنشاء عميل بدقائق','خطط اشتراك مرنة','نسخ احتياطي تلقائي'] },
      { icon: 'fa-brands fa-whatsapp', title: 'تكامل واتساب', titleEn: 'WhatsApp', desc: 'تأكيد مواعيد وتذكيرات عبر واتساب.', color: 'green', details: ['تأكيد موعد تلقائي','تذكير قبل الموعد','رابط حجز للمريض','رد سريع على استفسارات','زر واتساب في ملف المريض','إشعارات مخصصة'] },
    ]
  },
];

const allFeatures = featureCategories.flatMap(c => c.features);

/* ═══════════════════════ AUTOMATION FLOW ════════════════════════ */
const automationSteps = [
  { icon: 'fa-calendar-plus', label: 'مريض يحجز موعد', color: 'from-cyan-500 to-blue-500' },
  { icon: 'fa-bell', label: 'إشعار للطبيب', color: 'from-blue-500 to-indigo-500' },
  { icon: 'fa-user-check', label: 'تسجيل الحضور', color: 'from-indigo-500 to-violet-500' },
  { icon: 'fa-stethoscope', label: 'فحص وتشخيص', color: 'from-violet-500 to-purple-500' },
  { icon: 'fa-file-invoice-dollar', label: 'فاتورة تلقائية', color: 'from-purple-500 to-pink-500' },
  { icon: 'fa-chart-line', label: 'تقرير KPI', color: 'from-pink-500 to-rose-500' },
];

/* ═══════════════════════ COMPONENT ══════════════════════════════ */
const rotatingWords = ['ذكية', 'مؤتمتة', 'دقيقة', 'متكاملة', 'بلا أخطاء'];

const LandingView: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [activeCategory, setActiveCategory] = useState('clinic');
  const [selectedFeature, setSelectedFeature] = useState<Feature | null>(null);
  const [activeFlowStep, setActiveFlowStep] = useState(0);
  const [wordIndex, setWordIndex] = useState(0);

  useEffect(() => {
    const iv = setInterval(() => setWordIndex(i => (i + 1) % rotatingWords.length), 2000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', h);
    return () => window.removeEventListener('scroll', h);
  }, []);

  useEffect(() => {
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('revealed'); }),
      { threshold: 0.1 },
    );
    document.querySelectorAll('.reveal-on-scroll').forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, [activeCategory]);

  useEffect(() => {
    const iv = setInterval(() => setActiveFlowStep(s => (s + 1) % automationSteps.length), 2200);
    return () => clearInterval(iv);
  }, []);

  const closeModal = useCallback(() => setSelectedFeature(null), []);

  const patientsToday = useCountUp(47, 2000);
  const revenue = useCountUp(3850, 2500);
  const occupancy = useCountUp(89, 2000);
  const appointmentsCount = useCountUp(24, 1800);

  const colorMap: Record<string, { bg: string; text: string; border: string; glow: string }> = {
    cyan:    { bg: 'bg-cyan-500/10',    text: 'text-cyan-400',    border: 'border-cyan-500/20',    glow: 'shadow-cyan-500/20' },
    emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20', glow: 'shadow-emerald-500/20' },
    amber:   { bg: 'bg-amber-500/10',   text: 'text-amber-400',   border: 'border-amber-500/20',   glow: 'shadow-amber-500/20' },
    violet:  { bg: 'bg-violet-500/10',  text: 'text-violet-400',  border: 'border-violet-500/20',  glow: 'shadow-violet-500/20' },
    rose:    { bg: 'bg-rose-500/10',    text: 'text-rose-400',    border: 'border-rose-500/20',    glow: 'shadow-rose-500/20' },
    sky:     { bg: 'bg-sky-500/10',     text: 'text-sky-400',     border: 'border-sky-500/20',     glow: 'shadow-sky-500/20' },
    green:   { bg: 'bg-green-500/10',   text: 'text-green-400',   border: 'border-green-500/20',   glow: 'shadow-green-500/20' },
  };

  const currentCategory = featureCategories.find(c => c.id === activeCategory)!;

  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-x-hidden" style={{ fontFamily: "'Cairo', 'Plus Jakarta Sans', sans-serif" }}>

      {/* ════════════════ NAVBAR ════════════════ */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? 'bg-slate-950/90 backdrop-blur-xl shadow-2xl shadow-black/20 border-b border-white/5' : 'bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="MED LOOP" className="w-10 h-10 object-contain" />
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">MED LOOP</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            {[
              { href: '#command-center', label: 'المنصة' },
              { href: '#features', label: 'المميزات' },
              { href: '#transform', label: 'التحول' },
              { href: '#tech', label: 'البنية التحتية' },
              { href: '#contact', label: 'تواصل معنا' },
            ].map(l => (
              <a key={l.href} href={l.href} className="text-slate-400 hover:text-primary transition-colors text-sm font-medium">{l.label}</a>
            ))}
          </div>
          <button onClick={() => setMobileMenu(!mobileMenu)} className="md:hidden text-slate-400 hover:text-white text-xl">
            <i className={`fa-solid ${mobileMenu ? 'fa-xmark' : 'fa-bars'}`}></i>
          </button>
        </div>
        {mobileMenu && (
          <div className="md:hidden bg-slate-950/95 backdrop-blur-xl border-t border-white/5 px-6 py-4 space-y-3">
            {['#command-center', '#features', '#transform', '#tech', '#contact'].map((h, i) => (
              <a key={h} href={h} onClick={() => setMobileMenu(false)} className="block text-slate-300 hover:text-primary py-2">
                {['المنصة', 'المميزات', 'التحول', 'البنية التحتية', 'تواصل معنا'][i]}
              </a>
            ))}
          </div>
        )}
      </nav>

      {/* ════════════════ HERO — ROTATING HEADLINE ════════════════ */}
      <section className="relative min-h-screen flex items-center overflow-hidden bg-[#060a13]">
        {/* Noise texture overlay */}
        <div className="absolute inset-0 opacity-[0.015] pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")', backgroundRepeat: 'repeat' }} />

        {/* Gradient orbs — very subtle */}
        <div className="absolute top-[-10%] right-[-5%] w-[700px] h-[700px] rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(56,189,248,0.06) 0%, transparent 70%)' }} />
        <div className="absolute bottom-[-15%] left-[-10%] w-[800px] h-[800px] rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.04) 0%, transparent 70%)' }} />

        {/* Fine horizontal lines — enterprise feel */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[20, 35, 50, 65, 80].map(top => (
            <div key={top} className="absolute w-full h-px" style={{ top: `${top}%`, background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.03) 30%, rgba(255,255,255,0.03) 70%, transparent 100%)' }} />
          ))}
        </div>

        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 md:px-12 lg:px-16 py-32 md:py-40">
          <div className="grid lg:grid-cols-[1fr_0.85fr] gap-16 xl:gap-28 items-center">

            {/* ── Text Column ── */}
            <div className="text-right hero-text-enter">
              {/* Eyebrow */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                className="inline-flex items-center gap-2.5 px-5 py-2 bg-white/[0.04] border border-white/[0.06] rounded-full text-white/40 text-[13px] font-medium mb-10 backdrop-blur-sm"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50"></span>
                نظام تشغيل للمراكز الطبية
              </motion.div>

              {/* Main headline */}
              <h1 className="mb-10">
                <motion.span
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  className="block text-[clamp(2.8rem,6vw,5rem)] font-extrabold text-white/90 leading-[1.15] mb-4"
                  style={{ fontFamily: "'Cairo', sans-serif" }}
                >
                  إدارة طبية
                </motion.span>

                {/* Rotating word container — generous height, no clip issues */}
                <span className="block relative" style={{ height: 'clamp(4rem, 8vw, 6.5rem)' }}>
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={rotatingWords[wordIndex]}
                      initial={{ opacity: 0, y: 40, filter: 'blur(8px)' }}
                      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                      exit={{ opacity: 0, y: -40, filter: 'blur(8px)' }}
                      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                      className="absolute right-0 top-0 text-[clamp(2.8rem,6vw,5rem)] font-extrabold leading-[1.3]"
                      style={{ fontFamily: "'Cairo', sans-serif", WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundImage: 'linear-gradient(135deg, #38bdf8 0%, #a78bfa 50%, #818cf8 100%)' }}
                    >
                      {rotatingWords[wordIndex]}
                    </motion.span>
                  </AnimatePresence>

                  {/* Soft glow under rotating text */}
                  <div className="absolute bottom-0 right-0 w-48 h-1 rounded-full bg-gradient-to-l from-sky-400/20 via-violet-400/15 to-transparent" />
                </span>
              </h1>

              {/* Subheading */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.55, ease: [0.22, 1, 0.36, 1] }}
                className="text-white/30 text-lg md:text-xl leading-relaxed max-w-md mr-0 ml-auto lg:ml-0 mb-12"
                style={{ fontFamily: "'Cairo', sans-serif" }}
              >
                منصة تشغيل متكاملة للمراكز الطبية الحديثة.
              </motion.p>

              {/* CTAs */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.7, ease: [0.22, 1, 0.36, 1] }}
                className="flex flex-col sm:flex-row gap-4 justify-end lg:justify-start"
              >
                <a href="#contact" className="group relative px-8 py-4 bg-white text-[#060a13] font-bold rounded-full text-[15px] text-center transition-all duration-300 hover:shadow-[0_0_40px_rgba(255,255,255,0.12)]">
                  اطلب عرض تجريبي
                  <i className="fa-solid fa-arrow-left mr-2.5 text-xs group-hover:-translate-x-1.5 inline-block transition-transform duration-300"></i>
                </a>
                <a href="#demo-video" className="group px-8 py-4 border border-white/10 text-white/60 font-bold rounded-full text-[15px] text-center transition-all duration-300 hover:text-white/90 hover:border-white/20 hover:bg-white/[0.03]">
                  شاهد كيف يعمل النظام
                  <i className="fa-solid fa-play mr-2.5 text-[10px] opacity-40 group-hover:opacity-80 transition-opacity duration-300"></i>
                </a>
              </motion.div>
            </div>

            {/* ── Dashboard Mockup ── */}
            <div className="hero-dashboard-enter hidden lg:block">
              <motion.div
                initial={{ opacity: 0, y: 40, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 1.2, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="relative"
              >
                {/* Ambient glow */}
                <div className="absolute -inset-12 rounded-[40px] pointer-events-none" style={{ background: 'radial-gradient(ellipse at 60% 40%, rgba(56,189,248,0.06) 0%, rgba(99,102,241,0.04) 40%, transparent 70%)' }} />

                <div className="relative bg-white/[0.03] border border-white/[0.06] rounded-[24px] p-6 backdrop-blur-xl overflow-hidden">
                  {/* Top bar */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-white/[0.08]" />
                      <div className="w-2.5 h-2.5 rounded-full bg-white/[0.08]" />
                      <div className="w-2.5 h-2.5 rounded-full bg-white/[0.08]" />
                    </div>
                    <span className="text-[9px] text-white/[0.12] font-mono tracking-[0.2em] uppercase">Control Center</span>
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/80 animate-pulse"></span>
                      <span className="text-[9px] text-emerald-400/40 font-mono">LIVE</span>
                    </div>
                  </div>

                  {/* KPI cards */}
                  <div className="grid grid-cols-4 gap-2.5 mb-4">
                    {[
                      { ref: patientsToday.ref, val: patientsToday.value, label: 'مرضى', color: 'text-cyan-400/80', suffix: '' },
                      { ref: revenue.ref, val: revenue.value, label: 'إيرادات', color: 'text-amber-400/80', suffix: '' },
                      { ref: occupancy.ref, val: occupancy.value, label: 'إشغال', color: 'text-emerald-400/80', suffix: '%' },
                      { ref: appointmentsCount.ref, val: appointmentsCount.value, label: 'مواعيد', color: 'text-violet-400/80', suffix: '' },
                    ].map((s, i) => (
                      <div key={i} ref={s.ref as React.Ref<HTMLDivElement>} className="bg-white/[0.02] border border-white/[0.04] rounded-xl p-3 text-center">
                        <div className={`text-lg font-bold ${s.color} tabular-nums`}>{s.val}{s.suffix}</div>
                        <div className="text-[8px] text-white/[0.15] mt-1 font-medium">{s.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Chart */}
                  <div className="bg-white/[0.02] border border-white/[0.04] rounded-xl p-4 mb-3">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[9px] text-white/[0.2] font-medium">إيرادات الأسبوع</span>
                      <span className="text-[9px] text-emerald-400/50 font-mono">+12.5%</span>
                    </div>
                    <div className="flex items-end gap-1.5 h-16">
                      {[30, 48, 36, 62, 44, 70, 55].map((h, i) => (
                        <div key={i} className="flex-1 rounded-sm chart-bar-grow" style={{ height: `${h}%`, animationDelay: `${i * 120 + 1000}ms`, background: `linear-gradient(to top, rgba(56,189,248,${0.12 + i * 0.02}), rgba(99,102,241,0.04))` }} />
                      ))}
                    </div>
                  </div>

                  {/* Patients */}
                  <div className="bg-white/[0.02] border border-white/[0.04] rounded-xl p-4">
                    <div className="text-[9px] text-white/[0.15] mb-3 font-medium">آخر المرضى</div>
                    {['أحمد محمد', 'سارة علي', 'خالد يوسف'].map((name, i) => (
                      <div key={i} className="flex items-center gap-3 py-2 border-b border-white/[0.03] last:border-0 patient-row-enter" style={{ animationDelay: `${1400 + i * 200}ms` }}>
                        <div className="w-6 h-6 rounded-full bg-white/[0.04] flex items-center justify-center text-[9px] text-white/20 font-bold">
                          {name.charAt(0)}
                        </div>
                        <span className="text-[10px] text-white/25 flex-1 text-right">{name}</span>
                        <span className={`text-[8px] px-2 py-0.5 rounded-full font-medium
                          ${i === 0 ? 'bg-emerald-500/[0.06] text-emerald-400/50' : i === 1 ? 'bg-amber-500/[0.06] text-amber-400/50' : 'bg-cyan-500/[0.06] text-cyan-400/50'}`}>
                          {i === 0 ? 'عند الطبيب' : i === 1 ? 'منتظر' : 'وصل'}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Subtle inner border glow on top edge */}
                  <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
                </div>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10">
          <motion.div animate={{ y: [0, 6, 0] }} transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}>
            <div className="w-5 h-9 rounded-full border border-white/[0.08] flex items-start justify-center pt-2">
              <div className="w-0.5 h-1.5 rounded-full bg-white/[0.15]" />
            </div>
          </motion.div>
        </div>
      </section>

      {/* ════════════════ AUTOMATION FLOW ════════════════ */}
      <section id="command-center" className="py-20 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900/50 to-slate-950 pointer-events-none" />
        <div className="max-w-5xl mx-auto relative">
          <div className="text-center mb-12 reveal-on-scroll">
            <div className="inline-block px-4 py-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-indigo-400 text-xs font-bold mb-4">
              <i className="fa-solid fa-wand-magic-sparkles ml-1"></i> أتمتة ذكية
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-3">
              من الحجز إلى التقرير — <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">تلقائياً</span>
            </h2>
            <p className="text-slate-500 text-lg">كل خطوة تتحول للخطوة التالية بدون تدخل يدوي</p>
          </div>

          <div className="reveal-on-scroll flex flex-wrap justify-center items-center gap-2 md:gap-0">
            {automationSteps.map((step, i) => (
              <React.Fragment key={i}>
                <div
                  className={`relative flex flex-col items-center transition-all duration-500 cursor-pointer
                    ${activeFlowStep === i ? 'scale-110' : 'scale-100 opacity-60'}`}
                  onClick={() => setActiveFlowStep(i)}
                >
                  <div className={`w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center text-white text-xl md:text-2xl
                    shadow-lg transition-all duration-500 ${activeFlowStep === i ? 'shadow-xl shadow-primary/30 ring-2 ring-white/20' : 'shadow-none'}`}>
                    <i className={`fa-solid ${step.icon}`}></i>
                  </div>
                  <span className={`mt-3 text-xs md:text-sm font-bold text-center max-w-[90px] transition-colors duration-300
                    ${activeFlowStep === i ? 'text-white' : 'text-slate-500'}`}>
                    {step.label}
                  </span>
                  {activeFlowStep === i && (
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-1 bg-gradient-to-r from-primary to-secondary rounded-full flow-indicator" />
                  )}
                </div>
                {i < automationSteps.length - 1 && (
                  <div className={`hidden md:flex items-center mx-1 transition-all duration-500`}>
                    <div className={`w-8 h-0.5 transition-colors duration-500 ${activeFlowStep >= i ? 'bg-gradient-to-r from-primary to-secondary' : 'bg-slate-800'}`} />
                    <i className={`fa-solid fa-caret-left text-xs -ml-0.5 transition-colors ${activeFlowStep >= i ? 'text-secondary' : 'text-slate-800'}`}></i>
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════ IMAGINE YOUR CENTER ════════════════ */}
      <section id="transform" className="py-24 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-5xl mx-auto relative">
          <div className="text-center mb-16 reveal-on-scroll">
            <div className="inline-block px-4 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-xs font-bold mb-4">
              <i className="fa-solid fa-wand-magic-sparkles ml-1"></i> التحول
            </div>
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              تخيّل مركزك بعد <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400">٦ أشهر</span>
            </h2>
            <p className="text-slate-500 text-lg max-w-xl mx-auto">النتيجة اللي بتنتظرك — مش مجرد ميزات، بل واقع جديد لمركزك</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { icon: 'fa-file-circle-xmark', text: 'لا ورق — كل شي رقمي', delay: 0 },
              { icon: 'fa-calculator', text: 'لا أخطاء محاسبة — كل فاتورة مربوطة', delay: 80 },
              { icon: 'fa-calendar-xmark', text: 'لا تضارب مواعيد — النظام يمنعها', delay: 160 },
              { icon: 'fa-chart-column', text: 'تقارير جاهزة بضغطة زر', delay: 240 },
              { icon: 'fa-gauge-high', text: 'كل طبيب عنده لوحة تحكم خاصة', delay: 320 },
              { icon: 'fa-building-columns', text: 'مركزك صار يشتغل Corporate', delay: 400 },
            ].map((item, i) => (
              <div key={i} className="reveal-on-scroll group flex items-center gap-4 bg-slate-900/40 border border-slate-800 rounded-2xl p-5 hover:border-emerald-500/20 hover:bg-slate-900/60 transition-all duration-500"
                   style={{ animationDelay: `${item.delay}ms` }}>
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 flex items-center justify-center text-emerald-400 text-lg group-hover:scale-110 transition-transform shrink-0">
                  <i className={`fa-solid ${item.icon}`}></i>
                </div>
                <span className="text-white font-bold text-sm md:text-base">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════ TRADITIONAL VS MED LOOP ════════════════ */}
      <section className="py-24 px-6 bg-gradient-to-b from-slate-950 to-slate-900 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-red-500/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="max-w-5xl mx-auto relative">
          <div className="text-center mb-16 reveal-on-scroll">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              ليش الأنظمة التقليدية <span className="text-red-400">تفشل</span>؟
            </h2>
            <p className="text-slate-500 text-lg">الفرق بين الماضي والمستقبل</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 reveal-on-scroll">
            <div className="bg-red-500/5 border border-red-500/10 rounded-2xl p-8 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 to-orange-500 opacity-50" />
              <h3 className="text-lg font-bold text-red-400 mb-6 flex items-center gap-2">
                <i className="fa-solid fa-triangle-exclamation"></i>
                النظام التقليدي
              </h3>
              <div className="space-y-4">
                {[
                  'برنامج محلي قديم على كمبيوتر واحد',
                  'بيانات على جهاز واحد — تعطل = كارثة',
                  'بدون نسخ احتياطي تلقائي',
                  'بدون بوابة للمريض',
                  'بدون تقارير ذكية',
                  'بدون ربط أجهزة طبية',
                  'بدون نظام مواعيد ذكي',
                  'واجهة قديمة صعبة الاستخدام',
                ].map((t, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-lg bg-red-500/10 flex items-center justify-center shrink-0">
                      <i className="fa-solid fa-xmark text-red-400 text-xs"></i>
                    </div>
                    <span className="text-slate-400 text-sm">{t}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-primary/5 border border-primary/10 rounded-2xl p-8 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-secondary" />
              <h3 className="text-lg font-bold text-primary mb-6 flex items-center gap-2">
                <i className="fa-solid fa-shield-halved"></i>
                MED LOOP
              </h3>
              <div className="space-y-4">
                {[
                  'منصة سحابية — افتح من أي مكان',
                  'بياناتك آمنة على سيرفرات عالمية',
                  'نسخ احتياطي تلقائي يومي',
                  'بوابة مريض كاملة المزايا',
                  'تقارير KPI ورسوم بيانية تفاعلية',
                  'ربط أجهزة طبية عبر HL7',
                  'مواعيد ذكية مع منع التضارب',
                  'واجهة حديثة سهلة بالعربي والإنجليزي',
                ].map((t, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
                      <i className="fa-solid fa-check text-primary text-xs"></i>
                    </div>
                    <span className="text-slate-300 text-sm">{t}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════ MULTI-TENANT ════════════════ */}
      <section className="py-24 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-indigo-500/5 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-5xl mx-auto relative">
          <div className="text-center mb-16 reveal-on-scroll">
            <div className="inline-block px-4 py-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-indigo-400 text-xs font-bold mb-4">
              <i className="fa-solid fa-server ml-1"></i> بنية مؤسسية
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              كل مركز — <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400">بيئة مستقلة تماماً</span>
            </h2>
            <p className="text-slate-500 text-lg">مش برنامج مشترك — كل عميل بعالمه الخاص</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 reveal-on-scroll">
            {[
              { icon: 'fa-globe', title: 'رابط مخصص', desc: 'كل مركز برابط خاص (subdomain) له هويته', gradient: 'from-cyan-500 to-blue-500' },
              { icon: 'fa-database', title: 'بيانات معزولة', desc: 'قاعدة بيانات منفصلة لكل عميل — خصوصية كاملة', gradient: 'from-indigo-500 to-violet-500' },
              { icon: 'fa-lock', title: 'حماية مستقلة', desc: 'تشفير وصلاحيات منفصلة لكل مركز', gradient: 'from-violet-500 to-purple-500' },
              { icon: 'fa-sliders', title: 'تحكم كامل', desc: 'إعدادات مخصصة — خدمات، أسعار، فريق عمل', gradient: 'from-purple-500 to-pink-500' },
            ].map((item, i) => (
              <div key={i} className="group bg-slate-900/50 border border-slate-800 rounded-2xl p-6 text-center hover:border-indigo-500/20 transition-all duration-500 hover:-translate-y-1"
                   style={{ animationDelay: `${i * 100}ms` }}>
                <div className={`w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br ${item.gradient} flex items-center justify-center text-white text-xl mb-4 group-hover:scale-110 group-hover:shadow-lg transition-all duration-300`}>
                  <i className={`fa-solid ${item.icon}`}></i>
                </div>
                <h3 className="text-white font-bold mb-2">{item.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>

          <div className="text-center mt-10 reveal-on-scroll">
            <div className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900/60 border border-white/5 rounded-xl text-sm text-slate-400">
              <i className="fa-solid fa-globe text-primary"></i>
              <span>med.loopjo.com/<strong className="text-white">اسم-مركزك</strong></span>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════ FEATURES ════════════════ */}
      <section id="features" className="py-24 px-6 bg-gradient-to-b from-slate-950 via-slate-900/30 to-slate-950 relative">
        <div className="max-w-7xl mx-auto relative">
          <div className="text-center mb-12 reveal-on-scroll">
            <div className="inline-block px-4 py-1.5 bg-primary/10 border border-primary/20 rounded-full text-primary text-xs font-bold mb-4">
              <i className="fa-solid fa-cubes ml-1"></i> {allFeatures.length}+ ميزة
            </div>
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              كل ما تحتاجه في <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">منصة واحدة</span>
            </h2>
            <p className="text-slate-500 text-lg">اضغط على أي ميزة لتفاصيلها الكاملة</p>
          </div>

          <div className="flex flex-wrap justify-center gap-2 mb-10 reveal-on-scroll">
            {featureCategories.map(cat => (
              <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 flex items-center gap-1.5
                  ${activeCategory === cat.id
                    ? `bg-gradient-to-r ${cat.gradient} text-white shadow-lg`
                    : 'bg-slate-900/60 text-slate-400 border border-slate-800 hover:border-slate-600 hover:text-white'}`}>
                <i className={`fa-solid ${cat.icon} text-[10px]`}></i>
                {cat.label}
              </button>
            ))}
          </div>

          <div className="text-center mb-6">
            <span className="text-[10px] font-bold text-slate-600 tracking-widest uppercase">{currentCategory.labelEn}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
            {currentCategory.features.map((f, idx) => {
              const c = colorMap[f.color] || colorMap.cyan;
              return (
                <button key={`${activeCategory}-${idx}`} onClick={() => setSelectedFeature(f)}
                  className={`reveal-on-scroll group relative text-right bg-slate-900/60 border border-slate-800 rounded-2xl p-6
                    hover:border-white/10 hover:shadow-xl transition-all duration-500 hover:-translate-y-2 hover:bg-slate-900/90 cursor-pointer`}
                  style={{ animationDelay: `${idx * 80}ms` }}>
                  <div className={`absolute inset-0 rounded-2xl ${c.bg} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                  <div className="relative z-10">
                    <div className={`w-14 h-14 ${c.bg} rounded-2xl flex items-center justify-center ${c.text} text-2xl mb-4 group-hover:scale-110 transition-transform duration-300`}>
                      <i className={`${f.icon.startsWith('fa-brands') ? f.icon : `fa-solid ${f.icon}`}`}></i>
                    </div>
                    <h3 className="text-base font-bold text-white mb-1">{f.title}</h3>
                    <p className={`text-[10px] ${c.text} opacity-60 font-medium mb-2`}>{f.titleEn}</p>
                    <p className="text-slate-400 text-sm leading-relaxed mb-4">{f.desc}</p>
                    <span className={`inline-flex items-center gap-1.5 text-xs font-bold ${c.text} opacity-60 group-hover:opacity-100 transition-opacity`}>
                      اكتشف المزيد <i className="fa-solid fa-arrow-left text-[9px] group-hover:-translate-x-1 transition-transform"></i>
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ════════════════ FEATURE MODAL ════════════════ */}
      {selectedFeature && (() => {
        const f = selectedFeature;
        const c = colorMap[f.color] || colorMap.cyan;
        return (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={closeModal}>
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm modal-backdrop-enter" />
            <div className="relative bg-slate-900 border border-slate-700 rounded-3xl max-w-lg w-full p-0 overflow-hidden shadow-2xl modal-card-enter" onClick={e => e.stopPropagation()}>
              <div className={`h-1.5 bg-gradient-to-r ${featureCategories.find(cat => cat.features.includes(f))?.gradient || 'from-primary to-secondary'}`} />
              <div className="p-8">
                <button onClick={closeModal} className="absolute top-4 left-4 w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors">
                  <i className="fa-solid fa-xmark text-sm"></i>
                </button>
                <div className="flex items-start gap-4 mb-6">
                  <div className={`w-16 h-16 ${c.bg} rounded-2xl flex items-center justify-center ${c.text} text-3xl shrink-0`}>
                    <i className={`${f.icon.startsWith('fa-brands') ? f.icon : `fa-solid ${f.icon}`}`}></i>
                  </div>
                  <div><h3 className="text-xl font-bold text-white">{f.title}</h3><p className={`text-sm ${c.text} opacity-70 font-medium`}>{f.titleEn}</p></div>
                </div>
                <p className="text-slate-300 mb-6 leading-relaxed">{f.desc}</p>
                <div className="space-y-3">
                  {f.details.map((d, i) => (
                    <div key={i} className="flex items-start gap-3 detail-item" style={{ animationDelay: `${i * 60}ms` }}>
                      <div className={`w-6 h-6 rounded-lg ${c.bg} flex items-center justify-center ${c.text} shrink-0 mt-0.5`}>
                        <i className="fa-solid fa-check text-[10px]"></i>
                      </div>
                      <p className="text-slate-300 text-sm leading-relaxed">{d}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-8 flex gap-3">
                  <a href="#contact" onClick={closeModal} className="flex-1 text-center px-6 py-3 bg-gradient-to-r from-primary to-secondary text-white font-bold rounded-xl hover:shadow-lg transition-all text-sm">
                    <i className="fa-solid fa-phone ml-1"></i> اطلب عرض توضيحي
                  </a>
                  <button onClick={closeModal} className="px-6 py-3 bg-slate-800 text-slate-300 font-bold rounded-xl hover:bg-slate-700 transition-all text-sm">إغلاق</button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ════════════════ TECH SECTION ════════════════ */}
      <section id="tech" className="py-24 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-sky-500/5 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-5xl mx-auto relative">
          <div className="text-center mb-16 reveal-on-scroll">
            <div className="inline-block px-4 py-1.5 bg-sky-500/10 border border-sky-500/20 rounded-full text-sky-400 text-xs font-bold mb-4">
              <i className="fa-solid fa-server ml-1"></i> Enterprise Grade
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              التقنية وراء <span className="bg-clip-text text-transparent bg-gradient-to-r from-sky-400 to-indigo-400">المنصة</span>
            </h2>
            <p className="text-slate-500 text-lg">بنية تحتية بمستوى المؤسسات — أمان لا يُساوم عليه</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 reveal-on-scroll">
            {[
              { icon: 'fa-cloud', title: 'Cloud Infrastructure', desc: 'خوادم عالمية موزعة بأداء عالي وتوفر مستمر. بياناتك على سحابة آمنة، لا في جهاز خزنة.', gradient: 'from-sky-500 to-blue-600' },
              { icon: 'fa-lock', title: 'تشفير شامل', desc: 'تشفير SSL/TLS أثناء النقل، حماية JWT للمصادقة، و HTTPS على كل الاتصالات. بياناتك الطبية محمية كاملاً.', gradient: 'from-indigo-500 to-violet-600' },
              { icon: 'fa-clock-rotate-left', title: 'نسخ احتياطي تلقائي', desc: 'نسخ يومية تلقائية لجميع البيانات. استعادة فورية في حال أي طارئ. ما في خوف على بياناتك.', gradient: 'from-emerald-500 to-teal-600' },
              { icon: 'fa-signal', title: 'High Availability', desc: 'توفر عالي 99.9% — النظام يشتغل دايماً. تحديثات بدون توقف. أداء سلس حتى بأوقات الذروة.', gradient: 'from-amber-500 to-orange-600' },
            ].map((item, i) => (
              <div key={i} className="group bg-slate-900/40 border border-slate-800 rounded-2xl p-7 hover:border-sky-500/20 transition-all duration-500"
                   style={{ animationDelay: `${i * 100}ms` }}>
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${item.gradient} flex items-center justify-center text-white text-xl mb-5 group-hover:scale-110 group-hover:shadow-lg transition-all duration-300`}>
                  <i className={`fa-solid ${item.icon}`}></i>
                </div>
                <h3 className="text-lg font-bold text-white mb-1">{item.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 flex flex-wrap justify-center gap-6 reveal-on-scroll">
            {[
              { icon: 'fa-shield-halved', label: 'SSL/TLS' },
              { icon: 'fa-key', label: 'JWT Auth' },
              { icon: 'fa-helmet-safety', label: 'Helmet' },
              { icon: 'fa-gauge', label: 'Rate Limiting' },
              { icon: 'fa-database', label: 'PostgreSQL' },
              { icon: 'fa-cloud', label: 'Neon Cloud' },
            ].map((t, i) => (
              <div key={i} className="flex items-center gap-2 text-slate-600 text-xs">
                <i className={`fa-solid ${t.icon} text-slate-700`}></i>
                <span className="font-mono">{t.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════ DEMO VIDEO ════════════════ */}
      <section id="demo-video" className="py-24 px-6 bg-gradient-to-b from-slate-950 to-slate-900">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12 reveal-on-scroll">
            <div className="inline-block px-4 py-1.5 bg-rose-500/10 border border-rose-500/20 rounded-full text-rose-400 text-xs font-bold mb-4">
              <i className="fa-solid fa-circle-play ml-1"></i> شاهد بعينك
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              60 ثانية تغيّر <span className="text-rose-400">نظرتك</span>
            </h2>
            <p className="text-slate-500 text-lg">شاهد كيف يعمل النظام — من الاستقبال حتى التقرير</p>
          </div>

          <div className="reveal-on-scroll relative group">
            <div className="aspect-video bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden relative">
              <video className="w-full h-full object-cover" poster="/logo.png" controls preload="none">
                <source src="/demo-video.mp4" type="video/mp4" />
              </video>
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 group-hover:bg-black/30 transition-colors pointer-events-none group-has-[:playing]:hidden">
                <div className="w-20 h-20 rounded-full bg-white/10 border-2 border-white/20 flex items-center justify-center backdrop-blur-sm group-hover:scale-110 transition-transform">
                  <i className="fa-solid fa-play text-white text-2xl mr-[-3px]"></i>
                </div>
              </div>
            </div>
            <div className="absolute -inset-2 bg-gradient-to-r from-primary/10 via-rose-500/10 to-secondary/10 rounded-3xl blur-xl -z-10 opacity-50 group-hover:opacity-80 transition-opacity" />
          </div>
        </div>
      </section>

      {/* ════════════════ CONTACT ════════════════ */}
      <section id="contact" className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12 reveal-on-scroll">
            <div className="inline-block px-4 py-1.5 bg-primary/10 border border-primary/20 rounded-full text-primary text-xs font-bold mb-4">
              تواصل معنا
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">نحن هنا <span className="text-primary">لمساعدتك</span></h2>
            <p className="text-slate-500">تواصل معنا للاستفسار أو لطلب عرض تجريبي</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <a href="tel:0792020388" className="reveal-on-scroll bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center hover:border-primary/30 transition-all group hover:-translate-y-1 duration-300">
              <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center text-primary text-2xl mx-auto mb-4 group-hover:bg-primary/20 group-hover:scale-110 transition-all">
                <i className="fa-solid fa-phone"></i>
              </div>
              <h3 className="font-bold text-white mb-2">الهاتف</h3>
              <p className="text-primary font-mono text-lg" dir="ltr">079 202 0388</p>
            </a>
            <a href="mailto:info@loopjo.com" className="reveal-on-scroll bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center hover:border-primary/30 transition-all group hover:-translate-y-1 duration-300" style={{ animationDelay: '100ms' }}>
              <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center text-primary text-2xl mx-auto mb-4 group-hover:bg-primary/20 group-hover:scale-110 transition-all">
                <i className="fa-solid fa-envelope"></i>
              </div>
              <h3 className="font-bold text-white mb-2">البريد الإلكتروني</h3>
              <p className="text-primary text-lg">info@loopjo.com</p>
            </a>
            <a href="https://wa.me/962792020388" target="_blank" rel="noopener noreferrer" className="reveal-on-scroll bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center hover:border-green-500/30 transition-all group hover:-translate-y-1 duration-300" style={{ animationDelay: '200ms' }}>
              <div className="w-14 h-14 bg-green-500/10 rounded-xl flex items-center justify-center text-green-400 text-2xl mx-auto mb-4 group-hover:bg-green-500/20 group-hover:scale-110 transition-all">
                <i className="fa-brands fa-whatsapp"></i>
              </div>
              <h3 className="font-bold text-white mb-2">واتساب</h3>
              <p className="text-green-400 text-lg">راسلنا مباشرة</p>
            </a>
          </div>
        </div>
      </section>

      {/* ════════════════ FINAL CTA ════════════════ */}
      <section className="py-24 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/8 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-3xl mx-auto text-center relative reveal-on-scroll">
          <div className="bg-gradient-to-br from-slate-900/80 to-slate-800/40 border border-white/10 rounded-3xl p-12 md:p-16 relative overflow-hidden">
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/15 rounded-full blur-[80px]" />
            <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-secondary/15 rounded-full blur-[80px]" />
            <div className="relative z-10">
              <div className="w-20 h-20 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center text-white text-3xl mx-auto mb-8 shadow-xl shadow-primary/25 logo-float">
                <i className="fa-solid fa-rocket"></i>
              </div>
              <h2 className="text-3xl md:text-5xl font-extrabold mb-4 leading-tight">
                هل مركزك جاهز
                <br />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">للمرحلة القادمة؟</span>
              </h2>
              <p className="text-slate-400 mb-10 text-lg max-w-md mx-auto">
                كل يوم بدون نظام ذكي — فرصة ضائعة. خلّي مركزك يشتغل بذكاء.
              </p>
              <a href="#contact" className="inline-block px-12 py-5 bg-gradient-to-r from-primary to-secondary text-white font-bold rounded-2xl hover:shadow-2xl hover:shadow-primary/30 transition-all text-lg hover:scale-105 group">
                <i className="fa-solid fa-paper-plane ml-2 group-hover:animate-bounce"></i>
                اطلب عرض تجريبي خاص
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════ FOOTER ════════════════ */}
      <footer className="border-t border-white/5 py-8 px-6 bg-slate-950">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="MED LOOP" className="w-8 h-8 object-contain" />
            <span className="text-slate-600 text-sm">© 2025 MED LOOP. جميع الحقوق محفوظة.</span>
          </div>
          <div className="flex items-center gap-6 text-slate-600 text-sm">
            <span>من تطوير <a href="https://loopjo.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Loop</a></span>
          </div>
        </div>
      </footer>

      {/* ════════════════ FLOATING WHATSAPP ════════════════ */}
      <a href="https://wa.me/962792020388" target="_blank" rel="noopener noreferrer"
         className="fixed bottom-6 left-6 w-14 h-14 bg-green-500 rounded-full flex items-center justify-center text-white text-2xl shadow-lg shadow-green-500/30 hover:scale-110 transition-transform z-40 whatsapp-pulse">
        <i className="fa-brands fa-whatsapp"></i>
      </a>
    </div>
  );
};

export default LandingView;
