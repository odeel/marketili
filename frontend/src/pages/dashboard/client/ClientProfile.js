// frontend/src/pages/dashboard/client/ClientProfile.js
import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import profileService from "../../../services/profileService";
import uploadService  from "../../../services/uploadService";
import postService    from "../../../services/postService";
import useAuth        from "../../../hooks/useAuth";

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (d) =>
  d ? new Date(d).toLocaleDateString("fr-DZ", { day: "2-digit", month: "long", year: "numeric" }) : "—";

const relTime = (d) => {
  const diff  = Date.now() - new Date(d).getTime();
  const days  = Math.floor(diff / 86400000);
  const hours = Math.floor(diff / 3600000);
  const mins  = Math.floor(diff / 60000);
  if (mins  < 60) return `il y a ${mins}min`;
  if (hours < 24) return `il y a ${hours}h`;
  if (days  <  7) return `il y a ${days}j`;
  return fmt(d);
};

const COMPANY_SIZE_OPTIONS = ["1-10", "11-50", "51-200", "201-500", "500+"];

const POST_TYPE_META = {
  update:       { label: "Mise à jour",  color: "#0891b2" },
  achievement:  { label: "Réalisation",  color: "#059669" },
  campaign:     { label: "Campagne",     color: "#7c3aed" },
  announcement: { label: "Annonce",      color: "#d97706" },
};

// ── Avatar ────────────────────────────────────────────────────────────────────
const AvatarCircle = ({ src, name, size = 72 }) => {
  const initials = (name || "?").split(" ").slice(0, 2).map(w => w[0]?.toUpperCase()).join("");
  if (src) return (
    <img src={src} alt={name}
      style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", flexShrink: 0,
        border: "3px solid var(--d-border-soft)" }} />
  );
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", flexShrink: 0,
      background: "linear-gradient(135deg,#c0152a,#7c0011)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.34, fontWeight: 800, color: "#fff",
      border: "3px solid var(--d-border-soft)", letterSpacing: "-0.02em" }}>
      {initials}
    </div>
  );
};

// ── TagInput ──────────────────────────────────────────────────────────────────
const TagInput = ({ value = [], onChange, placeholder = "Ajouter..." }) => {
  const [input, setInput] = useState("");
  const add = () => {
    const v = input.trim();
    if (v && !value.includes(v)) onChange([...value, v]);
    setInput("");
  };
  return (
    <div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: value.length ? 10 : 0 }}>
        {value.map((t, i) => (
          <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 5,
            padding: "4px 10px", borderRadius: 20, fontSize: "0.75rem", fontWeight: 600,
            background: "#fff0f0", color: "#c0152a", border: "1px solid #fca5a5" }}>
            {t}
            <button type="button" onClick={() => onChange(value.filter((_, j) => j !== i))}
              style={{ background: "none", border: "none", cursor: "pointer", color: "#c0152a",
                padding: 0, lineHeight: 1, fontSize: "0.7rem" }}>×</button>
          </span>
        ))}
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <input className="dash-form-input" style={{ flex: 1 }} value={input} placeholder={placeholder}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); add(); } }} />
        <button type="button" onClick={add}
          style={{ padding: "0 14px", borderRadius: 8, border: "1.5px solid var(--d-accent)",
            background: "transparent", color: "var(--d-accent)", fontFamily: "inherit",
            fontWeight: 700, cursor: "pointer", fontSize: "0.82rem", whiteSpace: "nowrap" }}>
          + Ajouter
        </button>
      </div>
    </div>
  );
};

// ── InfoRow ───────────────────────────────────────────────────────────────────
const InfoRow = ({ label, value, icon }) => (
  <div style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "10px 0",
    borderBottom: "1px solid var(--d-border-soft)" }}>
    {icon && (
      <span style={{ fontSize: "0.9rem", color: "var(--d-muted)", marginTop: 1, width: 18,
        textAlign: "center", flexShrink: 0 }}>
        {icon}
      </span>
    )}
    <div style={{ minWidth: 120, flexShrink: 0 }}>
      <span style={{ fontSize: "0.72rem", color: "var(--d-muted)", fontWeight: 600,
        textTransform: "uppercase", letterSpacing: "0.04em" }}>
        {label}
      </span>
    </div>
    <div style={{ flex: 1, fontSize: "0.875rem", color: value ? "var(--d-ink)" : "var(--d-muted)",
      fontWeight: value ? 500 : 400, wordBreak: "break-word" }}>
      {value || "—"}
    </div>
  </div>
);

