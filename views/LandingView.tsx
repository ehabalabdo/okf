import React, { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';

/* ═══════════════════════ SVG ILLUSTRATIONS ═══════════════════════ */

// Infographic flat icon style based on clean simple information templates

const EarIllustration = ({ className = '' }: { className?: string }) => (
  <svg viewBox="0 0 64 64" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Soft Infographic Background with Pulse Animation */}
    <circle cx="32" cy="32" r="30" fill="#E0F2FE">
      <animate attributeName="r" values="30;31;30" dur="3s" repeatCount="indefinite" />
      <animate attributeName="opacity" values="1;0.85;1" dur="3s" repeatCount="indefinite" />
    </circle>
    <circle cx="32" cy="32" r="22" fill="#FFFFFF" />
    
    {/* Clean Infographic Ear Path */}
    <g stroke="#0284C7" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M 28 22 C 28 12, 44 12, 44 26 C 44 36, 38 40, 38 46 C 38 52, 28 52, 28 46 C 28 40, 34 40, 34 34 C 34 28, 28 28, 28 26" />
      <path d="M 34 26 C 38 26, 38 32, 34 36" />
      
      {/* Animated Sound Waves */}
      <path d="M 20 26 A 12 12 0 0 0 20 40" strokeWidth="2" opacity="0">
        <animate attributeName="opacity" values="0;1;0" dur="2s" begin="0s" repeatCount="indefinite"/>
      </path>
      <path d="M 15 22 A 18 18 0 0 0 15 44" strokeWidth="2" opacity="0">
        <animate attributeName="opacity" values="0;1;0" dur="2s" begin="0.5s" repeatCount="indefinite"/>
      </path>
    </g>
  </svg>
);

const NoseIllustration = ({ className = '' }: { className?: string }) => (
  <svg viewBox="0 0 64 64" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="32" cy="32" r="30" fill="#D1FAE5">
      <animate attributeName="r" values="30;31;30" dur="3s" repeatCount="indefinite" />
      <animate attributeName="opacity" values="1;0.85;1" dur="3s" repeatCount="indefinite" />
    </circle>
    <circle cx="32" cy="32" r="22" fill="#FFFFFF" />
    
    <g stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M 32 18 L 24 38 Q 22 44 32 44 Q 42 44 40 38 L 32 18 Z" />
      <path d="M 20 38 Q 16 44 24 44" />
      <path d="M 44 38 Q 48 44 40 44" />
      
      {/* Animated Airflow */}
      <path d="M 30 52 L 30 46" opacity="0" strokeWidth="2" strokeDasharray="2 3">
        <animate attributeName="opacity" values="0;1;0" dur="2s" begin="0s" repeatCount="indefinite"/>
        <animateTransform attributeName="transform" type="translate" values="0 4; 0 0" dur="2s" repeatCount="indefinite"/>
      </path>
      <path d="M 34 52 L 34 46" opacity="0" strokeWidth="2" strokeDasharray="2 3">
        <animate attributeName="opacity" values="0;1;0" dur="2s" begin="0.5s" repeatCount="indefinite"/>
        <animateTransform attributeName="transform" type="translate" values="0 4; 0 0" dur="2s" begin="0.5s" repeatCount="indefinite"/>
      </path>
    </g>
  </svg>
);

const ThroatIllustration = ({ className = '' }: { className?: string }) => (
  <svg viewBox="0 0 64 64" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="32" cy="32" r="30" fill="#FEF3C7">
      <animate attributeName="r" values="30;31;30" dur="3s" repeatCount="indefinite" />
      <animate attributeName="opacity" values="1;0.85;1" dur="3s" repeatCount="indefinite" />
    </circle>
    <circle cx="32" cy="32" r="22" fill="#FFFFFF" />
    
    <g stroke="#D97706" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M 26 26 L 38 26 L 34 38 L 30 38 Z" />
      <line x1="30" y1="42" x2="34" y2="42" />
      <line x1="30" y1="46" x2="34" y2="46" />
      <line x1="32" y1="26" x2="32" y2="22" />
      <line x1="32" y1="38" x2="32" y2="52" />
      <path d="M 24 20 Q 32 24 40 20" />
      
      {/* Animated Voice Waves */}
      <path d="M 18 20 A 12 12 0 0 0 18 32" strokeWidth="2" opacity="0">
        <animate attributeName="opacity" values="0;1;0" dur="2s" begin="0s" repeatCount="indefinite"/>
      </path>
      <path d="M 46 20 A 12 12 0 0 1 46 32" strokeWidth="2" opacity="0">
        <animate attributeName="opacity" values="0;1;0" dur="2s" begin="0s" repeatCount="indefinite"/>
      </path>
    </g>
  </svg>
);

