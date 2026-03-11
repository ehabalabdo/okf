import React, { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';

/* ═══════════════════════ SVG ILLUSTRATIONS ═══════════════════════ */

const EarIllustration = ({ className = '' }: { className?: string }) => (
  <svg viewBox="0 0 400 500" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Helix - outer rim of ear */}
    <path d="M175 140 C175 100 195 65 225 48 C255 32 290 38 318 62 C346 86 358 122 355 165 C352 210 345 265 332 315 C319 365 298 400 268 420 C248 432 228 440 215 442"
      stroke="url(#earGrad)" strokeWidth="3" fill="none" opacity="0.9" strokeLinecap="round"/>
    {/* Lobule - earlobe */}
    <path d="M215 442 C198 448 182 442 178 428 C174 414 178 398 190 388"
      stroke="url(#earGrad)" strokeWidth="3" fill="none" opacity="0.85" strokeLinecap="round"/>
    {/* Helix crus - where helix attaches inside */}
    <path d="M175 140 C180 158 178 180 175 205 C172 225 175 240 182 248"
      stroke="url(#earGrad)" strokeWidth="2.5" fill="none" opacity="0.75" strokeLinecap="round"/>
    {/* Antihelix - inner ridge */}
    <path d="M198 385 C215 345 228 295 232 248 C235 215 230 188 222 168"
      stroke="url(#earGrad)" strokeWidth="2.5" fill="none" opacity="0.7" strokeLinecap="round"/>
    {/* Antihelix superior crus */}
    <path d="M222 168 C232 145 252 118 275 98 C292 84 308 76 318 74"
      stroke="url(#earGrad)" strokeWidth="2" fill="none" opacity="0.55" strokeLinecap="round"/>
    {/* Antihelix inferior crus */}
    <path d="M222 168 C212 148 200 128 192 112 C186 100 186 88 195 78"
      stroke="url(#earGrad)" strokeWidth="2" fill="none" opacity="0.55" strokeLinecap="round"/>
    {/* Tragus - cartilage flap in front of canal */}
    <path d="M168 235 C156 228 148 238 150 252 C152 266 162 272 170 265"
      stroke="url(#earGrad)" strokeWidth="2.5" fill="none" opacity="0.8" strokeLinecap="round"/>
    {/* Antitragus */}
    <path d="M202 372 C215 362 220 345 214 332 C208 322 196 328 194 340 C192 352 198 368 202 372"
      stroke="url(#earGrad)" strokeWidth="2" fill="none" opacity="0.6" strokeLinecap="round"/>
    {/* Concha bowl */}
    <path d="M182 248 C200 242 218 252 228 268 C236 284 234 308 224 325 C216 338 206 345 200 342"
      stroke="url(#earGrad)" strokeWidth="1.8" fill="none" opacity="0.4" strokeLinecap="round"/>
    {/* Ear canal opening - glowing */}
    <ellipse cx="192" cy="258" rx="16" ry="20" fill="url(#canalGrad)" opacity="0.7"/>
    <ellipse cx="192" cy="258" rx="8" ry="11" fill="url(#canalInner)" opacity="0.9"/>
    {/* Inner ear - Cochlea spiral */}
    <g opacity="0.35" transform="translate(290, 285)">
      <path d="M0 0 C22 -5 38 8 40 28 C42 48 28 62 10 64 C-8 66 -22 52 -22 38 C-22 24 -12 14 2 16 C16 18 22 28 18 38"
        stroke="url(#earGrad)" strokeWidth="1.8" fill="none" strokeLinecap="round"/>
      <line x1="0" y1="64" x2="-12" y2="92" stroke="url(#earGrad)" strokeWidth="1.5" opacity="0.5"/>
    </g>
    {/* Dashed connector from canal to cochlea */}
    <path d="M208 260 C240 265 270 278 290 285"
      stroke="url(#earGrad)" strokeWidth="1" fill="none" opacity="0.2" strokeDasharray="4 4"/>
    {/* Sound waves entering ear */}
    <g opacity="0.35">
      <path d="M95 210 C78 232 78 272 95 294" stroke="url(#waveGrad)" strokeWidth="2" fill="none" strokeLinecap="round"/>
      <path d="M68 188 C42 222 42 282 68 316" stroke="url(#waveGrad)" strokeWidth="1.8" fill="none" strokeLinecap="round"/>
      <path d="M42 168 C6 212 6 292 42 336" stroke="url(#waveGrad)" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
    </g>
    <defs>
      <linearGradient id="earGrad" x1="0" y1="0" x2="400" y2="500">
        <stop offset="0%" stopColor="#06b6d4"/>
        <stop offset="50%" stopColor="#8b5cf6"/>
        <stop offset="100%" stopColor="#06b6d4"/>
      </linearGradient>
      <radialGradient id="canalGrad" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.6"/>
        <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.1"/>
      </radialGradient>
      <radialGradient id="canalInner" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#c084fc" stopOpacity="0.8"/>
        <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.2"/>
      </radialGradient>
      <linearGradient id="waveGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.8"/>
        <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.3"/>
      </linearGradient>
    </defs>
  </svg>
);