// ── StatCard ──────────────────────────────────────────────────────────────────
const StatMini = ({ label, value, color = "var(--d-accent)" }) => (
  <div style={{ textAlign: "center", padding: "14px 10px", flex: 1 }}>
    <div style={{ fontSize: "1.6rem", fontWeight: 800, color, lineHeight: 1 }}>{value ?? "—"}</div>
    <div style={{ fontSize: "0.7rem", color: "var(--d-muted)", marginTop: 4, fontWeight: 500 }}>{label}</div>
  </div>
);

// ── Post feed ─────────────────────────────────────────────────────────────────
const PostFeed = ({ userId }) => {
  const [posts,    setPosts]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [content,  setContent]  = useState("");
  const [postType, setPostType] = useState("update");
  const [posting,  setPosting]  = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    profileService.getPosts("client", userId)
      .then(d => setPosts(d.posts || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  const handlePost = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    setPosting(true);
    try { await profileService.createPost({ content, postType }); setContent(""); setShowForm(false); load(); }
    catch {}
    finally { setPosting(false); }
  };

  const handleDelete = async (id) => {
    try { await profileService.deletePost(id); setPosts(p => p.filter(x => x._id !== id)); }
    catch {}
  };

  return (
    <div className="card" style={{ marginTop: 20 }}>
      <div className="card-header">
        <div className="section-head">
          <div>
            <div className="section-head-title">Publications</div>
            <div className="section-head-sub">Vos mises à jour, réalisations et annonces</div>
          </div>
          <button onClick={() => setShowForm(o => !o)}
            style={{ padding: "7px 16px", borderRadius: 8,
              border: "1.5px solid var(--d-accent)",
              background: showForm ? "var(--d-accent)" : "transparent",
              color: showForm ? "#fff" : "var(--d-accent)",
              fontFamily: "inherit", fontSize: "0.8rem", fontWeight: 700, cursor: "pointer" }}>
            {showForm ? "Annuler" : "+ Publier"}
          </button>
        </div>
      </div>

      <div className="card-body">
        <AnimatePresence>
          {showForm && (
            <motion.form onSubmit={handlePost}
              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }} style={{ overflow: "hidden", marginBottom: 18 }}>
              <div style={{ padding: 16, borderRadius: 10,
                border: "1px solid var(--d-border)", background: "var(--d-bg)" }}>
                <select value={postType} onChange={e => setPostType(e.target.value)}
                  className="dash-form-input" style={{ marginBottom: 10, width: "auto" }}>
                  {Object.entries(POST_TYPE_META).map(([v, m]) => (
                    <option key={v} value={v}>{m.label}</option>
                  ))}
                </select>
                <textarea value={content} onChange={e => setContent(e.target.value)}
                  placeholder="Partagez une réalisation, une mise à jour..."
                  rows={3} required className="dash-form-input"
                  style={{ resize: "vertical", display: "block", width: "100%", marginBottom: 10 }} />
                <button type="submit" disabled={posting || !content.trim()}
                  className="section-cta-btn"
                  style={{ opacity: posting || !content.trim() ? 0.6 : 1 }}>
                  {posting ? "Publication..." : "Publier"}
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        {loading ? (
          <div style={{ textAlign: "center", padding: "32px 0", color: "var(--d-muted)", fontSize: "0.85rem" }}>
            Chargement...
          </div>
        ) : posts.length === 0 ? (
          <div className="empty-state" style={{ padding: "32px 0" }}>
            <div className="empty-state-icon" style={{ fontSize: "1.5rem" }}>◈</div>
            <div className="empty-state-title">Aucune publication</div>
            <div className="empty-state-sub">Partagez votre première réalisation.</div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <AnimatePresence>
              {posts.map((p, i) => {
                const meta = POST_TYPE_META[p.postType] || POST_TYPE_META.update;
                return (
                  <motion.div key={p._id}
                    initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -10 }} transition={{ delay: i * 0.04 }}
                    style={{ padding: "14px 16px", borderRadius: 10,
                      border: "1px solid var(--d-border-soft)",
                      borderLeft: `3px solid ${meta.color}`,
                      background: "#fff" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                      <span style={{ fontSize: "0.68rem", fontWeight: 700, color: meta.color,
                        padding: "2px 8px", borderRadius: 10, background: meta.color + "18" }}>
                        {meta.label}
                      </span>
                      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                        <span style={{ fontSize: "0.7rem", color: "var(--d-muted)" }}>{relTime(p.createdAt)}</span>
                        <button onClick={() => handleDelete(p._id)}
                          style={{ background: "none", border: "none", cursor: "pointer",
                            color: "var(--d-muted)", fontSize: "0.8rem", padding: "2px 4px",
                            fontFamily: "inherit", lineHeight: 1 }}>×</button>
                      </div>
                    </div>
                    <p style={{ margin: 0, fontSize: "0.87rem", lineHeight: 1.6,
                      color: "var(--d-ink-soft)", whiteSpace: "pre-wrap" }}>
                      {p.content}
                    </p>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
// ROOT
// ═════════════════════════════════════════════════════════════════════════════
const ClientProfile = () => {
  const { user } = useAuth();

  const [profile,  setProfile]  = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [editing,  setEditing]  = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState("");
  const [saved,    setSaved]    = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const photoRef = useRef();

  // Editable form state
  const [form, setForm] = useState({
    bio: "", phone: "", industry: "", fieldOfWork: "",
    achievements: [],
    location: { city: "", region: "", country: "" },
    avatar: "",
  });

  const load = useCallback(() => {
    if (!user) return;
    setLoading(true);
    profileService.getProfile("client", user._id)
      .then(d => {
        const p = d.profile;
        setProfile(p);
        setForm({
          bio:          p.bio          || "",
          phone:        p.phone        || "",
          industry:     p.industry     || "",
          fieldOfWork:  p.fieldOfWork  || "",
          achievements: p.achievements || [],
          location: {
            city:    p.location?.city    || "",
            region:  p.location?.region  || "",
            country: p.location?.country || "",
          },
          avatar: p.avatar || "",
        });
      })
      .catch(() => setError("Impossible de charger le profil"))
      .finally(() => setLoading(false));
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const set = (field, val) => setForm(prev => ({ ...prev, [field]: val }));
  const setLoc = (field, val) =>
    setForm(prev => ({ ...prev, location: { ...prev.location, [field]: val } }));

  const handleSave = async () => {
    setSaving(true); setError("");
    try {
      const result = await profileService.updateProfile(form);
      setProfile(result.profile);
      setEditing(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err.response?.data?.message || "Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    const p = profile;
    setForm({
      bio:          p.bio          || "",
      phone:        p.phone        || "",
      industry:     p.industry     || "",
      fieldOfWork:  p.fieldOfWork  || "",
      achievements: p.achievements || [],
      location: {
        city:    p.location?.city    || "",
        region:  p.location?.region  || "",
        country: p.location?.country || "",
      },
      avatar: p.avatar || "",
    });
    setEditing(false);
    setError("");
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarUploading(true);
    try {
      const res = await uploadService.upload(file);
      set("avatar", res.url);
    } catch {
      setError("Impossible d'uploader la photo.");
    } finally {
      setAvatarUploading(false);
    }
  };

  if (!user) return null;

  if (loading) return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center",
      minHeight: 300 }}>
      <div className="spinner" />
    </div>
  );

  if (!profile) return (
    <div className="empty-state" style={{ padding: "60px 0" }}>
      <div className="empty-state-icon">◎</div>
      <div className="empty-state-title">Profil introuvable</div>
    </div>
  );

  const displayName = profile.accountType === "company"
    ? profile.companyName
    : `${profile.firstName || ""} ${profile.lastName || ""}`.trim();

  const isCompany    = profile.accountType === "company";
  const locationStr  = [profile.location?.city, profile.location?.region, profile.location?.country]
    .filter(Boolean).join(", ");

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>

      {/* ── Page header ──────────────────────────────────────────────── */}
      <div className="section-head" style={{ marginBottom: 20 }}>
        <div>
          <div className="section-head-title">Mon profil</div>
          <div className="section-head-sub">
            Vos informations visibles par les prestataires
          </div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <AnimatePresence mode="wait">
            {editing ? (
              <motion.div key="edit-btns"
                initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                style={{ display: "flex", gap: 8 }}>
                <button onClick={handleCancel} disabled={saving}
                  style={{ padding: "8px 18px", borderRadius: 8,
                    border: "1px solid var(--d-border)", background: "transparent",
                    color: "var(--d-muted)", fontFamily: "inherit", fontSize: "0.82rem",
                    fontWeight: 600, cursor: "pointer" }}>
                  Annuler
                </button>
                <button onClick={handleSave} disabled={saving}
                  className="section-cta-btn" style={{ opacity: saving ? 0.7 : 1 }}>
                  {saving ? "Sauvegarde..." : "Enregistrer"}
                </button>
              </motion.div>
            ) : (
              <motion.button key="view-btn"
                initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                onClick={() => setEditing(true)}
                style={{ padding: "8px 20px", borderRadius: 8,
                  border: "1.5px solid var(--d-accent)", background: "transparent",
                  color: "var(--d-accent)", fontFamily: "inherit", fontSize: "0.82rem",
                  fontWeight: 700, cursor: "pointer" }}>
                Modifier le profil
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Error / Success banners ───────────────────────────────────── */}
      <AnimatePresence>
        {error && (
          <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            style={{ padding: "10px 16px", borderRadius: 8, marginBottom: 14,
              background: "#fff0f0", border: "1px solid #fca5a5",
              color: "#991b1b", fontSize: "0.82rem" }}>
            {error}
          </motion.div>
        )}
        {saved && (
          <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            style={{ padding: "10px 16px", borderRadius: 8, marginBottom: 14,
              background: "#f0fdf4", border: "1px solid #6ee7b7",
              color: "#065f46", fontSize: "0.82rem" }}>
            Profil mis à jour avec succès.
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Hero card ─────────────────────────────────────────────────── */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-body">
          <div style={{ display: "flex", gap: 20, alignItems: "flex-start", flexWrap: "wrap" }}>
            {/* Avatar */}
            <div style={{ position: "relative", flexShrink: 0 }}>
              <input ref={photoRef} type="file" accept="image/*" style={{ display: "none" }}
                onChange={handleAvatarChange} />
              <AvatarCircle
                src={editing ? (form.avatar || profile.avatar) : profile.avatar}
                name={displayName} size={80}
              />
              {editing && (
                <button type="button" onClick={() => photoRef.current?.click()}
                  disabled={avatarUploading}
                  style={{
                    position: "absolute", bottom: 0, right: 0, width: 26, height: 26,
                    borderRadius: "50%", background: "#c0152a", border: "2px solid #fff",
                    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "0.75rem", color: "#fff",
                  }}>
                  {avatarUploading ? "..." : "📷"}
                </button>
              )}
            </div>

            {/* Name + meta */}
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 6 }}>
                <h2 style={{ margin: 0, fontSize: "1.3rem", fontWeight: 800, color: "var(--d-ink)" }}>
                  {displayName || "—"}
                </h2>
                <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: "0.7rem",
                  fontWeight: 700, background: "var(--d-accent-soft)", color: "var(--d-accent)" }}>
                  Client
                </span>
                <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: "0.7rem",
                  fontWeight: 600, background: "#f3f4f6", color: "#6b7280" }}>
                  {isCompany ? "Entreprise" : "Particulier"}
                </span>
              </div>

              {/* Industry + fieldOfWork read-only display */}
              {!editing && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 6 }}>
                  {profile.industry && (
                    <span style={{ padding: "4px 12px", borderRadius: 20, fontSize: "0.78rem",
                      fontWeight: 700, background: "var(--d-accent-soft)", color: "var(--d-accent)" }}>
                      {profile.industry}
                    </span>
                  )}
                  {profile.fieldOfWork && (
                    <span style={{ fontSize: "0.84rem", color: "#6b7280", alignSelf: "center" }}>
                      {profile.fieldOfWork}
                    </span>
                  )}
                </div>
              )}

              {!editing && profile.bio && (
                <p style={{ margin: "8px 0 0", fontSize: "0.875rem", color: "#555",
                  lineHeight: 1.65, maxWidth: 560 }}>
                  {profile.bio}
                </p>
              )}

              {!editing && locationStr && (
                <div style={{ fontSize: "0.78rem", color: "var(--d-muted)", marginTop: 8 }}>
                  📍 {locationStr}
                </div>
              )}
            </div>
          </div>

          {/* Edit mode: bio, industry, fieldOfWork */}
          {editing && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 14 }}>
              <div className="dash-form-row" style={{ alignItems: "flex-start" }}>
                <div className="dash-form-group" style={{ flex: 1 }}>
                  <label className="dash-form-label">Secteur d'activité</label>
                  <input className="dash-form-input" value={form.industry}
                    onChange={e => set("industry", e.target.value)}
                    placeholder="Ex: Technologie, Agroalimentaire, Santé..." />
                </div>
                <div className="dash-form-group" style={{ flex: 1 }}>
                  <label className="dash-form-label">Domaine / Description courte</label>
                  <input className="dash-form-input" value={form.fieldOfWork}
                    onChange={e => set("fieldOfWork", e.target.value)}
                    placeholder="Ex: Startup tech B2B, distribution alimentaire..." />
                </div>
              </div>
              <div className="dash-form-group">
                <label className="dash-form-label">Bio</label>
                <textarea className="dash-form-input" rows={3} value={form.bio}
                  onChange={e => set("bio", e.target.value)}
                  placeholder="Décrivez votre activité, vos besoins, vos objectifs marketing..."
                  style={{ resize: "vertical" }} />
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* ── Two-column section ────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: 20, marginBottom: 20 }}>

        {/* Left: contact + location */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Contact info */}
          <div className="card">
            <div className="card-header">
              <div className="section-head-title" style={{ fontSize: "0.9rem" }}>Informations de contact</div>
            </div>
            <div className="card-body" style={{ paddingTop: 10 }}>
              {editing ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div className="dash-form-group" style={{ margin: 0 }}>
                    <label className="dash-form-label">Téléphone</label>
                    <input className="dash-form-input" value={form.phone}
                      onChange={e => set("phone", e.target.value)}
                      placeholder="+213 5xx xxx xxx" />
                  </div>
                  <div className="dash-form-group" style={{ margin: 0 }}>
                    <label className="dash-form-label" style={{ color: "var(--d-muted)" }}>
                      Email <span style={{ fontWeight: 400, fontStyle: "italic" }}>(non modifiable)</span>
                    </label>
                    <input className="dash-form-input" value={profile.email} disabled
                      style={{ background: "var(--d-bg)", color: "var(--d-muted)", cursor: "not-allowed" }} />
                  </div>
                </div>
              ) : (
                <>
                  <InfoRow label="Email"     value={profile.email}  icon="✉" />
                  <InfoRow label="Téléphone" value={profile.phone}  icon="☎" />
                  <InfoRow label="Membre depuis" value={fmt(profile.createdAt)} icon="📅" />
                </>
              )}
            </div>
          </div>

          {/* Localisation */}
          <div className="card">
            <div className="card-header">
              <div className="section-head-title" style={{ fontSize: "0.9rem" }}>Localisation</div>
            </div>
            <div className="card-body" style={{ paddingTop: 10 }}>
              {editing ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <div className="dash-form-group" style={{ margin: 0 }}>
                    <label className="dash-form-label">Ville</label>
                    <input className="dash-form-input" value={form.location.city}
                      onChange={e => setLoc("city", e.target.value)} placeholder="Alger, Oran..." />
                  </div>
                  <div className="dash-form-group" style={{ margin: 0 }}>
                    <label className="dash-form-label">Wilaya / Région</label>
                    <input className="dash-form-input" value={form.location.region}
                      onChange={e => setLoc("region", e.target.value)} placeholder="Alger, Oran, Annaba..." />
                  </div>
                  <div className="dash-form-group" style={{ margin: 0 }}>
                    <label className="dash-form-label">Pays</label>
                    <input className="dash-form-input" value={form.location.country}
                      onChange={e => setLoc("country", e.target.value)} placeholder="Algérie" />
                  </div>
                </div>
              ) : (
                <>
                  <InfoRow label="Ville"   value={profile.location?.city}    icon="🏙" />
                  <InfoRow label="Région"  value={profile.location?.region}  icon="📌" />
                  <InfoRow label="Pays"    value={profile.location?.country} icon="🌍" />
                </>
              )}
            </div>
          </div>

          {/* Company info (company accounts only) */}
          {isCompany && (
            <div className="card">
              <div className="card-header">
                <div className="section-head-title" style={{ fontSize: "0.9rem" }}>Informations entreprise</div>
              </div>
              <div className="card-body" style={{ paddingTop: 10 }}>
                <InfoRow label="Raison sociale" value={profile.companyName} icon="🏢" />
                {profile.companySize && (
                  <InfoRow label="Taille" value={`${profile.companySize} employés`} icon="👥" />
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right: stats + achievements */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Stats */}
          <div className="card">
            <div className="card-header">
              <div className="section-head-title" style={{ fontSize: "0.9rem" }}>Statistiques</div>
            </div>
            <div className="card-body" style={{ padding: "0 0 4px" }}>
              <div style={{ display: "flex", borderBottom: "1px solid var(--d-border-soft)" }}>
                <StatMini label="Projets terminés" value={profile.completedProjects ?? 0}
                  color="var(--d-accent)" />
                <div style={{ width: 1, background: "var(--d-border-soft)", alignSelf: "stretch", margin: "10px 0" }} />
                <StatMini label="Réalisations" value={profile.achievements?.length ?? 0}
                  color="#7c3aed" />
              </div>
              <div style={{ padding: "10px 22px", display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%",
                  background: profile.isActive ? "#10b981" : "#9ca3af" }} />
                <span style={{ fontSize: "0.78rem", color: "var(--d-muted)" }}>
                  Compte {profile.isActive ? "actif" : "inactif"}
                  {profile.isVerified && " · Vérifié"}
                </span>
              </div>
            </div>
          </div>

          {/* Achievements */}
          <div className="card" style={{ flex: 1 }}>
            <div className="card-header">
              <div className="section-head-title" style={{ fontSize: "0.9rem" }}>Réalisations & Références</div>
              <div className="section-head-sub">Tags visibles sur votre profil public</div>
            </div>
            <div className="card-body">
              {editing ? (
                <TagInput
                  value={form.achievements}
                  onChange={v => set("achievements", v)}
                  placeholder="Ex: Lancement produit, 10K followers..."
                />
              ) : (
                <>
                  {profile.achievements?.length > 0 ? (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                      {profile.achievements.map((a, i) => (
                        <span key={i} style={{ padding: "5px 13px", borderRadius: 20,
                          fontSize: "0.78rem", fontWeight: 600,
                          background: "var(--d-accent-soft)", color: "var(--d-accent)",
                          border: "1px solid #fca5a5" }}>
                          {a}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div style={{ color: "var(--d-muted)", fontSize: "0.82rem",
                      fontStyle: "italic", padding: "8px 0" }}>
                      Aucune réalisation renseignée. Cliquez sur "Modifier le profil" pour en ajouter.
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Account type details (person) */}
          {!isCompany && (
            <div className="card">
              <div className="card-header">
                <div className="section-head-title" style={{ fontSize: "0.9rem" }}>Compte personnel</div>
              </div>
              <div className="card-body" style={{ paddingTop: 10 }}>
                <InfoRow label="Prénom" value={profile.firstName} icon="👤" />
                <InfoRow label="Nom"    value={profile.lastName}  icon="" />
              </div>
            </div>
          )}

        </div>
      </div>

      {/* ── Publications feed ─────────────────────────────────────────── */}
      <PostFeed userId={user._id} />

    </motion.div>
  );
};

export default ClientProfile;