/* ═══════════════════════ ANIMATED PARTICLES ═══════════════════════ */
const FloatingParticles = ({ color, count = 20 }: { color: string; count?: number }) => {
  const particles = useRef(
    Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 4 + 1,
      duration: Math.random() * 10 + 10,
      delay: Math.random() * 5,
    }))
  ).current;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map(p => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            backgroundColor: color,
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [0.1, 0.6, 0.1],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
};

/* ═══════════════════════ SECTION DIVIDER ═══════════════════════ */
const WaveDivider = ({ flip = false, color = '#0f172a' }: { flip?: boolean; color?: string }) => (
  <div className={`w-full overflow-hidden leading-[0] ${flip ? 'rotate-180' : ''}`} style={{ marginTop: flip ? 0 : -1, marginBottom: flip ? -1 : 0 }}>
    <svg viewBox="0 0 1440 120" preserveAspectRatio="none" className="w-full h-16 md:h-24">
      <path d="M0,60 C360,120 720,0 1080,60 C1260,90 1380,30 1440,60 L1440,120 L0,120Z" fill={color} />
    </svg>
  </div>
);

/* ═══════════════════════ SERVICE CARD ═══════════════════════ */
const ServiceCard = ({ icon, title, desc, delay }: { icon: string; title: string; desc: string; delay: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 40 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.6, delay }}
    whileHover={{ y: -8, scale: 1.02 }}
    className="group relative p-6 rounded-2xl bg-white/[0.03] border border-white/[0.06] backdrop-blur-sm hover:bg-white/[0.06] hover:border-white/[0.12] transition-all duration-500"
  >
    <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    <div className="relative z-10">
      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
        <i className={`fa-solid ${icon} text-xl text-primary`}></i>
      </div>
      <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
      <p className="text-sm text-slate-400 leading-relaxed">{desc}</p>
    </div>
  </motion.div>
);