const NoseIllustration = ({ className = '' }: { className?: string }) => (
  <svg viewBox="0 0 400 500" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* External nose profile - dorsum (bridge) */}
    <path d="M155 70 C150 100 142 140 132 180 C122 220 108 260 98 290 C88 320 92 342 108 355"
      stroke="url(#noseGrad)" strokeWidth="3" fill="none" opacity="0.9" strokeLinecap="round"/>
    {/* Nose tip and alar (wing) */}
    <path d="M108 355 C120 365 138 372 155 368 C168 364 178 355 182 342"
      stroke="url(#noseGrad)" strokeWidth="3" fill="none" opacity="0.9" strokeLinecap="round"/>
    {/* Columella */}
    <path d="M182 342 C186 358 185 375 180 390"
      stroke="url(#noseGrad)" strokeWidth="2.5" fill="none" opacity="0.85" strokeLinecap="round"/>
    {/* Nostril opening (profile) */}
    <path d="M108 355 C115 362 128 370 142 368 C155 366 168 360 175 352"
      stroke="url(#noseGrad)" strokeWidth="2" fill="none" opacity="0.6" strokeLinecap="round"/>
    {/* Nasal bone */}
    <path d="M155 70 C162 68 172 72 178 82 C184 92 182 108 178 125"
      stroke="url(#noseGrad)" strokeWidth="2.5" fill="none" opacity="0.7" strokeLinecap="round"/>
    {/* Cribriform plate / roof of nasal cavity */}
    <path d="M178 82 C205 74 235 70 265 72 C295 74 318 82 330 98"
      stroke="url(#noseGrad)" strokeWidth="2" fill="none" opacity="0.55" strokeLinecap="round"/>
    {/* Hard palate - floor */}
    <path d="M180 390 C210 395 250 395 290 390 C315 385 332 372 340 355"
      stroke="url(#noseGrad)" strokeWidth="2.5" fill="none" opacity="0.8" strokeLinecap="round"/>
    {/* Posterior wall - nasopharynx */}
    <path d="M330 98 C335 128 338 168 340 215 C342 265 342 315 340 355"
      stroke="url(#noseGrad)" strokeWidth="2.2" fill="none" opacity="0.7" strokeLinecap="round"/>
    {/* Superior turbinate */}
    <path d="M185 130 C200 118 225 112 252 118 C278 124 302 140 318 162"
      stroke="url(#noseGrad)" strokeWidth="2" fill="none" opacity="0.5" strokeLinecap="round"/>
    <path d="M185 130 C208 128 228 126 248 130"
      stroke="url(#noseGrad)" strokeWidth="1.2" fill="none" opacity="0.25" strokeLinecap="round"/>
    {/* Middle turbinate */}
    <path d="M182 215 C202 198 232 190 265 196 C295 202 318 218 328 240"
      stroke="url(#noseGrad)" strokeWidth="2.2" fill="none" opacity="0.6" strokeLinecap="round"/>
    <path d="M182 215 C210 212 238 210 260 214"
      stroke="url(#noseGrad)" strokeWidth="1.5" fill="none" opacity="0.3" strokeLinecap="round"/>
    {/* Inferior turbinate */}
    <path d="M184 310 C205 292 238 284 272 290 C302 296 325 312 335 334"
      stroke="url(#noseGrad)" strokeWidth="2.2" fill="none" opacity="0.6" strokeLinecap="round"/>
    <path d="M184 310 C215 306 245 304 268 308"
      stroke="url(#noseGrad)" strokeWidth="1.5" fill="none" opacity="0.3" strokeLinecap="round"/>
    {/* Frontal sinus */}
    <path d="M155 70 C148 52 155 34 172 26 C189 18 210 22 218 35 C226 48 220 66 212 78"
      stroke="url(#noseGrad)" strokeWidth="1.5" fill="none" opacity="0.35" strokeLinecap="round" strokeDasharray="4 3"/>
    {/* Sphenoid sinus */}
    <path d="M320 105 C332 98 348 105 352 122 C356 139 348 158 335 165 C322 172 310 165 308 150 C306 135 312 118 320 108"
      stroke="url(#noseGrad)" strokeWidth="1.5" fill="none" opacity="0.3" strokeLinecap="round" strokeDasharray="4 3"/>
    {/* Olfactory epithelium markers */}
    <g opacity="0.3">
      <circle cx="198" cy="92" r="2.5" fill="#10b981"/>
      <circle cx="218" cy="86" r="2" fill="#06b6d4"/>
      <circle cx="238" cy="82" r="2" fill="#10b981"/>
      <circle cx="258" cy="80" r="2.5" fill="#06b6d4"/>
      <circle cx="278" cy="82" r="2" fill="#10b981"/>
    </g>
    {/* Airflow arrows entering nostril */}
    <g opacity="0.3">
      <path d="M72 330 C82 312 100 296 120 285" stroke="#10b981" strokeWidth="1.8" fill="none" strokeLinecap="round"/>
      <path d="M116 290 L120 285 L122 293" stroke="#10b981" strokeWidth="1.8" fill="none" strokeLinecap="round"/>
      <path d="M58 350 C72 332 92 318 112 308" stroke="#06b6d4" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
      <path d="M108 313 L112 308 L114 316" stroke="#06b6d4" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
    </g>
    {/* Airflow particles */}
    <g opacity="0.3">
      <circle cx="60" cy="345" r="3" fill="#10b981"/>
      <circle cx="48" cy="332" r="2" fill="#06b6d4"/>
      <circle cx="42" cy="352" r="2.5" fill="#10b981"/>
      <circle cx="55" cy="360" r="2" fill="#8b5cf6"/>
      <circle cx="75" cy="355" r="1.5" fill="#06b6d4"/>
    </g>
    <defs>
      <linearGradient id="noseGrad" x1="100" y1="60" x2="300" y2="500">
        <stop offset="0%" stopColor="#10b981"/>
        <stop offset="50%" stopColor="#06b6d4"/>
        <stop offset="100%" stopColor="#10b981"/>
      </linearGradient>
    </defs>
  </svg>
);

