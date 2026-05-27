import React, { useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, Link } from "react-router-dom";
import "../styles/landing.css";

const FADE_UP = {
  hidden: { opacity: 0, y: 28 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: [0.4, 0, 0.2, 1] },
  }),
};

const WA_NUMBER = "213676774374";
const WA_HREF   = `https://wa.me/${WA_NUMBER}`;
const EMAIL     = "contact@marketili.dz";

// ── Navbar ────────────────────────────────────────────────────────────────────
const Navbar = ({ contactRef }) => {
  const [open, setOpen] = useState(false);
  const scrollTo = (ref) => { ref?.current?.scrollIntoView({ behavior: "smooth" }); setOpen(false); };
  return (
    <nav className="lp-nav">
      <div className="lp-nav-logo">
        <img src="/marketelli_logo_1.png" alt="Marketili"
          style={{ height: 36, objectFit: "contain", display: "block" }} />
      </div>
      <div className="lp-nav-center">
        <button className="lp-nav-link" onClick={() => scrollTo(contactRef)}>Contact</button>
      </div>
      <div className="lp-nav-actions">
        <Link to="/login"    className="lp-nav-ghost">Se connecter</Link>
        <Link to="/register" className="lp-nav-cta">Créer un compte</Link>
      </div>
      <button className="lp-hamburger" onClick={() => setOpen(o => !o)} aria-label="menu">
        <span /><span /><span />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div className="lp-mobile-menu"
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
            <button onClick={() => scrollTo(contactRef)}>Contact</button>
            <Link to="/login"    onClick={() => setOpen(false)}>Se connecter</Link>
            <Link to="/register" onClick={() => setOpen(false)} className="lp-mobile-cta">Créer un compte</Link>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

// ── Hero mock ─────────────────────────────────────────────────────────────────
const HeroMock = () => (
  <div className="lp-mock">
    <div className="lp-mock-card">
      <div className="lp-mock-chip lp-chip-blue">Brief</div>
      <div className="lp-mock-title">Campagne réseaux sociaux Q1</div>
      <div className="lp-mock-meta">Budget : 150 000 DA · Délai : 21 jours</div>
      <div className="lp-mock-bar"><div className="lp-mock-bar-fill" style={{ width: "65%" }} /></div>
      <div className="lp-mock-row">
        <span className="lp-mock-badge lp-badge-green">3 offres reçues</span>
        <span className="lp-mock-date">il y a 2 h</span>
      </div>
    </div>
    <div className="lp-mock-card lp-mock-card-sm">
      <div className="lp-mock-chip lp-chip-red">Pitch</div>
      <div className="lp-mock-title">Agence 360° · Stratégie complète</div>
      <div className="lp-mock-meta">Proposé · 180 000 DA</div>
      <div className="lp-mock-row">
        <span className="lp-mock-badge lp-badge-yellow">En attente</span>
      </div>
    </div>
    <div className="lp-mock-card lp-mock-card-sm">
      <div className="lp-mock-chip lp-chip-purple">Projet</div>
      <div className="lp-mock-title">Shooting Produit — Oran</div>
      <div className="lp-mock-bar"><div className="lp-mock-bar-fill" style={{ width: "40%" }} /></div>
      <div className="lp-mock-meta">4 tâches · 2 terminées</div>
    </div>
  </div>
);

// ── Contact form ──────────────────────────────────────────────────────────────
const QUESTION_TYPES = [
  { v: "",                   l: "Choisir un sujet..."         },
  { v: "inscription",        l: "Inscription / Compte"        },
  { v: "partenariat",        l: "Partenariat"                 },
  { v: "question_generale",  l: "Question générale"           },
  { v: "signalement",        l: "Signalement / Problème"      },
  { v: "autre",              l: "Autre"                       },
];

const ContactForm = () => {
  const [form,    setForm]    = useState({ name: "", email: "", phone: "", subject: "", message: "" });
  const [sent,    setSent]    = useState(false);
  const [sending, setSending] = useState(false);
  const [err,     setErr]     = useState("");

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.message.trim() || !form.subject) {
      setErr("Merci de remplir tous les champs obligatoires.");
      return;
    }
    setErr("");
    setSending(true);

    const subjectLine = `[Marketili] ${QUESTION_TYPES.find(q => q.v === form.subject)?.l || form.subject} — ${form.name}`;
    const body = [
      `Nom : ${form.name}`,
      `Email : ${form.email}`,
      form.phone ? `Téléphone : ${form.phone}` : "",
      `Sujet : ${subjectLine}`,
      "",
      form.message,
    ].filter(Boolean).join("\n");

    window.location.href = `mailto:${EMAIL}?subject=${encodeURIComponent(subjectLine)}&body=${encodeURIComponent(body)}`;

    setTimeout(() => { setSent(true); setSending(false); }, 600);
  };

  const handleReset = () => {
    setForm({ name: "", email: "", phone: "", subject: "", message: "" });
    setSent(false);
    setErr("");
  };

  if (sent) return (
    <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
      style={{ textAlign: "center", padding: "40px 24px",
        background: "rgba(255,255,255,0.04)", borderRadius: 14,
        border: "1px solid rgba(255,255,255,0.1)" }}>
      <div style={{ width: 52, height: 52, borderRadius: "50%",
        background: "rgba(16,185,129,0.15)", border: "1.5px solid #10b981",
        display: "flex", alignItems: "center", justifyContent: "center",
        margin: "0 auto 16px", fontSize: "1.4rem" }}>
        ✓
      </div>
      <h3 style={{ margin: "0 0 8px", fontSize: "1.1rem", fontWeight: 700, color: "#fff" }}>
        Message envoyé
      </h3>
      <p style={{ margin: "0 0 20px", fontSize: "0.875rem", color: "rgba(255,255,255,0.55)", lineHeight: 1.6 }}>
        Votre client mail s'est ouvert avec le message pré-rempli.<br />
        Nous vous répondrons dans les meilleurs délais.
      </p>
      <button onClick={handleReset} className="lp-btn-outline" style={{ fontSize: "0.82rem", padding: "8px 20px" }}>
        Envoyer un autre message
      </button>
    </motion.div>
  );

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <div className="lp-contact-field">
          <label className="lp-contact-label-field">Nom complet *</label>
          <input className="lp-contact-input" required
            value={form.name} onChange={e => set("name", e.target.value)}
            placeholder="Votre nom" />
        </div>
        <div className="lp-contact-field">
          <label className="lp-contact-label-field">Email *</label>
          <input className="lp-contact-input" type="email" required
            value={form.email} onChange={e => set("email", e.target.value)}
            placeholder="vous@exemple.com" />
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <div className="lp-contact-field">
          <label className="lp-contact-label-field">Téléphone <span style={{ opacity: 0.5 }}>(optionnel)</span></label>
          <input className="lp-contact-input"
            value={form.phone} onChange={e => set("phone", e.target.value)}
            placeholder="+213 5xx xxx xxx" />
        </div>
        <div className="lp-contact-field">
          <label className="lp-contact-label-field">Sujet *</label>
          <select className="lp-contact-input" required
            value={form.subject} onChange={e => set("subject", e.target.value)}>
            {QUESTION_TYPES.map(q => (
              <option key={q.v} value={q.v} disabled={q.v === ""}>{q.l}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="lp-contact-field">
        <label className="lp-contact-label-field">Message *</label>
        <textarea className="lp-contact-input" required rows={5}
          value={form.message} onChange={e => set("message", e.target.value)}
          placeholder="Décrivez votre question ou demande..."
          style={{ resize: "vertical" }} />
      </div>

      {err && (
        <div style={{ padding: "8px 14px", borderRadius: 8, background: "rgba(192,21,42,0.15)",
          border: "1px solid rgba(192,21,42,0.4)", color: "#fca5a5", fontSize: "0.82rem" }}>
          {err}
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap", marginTop: 4 }}>
        <button type="submit" className="lp-btn-primary" disabled={sending}
          style={{ opacity: sending ? 0.7 : 1 }}>
          {sending ? "Envoi..." : "Envoyer le message →"}
        </button>
        <a href={WA_HREF} target="_blank" rel="noopener noreferrer"
          style={{ fontSize: "0.8rem", color: "#25d366", textDecoration: "none",
            display: "flex", alignItems: "center", gap: 6, fontWeight: 600 }}>
          <svg width="16" height="16" viewBox="0 0 32 32" fill="currentColor">
            <path d="M16 0C7.164 0 0 7.163 0 16c0 2.824.738 5.476 2.027 7.785L0 32l8.418-2.002A15.93 15.93 0 0 0 16 32c8.836 0 16-7.163 16-16S24.836 0 16 0zm8.27 22.516c-.343.965-2 1.84-2.742 1.957-.7.112-1.582.16-2.555-.16-.588-.188-1.344-.44-2.313-.862-4.063-1.75-6.72-5.836-6.922-6.105-.199-.27-1.625-2.164-1.625-4.129s1.028-2.93 1.395-3.328c.367-.398.8-.496 1.066-.496.266 0 .531.003.762.015.244.012.572-.093.895.684.34.8 1.156 2.766 1.258 2.965.102.2.168.434.035.7-.133.265-.2.43-.398.664-.2.234-.42.523-.601.703-.2.2-.407.414-.175.813.234.398 1.04 1.718 2.23 2.781 1.531 1.363 2.82 1.785 3.22 1.984.397.2.628.168.862-.102.234-.27 1.003-1.168 1.27-1.566.265-.398.53-.332.895-.2.367.133 2.329 1.098 2.727 1.297.398.2.664.3.762.465.1.164.1.965-.243 1.93z"/>
          </svg>
          Réponse rapide sur WhatsApp
        </a>
      </div>
    </form>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
// ROOT
// ═════════════════════════════════════════════════════════════════════════════
const LandingPage = () => {
  const navigate   = useNavigate();
  const contactRef = useRef(null);

  useEffect(() => { document.title = "Marketili — Plateforme Marketing"; }, []);

  return (
    <div className="lp-root">
      <Navbar contactRef={contactRef} />

      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section className="lp-section lp-hero">
        <div className="lp-hero-glow" />
        <div className="lp-container lp-hero-inner">
          <div className="lp-hero-text">
            <motion.div variants={FADE_UP} initial="hidden" animate="visible" custom={0}>
              <span className="lp-eyebrow">
                <span className="lp-eyebrow-dot" />
                La plateforme marketing algérienne
              </span>
            </motion.div>
            <motion.h1 className="lp-hero-h1" variants={FADE_UP} initial="hidden" animate="visible" custom={1}>
              Le marketing professionnel,<br /><span className="lp-accent">enfin structuré.</span>
            </motion.h1>
            <motion.p className="lp-hero-sub" variants={FADE_UP} initial="hidden" animate="visible" custom={2}>
              Marketili connecte les entreprises avec les agences, équipes et créateurs dans un seul espace de travail — des briefs aux livrables.
            </motion.p>
            <motion.div className="lp-hero-btns" variants={FADE_UP} initial="hidden" animate="visible" custom={3}>
              <button className="lp-btn-primary" onClick={() => navigate("/register?role=client")}>Publier un projet</button>
              <button className="lp-btn-outline" onClick={() => navigate("/register")}>Proposer mes services</button>
            </motion.div>
          </div>
          <motion.div className="lp-hero-mock-wrap" variants={FADE_UP} initial="hidden" animate="visible" custom={2}>
            <HeroMock />
          </motion.div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────── */}
      <section className="lp-section lp-cta">
        <div className="lp-cta-glow" />
        <motion.div className="lp-container lp-cta-inner"
          variants={FADE_UP} initial="hidden" whileInView="visible" viewport={{ once: true }}>
          <h2 className="lp-h2 lp-text-center">
            Prêt à structurer vos collaborations marketing ?
          </h2>
          <p className="lp-cta-sub">
            Rejoignez Marketili et donnez à vos projets la structure qu'ils méritent.
          </p>
          <div className="lp-cta-btns">
            <button className="lp-btn-primary lp-btn-lg" onClick={() => navigate("/register")}>
              Créer mon compte gratuitement
            </button>
            <Link to="/login" className="lp-btn-outline lp-btn-lg">
              Se connecter
            </Link>
          </div>
        </motion.div>
      </section>

      {/* ── Contact ───────────────────────────────────────────────────── */}
      <section ref={contactRef} className="lp-section lp-contact">
        <div className="lp-container">
          <motion.div className="lp-section-head"
            variants={FADE_UP} initial="hidden" whileInView="visible" viewport={{ once: true }}>
            <span className="lp-label">Contact</span>
            <h2 className="lp-h2">Une question ? Écrivez-nous.</h2>
            <p className="lp-body-text">
              Remplissez le formulaire ci-dessous ou contactez-nous directement sur WhatsApp.
            </p>
          </motion.div>

          <motion.div className="lp-contact-form-wrap"
            variants={FADE_UP} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={1}>
            <ContactForm />
          </motion.div>

          {/* Quick contact row */}
          <motion.div className="lp-contact-quick"
            variants={FADE_UP} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={2}>
            <a href={`mailto:${EMAIL}`} className="lp-contact-quick-item">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="4" width="20" height="16" rx="2"/>
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
              </svg>
              {EMAIL}
            </a>
            <a href={WA_HREF} target="_blank" rel="noopener noreferrer" className="lp-contact-quick-item lp-contact-quick-wa">
              <svg width="16" height="16" viewBox="0 0 32 32" fill="currentColor">
                <path d="M16 0C7.164 0 0 7.163 0 16c0 2.824.738 5.476 2.027 7.785L0 32l8.418-2.002A15.93 15.93 0 0 0 16 32c8.836 0 16-7.163 16-16S24.836 0 16 0zm8.27 22.516c-.343.965-2 1.84-2.742 1.957-.7.112-1.582.16-2.555-.16-.588-.188-1.344-.44-2.313-.862-4.063-1.75-6.72-5.836-6.922-6.105-.199-.27-1.625-2.164-1.625-4.129s1.028-2.93 1.395-3.328c.367-.398.8-.496 1.066-.496.266 0 .531.003.762.015.244.012.572-.093.895.684.34.8 1.156 2.766 1.258 2.965.102.2.168.434.035.7-.133.265-.2.43-.398.664-.2.234-.42.523-.601.703-.2.2-.407.414-.175.813.234.398 1.04 1.718 2.23 2.781 1.531 1.363 2.82 1.785 3.22 1.984.397.2.628.168.862-.102.234-.27 1.003-1.168 1.27-1.566.265-.398.53-.332.895-.2.367.133 2.329 1.098 2.727 1.297.398.2.664.3.762.465.1.164.1.965-.243 1.93z"/>
              </svg>
              +213 676 774 374
            </a>
          </motion.div>
        </div>
      </section>

      {/* ── Floating WhatsApp button ──────────────────────────────────── */}
      <a href={WA_HREF} target="_blank" rel="noopener noreferrer"
        className="lp-wa-float" aria-label="Contactez-nous sur WhatsApp">
        <svg width="26" height="26" viewBox="0 0 32 32" fill="currentColor">
          <path d="M16 0C7.164 0 0 7.163 0 16c0 2.824.738 5.476 2.027 7.785L0 32l8.418-2.002A15.93 15.93 0 0 0 16 32c8.836 0 16-7.163 16-16S24.836 0 16 0zm8.27 22.516c-.343.965-2 1.84-2.742 1.957-.7.112-1.582.16-2.555-.16-.588-.188-1.344-.44-2.313-.862-4.063-1.75-6.72-5.836-6.922-6.105-.199-.27-1.625-2.164-1.625-4.129s1.028-2.93 1.395-3.328c.367-.398.8-.496 1.066-.496.266 0 .531.003.762.015.244.012.572-.093.895.684.34.8 1.156 2.766 1.258 2.965.102.2.168.434.035.7-.133.265-.2.43-.398.664-.2.234-.42.523-.601.703-.2.2-.407.414-.175.813.234.398 1.04 1.718 2.23 2.781 1.531 1.363 2.82 1.785 3.22 1.984.397.2.628.168.862-.102.234-.27 1.003-1.168 1.27-1.566.265-.398.53-.332.895-.2.367.133 2.329 1.098 2.727 1.297.398.2.664.3.762.465.1.164.1.965-.243 1.93z"/>
        </svg>
        <span className="lp-wa-float-label">WhatsApp</span>
      </a>

      {/* ── Footer ────────────────────────────────────────────────────── */}
      <footer className="lp-footer">
        <div className="lp-container lp-footer-grid">
          <div className="lp-footer-brand">
            <div className="lp-footer-logo">
              <img src="/marketelli_logo_1.png" alt="Marketili"
                style={{ height: 36, objectFit: "contain", display: "block" }} />
            </div>
            <p className="lp-footer-tagline">La collaboration marketing professionnelle.</p>
            <div className="lp-footer-socials">
              <a href="#" className="lp-social-link" aria-label="LinkedIn">in</a>
              <a href="#" className="lp-social-link" aria-label="Instagram">ig</a>
            </div>
          </div>
          <div className="lp-footer-col">
            <h4 className="lp-footer-col-title">Compte</h4>
            <Link to="/login"                     className="lp-footer-link">Se connecter</Link>
            <Link to="/register?role=client"      className="lp-footer-link">Créer un compte client</Link>
            <Link to="/register?role=agency"      className="lp-footer-link">Inscrire mon agence</Link>
            <Link to="/register?role=freelancer"  className="lp-footer-link">Créer mon profil freelancer</Link>
          </div>
          <div className="lp-footer-col">
            <h4 className="lp-footer-col-title">Contact</h4>
            <a href={`mailto:${EMAIL}`}  className="lp-footer-link">{EMAIL}</a>
            <a href={WA_HREF} target="_blank" rel="noopener noreferrer" className="lp-footer-link">
              WhatsApp : +213 676 774 374
            </a>
            <span className="lp-footer-link lp-footer-muted">Conditions d'utilisation</span>
            <span className="lp-footer-link lp-footer-muted">Politique de confidentialité</span>
            <span className="lp-footer-link lp-footer-muted">Fait en Algérie 🇩🇿</span>
          </div>
        </div>
        <div className="lp-footer-bar">
          <span>© 2025 Marketili. Tous droits réservés.</span>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