/* ═══════════════════════ MAIN COMPONENT ═══════════════════════ */
const LandingView: React.FC = () => {
  const { t, language, toggleLanguage } = useLanguage();
  const isAr = language === 'ar';
  const [scrolled, setScrolled] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll();
  const heroOpacity = useTransform(scrollYProgress, [0, 0.15], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.15], [1, 0.95]);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', h);
    return () => window.removeEventListener('scroll', h);
  }, []);

  /* Active section tracking for nav highlight */
  const [activeSection, setActiveSection] = useState('hero');
  useEffect(() => {
    const sections = ['hero', 'ear', 'nose', 'throat', 'services', 'contact'];
    const obs = new IntersectionObserver(
      entries => {
        entries.forEach(e => {
          if (e.isIntersecting) setActiveSection(e.target.id);
        });
      },
      { threshold: 0.3 }
    );
    sections.forEach(id => {
      const el = document.getElementById(id);
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
  }, []);

  const navLinks = [
    { href: '#ear', id: 'ear', label: isAr ? 'الأذن' : 'Ear' },
    { href: '#nose', id: 'nose', label: isAr ? 'الأنف' : 'Nose' },
    { href: '#throat', id: 'throat', label: isAr ? 'الحنجرة' : 'Throat' },
    { href: '#services', id: 'services', label: isAr ? 'الخدمات' : 'Services' },
    { href: '#contact', id: 'contact', label: isAr ? 'تواصل معنا' : 'Contact' },
  ];

  return (
    <div className="min-h-screen bg-[#050a15] text-white overflow-x-hidden" dir={isAr ? 'rtl' : 'ltr'} style={{ fontFamily: "'Cairo', 'Plus Jakarta Sans', sans-serif" }}>
      
      {/* ════════════════ NAVBAR ════════════════ */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-500 ${scrolled ? 'bg-[#050a15]/80 backdrop-blur-2xl shadow-2xl shadow-black/30 border-b border-white/[0.04]' : 'bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <a href="#hero" className="flex items-center gap-3 group">
            <img src="/logo.png" alt="TKC" className="w-10 h-10 object-contain group-hover:scale-105 transition-transform duration-300" />
            <div>
              <span className="text-lg font-bold text-white block leading-tight">
                {isAr ? 'د. طارق خريس' : 'Dr. Tarek Khrais'}
              </span>
              <span className="text-[10px] text-primary/70 font-medium tracking-wider uppercase">
                {isAr ? 'أذن · أنف · حنجرة' : 'ENT Specialist'}
              </span>
            </div>
          </a>
          <div className="flex items-center gap-2">
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map(l => (
                <a
                  key={l.href}
                  href={l.href}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                    activeSection === l.id
                      ? 'text-primary bg-primary/10'
                      : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                  }`}
                >
                  {l.label}
                </a>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={toggleLanguage}
                className="px-3.5 py-2 rounded-full bg-white/[0.06] border border-white/10 backdrop-blur-xl text-sm font-bold text-primary hover:text-white hover:bg-primary/20 hover:border-primary/30 transition-all duration-300"
              >
                <i className="fa-solid fa-globe opacity-70" style={{ marginInlineEnd: 6 }}></i>
                {language === 'en' ? 'عربي' : 'EN'}
              </button>
              <a
                href="/login"
                className="px-4 py-2 rounded-full bg-white/[0.06] border border-white/10 backdrop-blur-xl text-sm font-medium text-white/80 hover:text-white hover:bg-white/[0.12] hover:border-white/20 transition-all duration-300 hover:shadow-[0_0_20px_rgba(232,150,31,0.2)]"
              >
                <i className="fa-solid fa-right-to-bracket opacity-70" style={{ marginInlineEnd: 6 }}></i>
                {isAr ? 'تسجيل الدخول' : 'Login'}
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* ════════════════ HERO SECTION ════════════════ */}
      <motion.section
        id="hero"
        ref={heroRef}
        style={{ opacity: heroOpacity, scale: heroScale }}
        className="relative min-h-screen flex items-center justify-center overflow-hidden"
      >
        {/* Background Video */}
        <video
          autoPlay muted loop playsInline
          className="absolute inset-0 w-full h-full object-cover opacity-[0.07]"
        >
          <source src="/bg-video.mp4" type="video/mp4" />
        </video>

        {/* Deep gradient background */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(232,150,31,0.06)_0%,rgba(5,10,21,1)_70%)]" />
        
        {/* Ambient orbital rings */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
          className="absolute w-[800px] h-[800px] rounded-full border border-primary/[0.06]"
          style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
        />
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 90, repeat: Infinity, ease: 'linear' }}
          className="absolute w-[1100px] h-[1100px] rounded-full border border-secondary/[0.04]"
          style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
        />

        <FloatingParticles color="rgba(232,150,31,0.25)" count={15} />

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-center gap-10 md:gap-16 px-6 max-w-6xl mx-auto">
          {/* Doctor Photo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="relative flex-shrink-0 order-first md:order-last"
          >
            <div className="relative w-56 h-56 sm:w-64 sm:h-64 md:w-72 md:h-72 rounded-full overflow-hidden border-2 border-primary/20 shadow-[0_0_60px_rgba(232,150,31,0.15)]">
              <img src="/doctor.jpg" alt="Dr. Tarek Khrais" className="w-full h-full object-cover" />
            </div>
            <div className="absolute inset-0 rounded-full bg-gradient-to-t from-[#050a15]/40 via-transparent to-transparent pointer-events-none" />
          </motion.div>

          <div className="text-center md:text-start">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-white/[0.03] border border-white/[0.06] backdrop-blur-md mb-10"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            <span className="text-xs font-semibold text-primary tracking-widest uppercase">
              {isAr ? 'أخصائي أذن · أنف · حنجرة' : 'Ear · Nose · Throat Specialist'}
            </span>
          </motion.div>

          {/* Doctor Name */}
          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="text-5xl sm:text-6xl md:text-8xl font-black mb-6 leading-[1.1]"
          >
            <span className="block text-white drop-shadow-[0_0_40px_rgba(255,255,255,0.15)]">
              {isAr ? 'د. طارق' : 'Dr. Tarek'}
            </span>
            <span className="block bg-clip-text text-transparent bg-gradient-to-r from-primary via-secondary to-primary drop-shadow-[0_0_60px_rgba(232,150,31,0.3)]">
              {isAr ? 'خريس' : 'Khrais'}
            </span>
          </motion.h1>

          {/* Specialty line */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="text-xl md:text-2xl text-slate-300 font-light mb-4 tracking-wide"
          >
            {isAr ? 'أخصائي أمراض وجراحة الأذن والأنف والحنجرة' : 'Otolaryngology — Head & Neck Surgery'}
          </motion.p>

          {/* Location */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.7 }}
            className="text-base text-slate-500 mb-12 flex items-center justify-center gap-2"
          >
            <i className="fa-solid fa-location-dot text-primary/60"></i>
            {isAr ? 'عمّان، الأردن' : 'Amman, Jordan'}
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.9 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <a
              href="#contact"
              className="group relative px-8 py-4 bg-gradient-to-r from-primary to-secondary text-white font-bold rounded-2xl text-base overflow-hidden transition-all duration-300 hover:scale-[1.03] hover:shadow-[0_0_50px_rgba(232,150,31,0.4)]"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
              <span className="relative z-10 flex items-center justify-center gap-3">
                <i className="fa-solid fa-calendar-check"></i>
                {isAr ? 'احجز موعدك الآن' : 'Book Your Appointment'}
              </span>
            </a>
            <a
              href="#services"
              className="group px-8 py-4 border border-white/10 bg-white/[0.02] backdrop-blur-sm text-white/80 font-bold rounded-2xl text-base transition-all duration-300 hover:bg-white/[0.06] hover:border-white/15 hover:text-white"
            >
              <span className="flex items-center justify-center gap-3">
                <i className="fa-solid fa-stethoscope opacity-60"></i>
                {isAr ? 'خدماتنا' : 'Our Services'}
              </span>
            </a>
          </motion.div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20">
          <motion.div animate={{ y: [0, 10, 0] }} transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}>
            <div className="w-6 h-10 rounded-full border-2 border-white/10 flex items-start justify-center pt-2">
              <div className="w-1 h-2 rounded-full bg-primary shadow-[0_0_8px_rgba(232,150,31,0.8)]" />
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* ════════════════════════════════════════════════════════════════
           JOURNEY 1: THE EAR — Hearing the World
           ════════════════════════════════════════════════════════════════ */}
      <section id="ear" className="relative py-32 md:py-40 overflow-hidden bg-gradient-to-b from-[#050a15] via-[#0a1628] to-[#050a15]">
        <FloatingParticles color="rgba(37,99,235,0.3)" count={12} />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(37,99,235,0.06)_0%,transparent_60%)] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Illustration side */}
            <motion.div
              initial={{ opacity: 0, x: isAr ? 60 : -60 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
              className="relative flex justify-center order-2 lg:order-1"
            >
              <div className="relative">
                <motion.div
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <EarIllustration className="w-64 md:w-80 h-auto drop-shadow-[0_0_60px_rgba(37,99,235,0.15)]" />
                </motion.div>
                {/* Sound wave animation overlay */}
                <motion.div
                  animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0, 0.3] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeOut' }}
                  className="absolute top-1/2 left-0 -translate-y-1/2 -translate-x-1/2 w-40 h-40 rounded-full border border-secondary/20"
                />
                <motion.div
                  animate={{ scale: [1, 1.5, 1], opacity: [0.2, 0, 0.2] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeOut', delay: 0.5 }}
                  className="absolute top-1/2 left-0 -translate-y-1/2 -translate-x-1/2 w-60 h-60 rounded-full border border-primary/15"
                />
              </div>
            </motion.div>

            {/* Text side */}
            <motion.div
              initial={{ opacity: 0, x: isAr ? -60 : 60 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
              className="order-1 lg:order-2"
            >
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-secondary/10 border border-secondary/20 text-secondary text-xs font-bold mb-6">
                <i className="fa-solid fa-ear-listen"></i>
                {isAr ? 'الأذن' : 'The Ear'}
              </div>
              <h2 className="text-4xl md:text-5xl font-black text-white mb-6 leading-tight">
                {isAr ? (
                  <>اسمع العالم <span className="bg-clip-text text-transparent bg-gradient-to-r from-secondary to-primary">بوضوح</span></>
                ) : (
                  <>Hear the World <span className="bg-clip-text text-transparent bg-gradient-to-r from-secondary to-primary">Clearly</span></>
                )}
              </h2>
              <p className="text-lg text-slate-400 leading-relaxed mb-8">
                {isAr
                  ? 'نقدم رعاية متخصصة لجميع أمراض الأذن من التهابات الأذن الوسطى والخارجية إلى مشاكل السمع والدوار. باستخدام أحدث تقنيات التشخيص مثل فحص السمع (Audiometry) وتخطيط طبلة الأذن (Tympanometry) وتقييم التوازن.'
                  : 'We provide specialized care for all ear conditions — from middle and outer ear infections to hearing loss and vertigo. Using advanced diagnostics including Audiometry, Tympanometry, and Balance Assessment.'}
              </p>
              <div className="grid grid-cols-2 gap-4">
                {(isAr
                  ? [
                      { icon: 'fa-ear-deaf', text: 'فقدان السمع والصمم' },
                      { icon: 'fa-head-side-virus', text: 'التهابات الأذن' },
                      { icon: 'fa-rotate', text: 'الدوار واختلال التوازن' },
                      { icon: 'fa-wave-square', text: 'طنين الأذن' },
                    ]
                  : [
                      { icon: 'fa-ear-deaf', text: 'Hearing Loss' },
                      { icon: 'fa-head-side-virus', text: 'Ear Infections' },
                      { icon: 'fa-rotate', text: 'Vertigo & Balance' },
                      { icon: 'fa-wave-square', text: 'Tinnitus' },
                    ]
                ).map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.1 * i }}
                    className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]"
                  >
                    <i className={`fa-solid ${item.icon} text-secondary/80`}></i>
                    <span className="text-sm text-slate-300">{item.text}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
           JOURNEY 2: THE NOSE — Breathe Freely  
           ════════════════════════════════════════════════════════════════ */}
      <section id="nose" className="relative py-32 md:py-40 overflow-hidden bg-gradient-to-b from-[#050a15] via-[#081a1a] to-[#050a15]">
        <FloatingParticles color="rgba(16,185,129,0.3)" count={12} />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,rgba(16,185,129,0.06)_0%,transparent_60%)] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Text side */}
            <motion.div
              initial={{ opacity: 0, x: isAr ? 60 : -60 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold mb-6">
                <i className="fa-solid fa-lungs"></i>
                {isAr ? 'الأنف' : 'The Nose'}
              </div>
              <h2 className="text-4xl md:text-5xl font-black text-white mb-6 leading-tight">
                {isAr ? (
                  <>تنفّس <span className="bg-clip-text text-transparent bg-gradient-to-r from-accent to-primary">بحرية</span></>
                ) : (
                  <>Breathe <span className="bg-clip-text text-transparent bg-gradient-to-r from-accent to-primary">Freely</span></>
                )}
              </h2>
              <p className="text-lg text-slate-400 leading-relaxed mb-8">
                {isAr
                  ? 'علاج متكامل لجميع مشاكل الأنف والجيوب الأنفية — من الحساسية والتهابات الجيوب المزمنة إلى انحراف الوتيرة والزوائد اللحمية. نستخدم المنظار لتشخيص دقيق وعلاج جراحي بأقل تدخل ممكن.'
                  : 'Comprehensive treatment for all nasal and sinus conditions — from allergies and chronic sinusitis to deviated septum and nasal polyps. We use endoscopy for precise diagnosis and minimally invasive surgical treatment.'}
              </p>
              <div className="grid grid-cols-2 gap-4">
                {(isAr
                  ? [
                      { icon: 'fa-wind', text: 'حساسية الأنف' },
                      { icon: 'fa-virus', text: 'التهاب الجيوب الأنفية' },
                      { icon: 'fa-arrows-left-right', text: 'انحراف الوتيرة' },
                      { icon: 'fa-microscope', text: 'تنظير الأنف والجيوب' },
                    ]
                  : [
                      { icon: 'fa-wind', text: 'Nasal Allergies' },
                      { icon: 'fa-virus', text: 'Sinusitis' },
                      { icon: 'fa-arrows-left-right', text: 'Deviated Septum' },
                      { icon: 'fa-microscope', text: 'Nasal Endoscopy' },
                    ]
                ).map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.1 * i }}
                    className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]"
                  >
                    <i className={`fa-solid ${item.icon} text-emerald-400/80`}></i>
                    <span className="text-sm text-slate-300">{item.text}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Illustration side */}
            <motion.div
              initial={{ opacity: 0, x: isAr ? -60 : 60 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
              className="relative flex justify-center"
            >
              <div className="relative">
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <NoseIllustration className="w-64 md:w-80 h-auto drop-shadow-[0_0_60px_rgba(16,185,129,0.15)]" />
                </motion.div>
                {/* Breathing animation */}
                <motion.div
                  animate={{ scale: [1, 1.1, 1], opacity: [0.2, 0.5, 0.2] }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                  className="absolute bottom-10 left-1/2 -translate-x-1/2 w-32 h-32 rounded-full bg-emerald-500/10 blur-2xl"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
           JOURNEY 3: THE THROAT — Find Your Voice
           ════════════════════════════════════════════════════════════════ */}
      <section id="throat" className="relative py-32 md:py-40 overflow-hidden bg-gradient-to-b from-[#050a15] via-[#1a0f0a] to-[#050a15]">
        <FloatingParticles color="rgba(245,158,11,0.3)" count={12} />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(245,158,11,0.05)_0%,transparent_60%)] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Illustration side */}
            <motion.div
              initial={{ opacity: 0, x: isAr ? 60 : -60 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
              className="relative flex justify-center order-2 lg:order-1"
            >
              <div className="relative">
                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <ThroatIllustration className="w-64 md:w-80 h-auto drop-shadow-[0_0_60px_rgba(245,158,11,0.12)]" />
                </motion.div>
                {/* Voice vibration rings */}
                {[0, 0.7, 1.4].map((delay, i) => (
                  <motion.div
                    key={i}
                    animate={{ scale: [1, 2, 2.5], opacity: [0.3, 0.1, 0] }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'easeOut', delay }}
                    className="absolute top-[55%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full border border-amber-500/20"
                  />
                ))}
              </div>
            </motion.div>

            {/* Text side */}
            <motion.div
              initial={{ opacity: 0, x: isAr ? -60 : 60 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
              className="order-1 lg:order-2"
            >
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold mb-6">
                <i className="fa-solid fa-comment-dots"></i>
                {isAr ? 'الحنجرة' : 'The Throat'}
              </div>
              <h2 className="text-4xl md:text-5xl font-black text-white mb-6 leading-tight">
                {isAr ? (
                  <>أطلق <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-red-400">صوتك</span></>
                ) : (
                  <>Find Your <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-red-400">Voice</span></>
                )}
              </h2>
              <p className="text-lg text-slate-400 leading-relaxed mb-8">
                {isAr
                  ? 'تشخيص وعلاج أمراض الحنجرة والبلعوم والحبال الصوتية — من التهاب اللوزتين المزمن وصعوبات البلع إلى بحة الصوت والارتجاع الحنجري البلعومي. فحص بالمنظار الحنجري المرن لتقييم دقيق.'
                  : 'Diagnosis and treatment of throat and laryngeal conditions — from chronic tonsillitis and swallowing difficulties to hoarseness and laryngopharyngeal reflux. Flexible laryngoscopy for precise evaluation.'}
              </p>
              <div className="grid grid-cols-2 gap-4">
                {(isAr
                  ? [
                      { icon: 'fa-head-side-cough', text: 'التهاب اللوزتين' },
                      { icon: 'fa-volume-xmark', text: 'بحة الصوت' },
                      { icon: 'fa-utensils', text: 'صعوبات البلع' },
                      { icon: 'fa-bed', text: 'الشخير وتوقف التنفس' },
                    ]
                  : [
                      { icon: 'fa-head-side-cough', text: 'Tonsillitis' },
                      { icon: 'fa-volume-xmark', text: 'Hoarseness' },
                      { icon: 'fa-utensils', text: 'Swallowing Issues' },
                      { icon: 'fa-bed', text: 'Snoring & Sleep Apnea' },
                    ]
                ).map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.1 * i }}
                    className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]"
                  >
                    <i className={`fa-solid ${item.icon} text-amber-400/80`}></i>
                    <span className="text-sm text-slate-300">{item.text}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
           SERVICES
           ════════════════════════════════════════════════════════════════ */}
      <section id="services" className="relative py-32 overflow-hidden bg-[#050a15]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(232,150,31,0.04)_0%,transparent_50%)] pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold mb-6">
              <i className="fa-solid fa-hand-holding-medical"></i>
              {isAr ? 'خدماتنا الطبية' : 'Our Medical Services'}
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-white mb-6">
              {isAr ? (
                <>رعاية <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">شاملة</span> ومتخصصة</>
              ) : (
                <><span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">Comprehensive</span> Specialized Care</>
              )}
            </h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              {isAr
                ? 'نوفر مجموعة واسعة من الخدمات التشخيصية والعلاجية في مجال طب الأذن والأنف والحنجرة'
                : 'We offer a wide range of diagnostic and therapeutic ENT services'}
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {(isAr
              ? [
                  { icon: 'fa-ear-listen', title: 'فحص السمع', desc: 'تخطيط السمع الشامل وفحص طبلة الأذن باستخدام أحدث الأجهزة الطبية' },
                  { icon: 'fa-microscope', title: 'التنظير التشخيصي', desc: 'تنظير الأنف والحنجرة المرن والصلب للتشخيص الدقيق' },
                  { icon: 'fa-syringe', title: 'العلاج الجراحي', desc: 'عمليات اللوزتين واللحمية وترقيع طبلة الأذن وجراحة الجيوب' },
                  { icon: 'fa-child', title: 'طب أطفال ENT', desc: 'رعاية متخصصة لأمراض الأذن والأنف والحنجرة لدى الأطفال' },
                  { icon: 'fa-head-side-virus', title: 'علاج الحساسية', desc: 'تشخيص وعلاج حساسية الأنف والجيوب الأنفية المزمنة' },
                  { icon: 'fa-rotate', title: 'تقييم التوازن', desc: 'فحص وعلاج اضطرابات الدوار والتوازن بأحدث التقنيات' },
                ]
              : [
                  { icon: 'fa-ear-listen', title: 'Hearing Assessment', desc: 'Comprehensive audiometry and tympanometry using the latest medical devices' },
                  { icon: 'fa-microscope', title: 'Diagnostic Endoscopy', desc: 'Flexible and rigid nasal & laryngeal endoscopy for precise diagnosis' },
                  { icon: 'fa-syringe', title: 'Surgical Treatment', desc: 'Tonsillectomy, adenoidectomy, tympanoplasty, and sinus surgery' },
                  { icon: 'fa-child', title: 'Pediatric ENT', desc: 'Specialized care for ear, nose, and throat conditions in children' },
                  { icon: 'fa-head-side-virus', title: 'Allergy Treatment', desc: 'Diagnosis and management of nasal allergies and chronic sinusitis' },
                  { icon: 'fa-rotate', title: 'Balance Assessment', desc: 'Evaluation and treatment of vertigo and balance disorders' },
                ]
            ).map((s, i) => (
              <ServiceCard key={i} icon={s.icon} title={s.title} desc={s.desc} delay={i * 0.1} />
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
           WHY CHOOSE US
           ════════════════════════════════════════════════════════════════ */}
      <section className="relative py-32 overflow-hidden bg-gradient-to-b from-[#050a15] via-[#0a1020] to-[#050a15]">
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-black text-white mb-6">
              {isAr ? (
                <>لماذا <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">تختارنا</span>؟</>
              ) : (
                <>Why <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">Choose Us</span>?</>
              )}
            </h2>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {(isAr
              ? [
                  { icon: 'fa-user-doctor', title: 'خبرة واسعة', desc: 'سنوات من الخبرة في تشخيص وعلاج أمراض الأذن والأنف والحنجرة', color: 'cyan' },
                  { icon: 'fa-microchip', title: 'أجهزة حديثة', desc: 'مناظير وأجهزة فحص سمع متطورة لتشخيص دقيق', color: 'violet' },
                  { icon: 'fa-heart-pulse', title: 'رعاية شاملة', desc: 'متابعة مستمرة من التشخيص حتى التعافي الكامل', color: 'emerald' },
                  { icon: 'fa-clock', title: 'مواعيد مرنة', desc: 'نظام حجز إلكتروني متطور لتنظيم مواعيدك بسهولة', color: 'amber' },
                ]
              : [
                  { icon: 'fa-user-doctor', title: 'Extensive Experience', desc: 'Years of experience diagnosing and treating ENT conditions', color: 'cyan' },
                  { icon: 'fa-microchip', title: 'Modern Equipment', desc: 'Advanced endoscopes and audiometry devices for accurate diagnosis', color: 'violet' },
                  { icon: 'fa-heart-pulse', title: 'Comprehensive Care', desc: 'Continuous follow-up from diagnosis through full recovery', color: 'emerald' },
                  { icon: 'fa-clock', title: 'Flexible Scheduling', desc: 'Advanced electronic booking system for easy appointment management', color: 'amber' },
                ]
            ).map((item, i) => {
              const colors: Record<string, string> = {
                cyan: 'from-primary/20 to-primary/5 text-primary border-primary/20',
                violet: 'from-secondary/20 to-secondary/5 text-secondary border-secondary/20',
                emerald: 'from-accent/20 to-accent/5 text-accent border-accent/20',
                amber: 'from-amber-500/20 to-amber-500/5 text-amber-400 border-amber-500/20',
              };
              const c = colors[item.color] || colors.cyan;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="text-center"
                >
                  <div className={`w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-b ${c.split(' ').slice(0, 2).join(' ')} flex items-center justify-center border ${c.split(' ').pop()}`}>
                    <i className={`fa-solid ${item.icon} text-2xl ${c.split(' ')[2]}`}></i>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">{item.title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{item.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
           CONTACT
           ════════════════════════════════════════════════════════════════ */}
      <section id="contact" className="relative py-32 overflow-hidden bg-[#050a15]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_100%,rgba(232,150,31,0.06)_0%,transparent_50%)] pointer-events-none" />
        
        <div className="max-w-4xl mx-auto px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold mb-6">
              <i className="fa-solid fa-paper-plane"></i>
              {isAr ? 'تواصل معنا' : 'Get In Touch'}
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-white mb-6">
              {isAr ? (
                <>صحتك <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">أولويتنا</span></>
              ) : (
                <>Your Health is <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">Our Priority</span></>
              )}
            </h2>
            <p className="text-lg text-slate-400 max-w-xl mx-auto">
              {isAr
                ? 'لا تتردد في التواصل معنا لحجز موعد أو الاستفسار عن أي من خدماتنا'
                : "Don't hesitate to reach out to book an appointment or inquire about our services"}
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: 'fa-phone',
                label: isAr ? 'اتصل بنا' : 'Call Us',
                value: '0790904030',
                href: 'tel:+962790904030',
                color: 'cyan',
              },
              {
                icon: 'fa-brands fa-whatsapp',
                label: isAr ? 'واتساب' : 'WhatsApp',
                value: '0790904030',
                href: 'https://wa.me/962790904030',
                color: 'green',
              },
              {
                icon: 'fa-location-dot',
                label: isAr ? 'الموقع' : 'Location',
                value: isAr ? 'عمّان، الأردن' : 'Amman, Jordan',
                href: '#',
                color: 'violet',
              },
            ].map((item, i) => {
              const colorMap: Record<string, string> = {
                cyan: 'bg-primary/10 border-primary/20 text-primary hover:bg-primary/20',
                green: 'bg-accent/10 border-accent/20 text-accent hover:bg-accent/20',
                violet: 'bg-secondary/10 border-secondary/20 text-secondary hover:bg-secondary/20',
              };
              return (
                <motion.a
                  key={i}
                  href={item.href}
                  target={item.href.startsWith('http') ? '_blank' : undefined}
                  rel={item.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  whileHover={{ y: -4 }}
                  className={`flex flex-col items-center text-center p-8 rounded-2xl border transition-all duration-300 ${colorMap[item.color]}`}
                >
                  <i className={`${item.icon.includes('brands') ? 'fa-brands' : 'fa-solid'} ${item.icon.includes('brands') ? item.icon.split(' ')[1] : item.icon} text-3xl mb-4`}></i>
                  <span className="text-sm text-slate-400 mb-1">{item.label}</span>
                  <span className="text-lg font-bold text-white" dir="ltr">{item.value}</span>
                </motion.a>
              );
            })}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
           FOOTER
           ════════════════════════════════════════════════════════════════ */}
      <footer className="border-t border-white/[0.04] bg-[#030710] py-10 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="TKC" className="w-8 h-8 object-contain" />
            <span className="text-sm font-semibold text-white/80">
              {isAr ? 'مركز د. طارق خريس' : 'Dr. Tarek Khrais Center'}
            </span>
          </div>
          <p className="text-xs text-slate-500">
            &copy; {new Date().getFullYear()} {isAr ? 'جميع الحقوق محفوظة' : 'All rights reserved'}.
            {' '}
            <span className="text-slate-600">
              {isAr ? 'من تطوير' : 'Developed by'}{' '}
              <span className="text-primary/60">TKC</span>
            </span>
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingView;