const ThroatIllustration = ({ className = '' }: { className?: string }) => (
  <svg viewBox="0 0 400 600" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Tongue - dorsal surface */}
    <path d="M60 155 C90 148 130 142 170 142 C210 142 245 150 265 168"
      stroke="url(#throatGrad)" strokeWidth="3" fill="none" opacity="0.85" strokeLinecap="round"/>
    {/* Tongue root descending */}
    <path d="M265 168 C275 185 280 210 278 240 C276 265 268 285 255 298"
      stroke="url(#throatGrad)" strokeWidth="2.8" fill="none" opacity="0.8" strokeLinecap="round"/>
    {/* Hard palate */}
    <path d="M60 68 C100 52 150 44 210 48 C260 52 295 62 315 78"
      stroke="url(#throatGrad)" strokeWidth="3" fill="none" opacity="0.85" strokeLinecap="round"/>
    {/* Soft palate */}
    <path d="M315 78 C320 95 318 118 308 138 C298 155 285 168 275 172"
      stroke="url(#throatGrad)" strokeWidth="2.8" fill="none" opacity="0.8" strokeLinecap="round"/>
    {/* Uvula */}
    <path d="M275 172 C270 182 268 198 272 210 C276 222 284 228 288 220 C292 212 288 198 282 185 C276 174 275 172 275 172"
      stroke="url(#throatGrad)" strokeWidth="2.2" fill="url(#uvulaGrad)" opacity="0.75" strokeLinecap="round"/>
    {/* Nasopharynx posterior wall */}
    <path d="M315 78 C325 100 330 135 332 175 C334 215 332 255 328 290"
      stroke="url(#throatGrad)" strokeWidth="2.5" fill="none" opacity="0.7" strokeLinecap="round"/>
    {/* Oropharynx */}
    <path d="M328 290 C325 320 320 348 316 370"
      stroke="url(#throatGrad)" strokeWidth="2.2" fill="none" opacity="0.65" strokeLinecap="round"/>
    {/* Vallecula */}
    <path d="M255 298 C262 308 272 315 278 312"
      stroke="url(#throatGrad)" strokeWidth="1.8" fill="none" opacity="0.5" strokeLinecap="round"/>
    {/* Epiglottis - leaf-shaped */}
    <path d="M278 312 C295 295 308 275 312 255 C316 235 308 222 296 222 C284 222 275 235 275 255 C275 275 278 298 278 312"
      stroke="url(#throatGrad)" strokeWidth="2.5" fill="none" opacity="0.75" strokeLinecap="round"/>
    {/* Hyoid bone */}
    <path d="M238 305 C250 300 265 298 278 300"
      stroke="url(#throatGrad)" strokeWidth="3" fill="none" opacity="0.5" strokeLinecap="round"/>
    {/* Thyroid cartilage - anterior wall of larynx */}
    <path d="M238 305 C228 325 218 355 214 385 C210 415 212 440 218 462"
      stroke="url(#throatGrad)" strokeWidth="3" fill="none" opacity="0.85" strokeLinecap="round"/>
    {/* Posterior larynx wall */}
    <path d="M316 370 C312 395 308 418 304 440 C300 462 298 478 300 495"
      stroke="url(#throatGrad)" strokeWidth="2.2" fill="none" opacity="0.65" strokeLinecap="round"/>
    {/* Vocal folds */}
    <path d="M224 398 C242 408 265 412 282 408 C298 404 310 396 315 388"
      stroke="url(#vocalGrad)" strokeWidth="3" fill="none" opacity="0.85" strokeLinecap="round"/>
    <path d="M226 410 C244 418 268 422 284 418 C300 414 310 408 314 400"
      stroke="url(#vocalGrad)" strokeWidth="2.2" fill="none" opacity="0.6" strokeLinecap="round"/>
    {/* Glottic opening */}
    <ellipse cx="270" cy="404" rx="20" ry="7" stroke="url(#vocalGrad)" strokeWidth="1.5" fill="none" opacity="0.4"/>
    {/* Sound waves from vocal folds */}
    <g opacity="0.2">
      <circle cx="270" cy="404" r="28" stroke="#f59e0b" strokeWidth="1.2" fill="none"/>
      <circle cx="270" cy="404" r="45" stroke="#f59e0b" strokeWidth="0.9" fill="none"/>
      <circle cx="270" cy="404" r="62" stroke="#f59e0b" strokeWidth="0.6" fill="none"/>
    </g>
    {/* Cricoid cartilage */}
    <path d="M218 462 C225 472 242 478 262 478 C282 478 296 474 302 466"
      stroke="url(#throatGrad)" strokeWidth="2.2" fill="none" opacity="0.6" strokeLinecap="round"/>
    {/* Trachea anterior wall */}
    <path d="M218 462 C216 482 215 505 215 528 C215 548 216 565 218 580"
      stroke="url(#throatGrad)" strokeWidth="2.5" fill="none" opacity="0.7" strokeLinecap="round"/>
    {/* Trachea posterior wall */}
    <path d="M300 495 C300 515 299 535 298 555 C297 572 297 582 298 590"
      stroke="url(#throatGrad)" strokeWidth="2.5" fill="none" opacity="0.7" strokeLinecap="round"/>
    {/* Tracheal cartilage rings */}
    {[488, 512, 536, 560].map((y, i) => (
      <path key={i} d={`M218 ${y} C228 ${y+10} 255 ${y+14} 268 ${y+12} C280 ${y+10} 295 ${y+5} 300 ${y-2}`}
        stroke="url(#throatGrad)" strokeWidth="2" fill="none" opacity={0.5 - i * 0.08} strokeLinecap="round"/>
    ))}
    {/* Esophagus (behind trachea, dashed) */}
    <path d="M316 370 C322 400 325 440 324 480 C323 520 320 555 318 585"
      stroke="url(#throatGrad)" strokeWidth="1.5" fill="none" opacity="0.25" strokeDasharray="6 4" strokeLinecap="round"/>
    <path d="M336 375 C340 405 342 445 340 485 C338 525 335 558 333 588"
      stroke="url(#throatGrad)" strokeWidth="1.5" fill="none" opacity="0.25" strokeDasharray="6 4" strokeLinecap="round"/>
    {/* Palatine tonsils */}
    <ellipse cx="268" cy="192" rx="14" ry="25" stroke="url(#throatGrad)" strokeWidth="1.5" fill="none" opacity="0.35"/>
    <ellipse cx="310" cy="202" rx="12" ry="22" stroke="url(#throatGrad)" strokeWidth="1.5" fill="none" opacity="0.35"/>
    <defs>
      <linearGradient id="throatGrad" x1="100" y1="0" x2="300" y2="600">
        <stop offset="0%" stopColor="#f59e0b"/>
        <stop offset="50%" stopColor="#ef4444"/>
        <stop offset="100%" stopColor="#f59e0b"/>
      </linearGradient>
      <radialGradient id="uvulaGrad" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#ef4444" stopOpacity="0.3"/>
        <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.05"/>
      </radialGradient>
      <linearGradient id="vocalGrad" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.2"/>
        <stop offset="50%" stopColor="#f59e0b" stopOpacity="1"/>
        <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.2"/>
      </linearGradient>
    </defs>
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

        <div className="relative z-10 text-center px-6 max-w-5xl mx-auto">
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
