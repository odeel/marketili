import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import postService from "../../services/postService";
import uploadService from "../../services/uploadService";

const CATEGORIES = [
  "Social Media", "SEO / SEM", "Création de contenu", "Publicité payante",
  "Email marketing", "Branding", "Photographie", "Vidéo", "Influence",
  "Community management", "Stratégie digitale", "Design graphique",
];

const WILAYAT = [
  "Adrar","Chlef","Laghouat","Oum El Bouaghi","Batna","Béjaïa","Biskra",
  "Béchar","Blida","Bouira","Tamanrasset","Tébessa","Tlemcen","Tiaret",
  "Tizi Ouzou","Alger","Djelfa","Jijel","Sétif","Saïda","Skikda",
  "Sidi Bel Abbès","Annaba","Guelma","Constantine","Médéa","Mostaganem",
  "M'Sila","Mascara","Ouargla","Oran","El Bayadh","Illizi","Bordj Bou Arréridj",
  "Boumerdès","El Tarf","Tindouf","Tissemsilt","El Oued","Khenchela",
  "Souk Ahras","Tipaza","Mila","Aïn Defla","Naâma","Aïn Témouchent",
  "Ghardaïa","Relizane",
];

const INITIAL = {
  title: "", description: "", deadline: "",
  budget: { min: "", max: "", currency: "DZD" },
  location: { city: "", region: "", country: "Algérie" },
  categories: [],
  targetProviders: ["all"],
};

const CreatePostModal = ({ clientId, onClose, onCreated }) => {
  const [form,       setForm]       = useState(INITIAL);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState("");
  const [step,       setStep]       = useState(1);
  const [mediaFiles, setMediaFiles] = useState([]); // { file, preview, progress, uploaded }
  const [dragOver,   setDragOver]   = useState(false);
  const fileInputRef = useRef();

  const set       = (f, v)    => setForm(p => ({ ...p, [f]: v }));
  const setNested = (p, f, v) => setForm(prev => ({ ...prev, [p]: { ...prev[p], [f]: v } }));

  const toggleCategory = (cat) => setForm(p => ({
    ...p,
    categories: p.categories.includes(cat)
      ? p.categories.filter(c => c !== cat)
      : [...p.categories, cat],
  }));

  const toggleProvider = (p) => setForm(prev => {
    if (p === "all") return { ...prev, targetProviders: ["all"] };
    let next = prev.targetProviders.filter(x => x !== "all");
    next = next.includes(p) ? next.filter(x => x !== p) : [...next, p];
    return { ...prev, targetProviders: next.length ? next : ["all"] };
  });

  // Add files to preview list
  const addFiles = (files) => {
    const newItems = Array.from(files).map(file => ({
      id: Math.random().toString(36).slice(2),
      file,
      preview: URL.createObjectURL(file),
      mimeType: file.type,
      progress: 0,
      uploaded: null, // will hold { fileId, url, ... } after upload
    }));
    setMediaFiles(p => [...p, ...newItems]);
  };

  const removeMedia = (id) => {
    setMediaFiles(p => p.filter(m => m.id !== id));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    addFiles(e.dataTransfer.files);
  };

  // Upload all pending files to GridFS, return array of media objects
  const uploadAllMedia = async () => {
    const results = [];
    for (let i = 0; i < mediaFiles.length; i++) {
      const item = mediaFiles[i];
      if (item.uploaded) { results.push(item.uploaded); continue; }
      try {
        const res = await uploadService.upload(item.file, (pct) => {
          setMediaFiles(prev => prev.map(m =>
            m.id === item.id ? { ...m, progress: pct } : m
          ));
        });
        setMediaFiles(prev => prev.map(m =>
          m.id === item.id ? { ...m, uploaded: res, progress: 100 } : m
        ));
        results.push(res);
      } catch (err) {
        console.error("Upload failed for", item.file.name, err);
      }
    }
    return results;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    setLoading(true);
    try {
      // 1. Upload media first
      const uploadedMedia = await uploadAllMedia();

      // 2. Create post with media refs
      const data = await postService.create({
        ...form,
        clientId,
        media: uploadedMedia,
        budget: {
          min:      form.budget.min ? Number(form.budget.min) : undefined,
          max:      form.budget.max ? Number(form.budget.max) : undefined,
          currency: form.budget.currency,
        },
      });
      onCreated(data.post);
    } catch (err) {
      setError(err.response?.data?.message || "Erreur lors de la création");
    } finally {
      setLoading(false);
    }
  };

  const getDeadlineClass = (d) => {
    if (!d) return "";
    const days = Math.ceil((new Date(d) - new Date()) / 86400000);
    if (days <= 7) return "deadline-red";
    if (days <= 14) return "deadline-orange";
    if (days <= 30) return "deadline-yellow";
    return "deadline-green";
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div
        className="modal-box"
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1,    y: 0  }}
        exit={{    opacity: 0, scale: 0.96, y: 16 }}
        transition={{ duration: 0.25 }}
      >
        <div className="modal-header">
          <h2 className="modal-title">
            {step === 1 ? "📋 Nouveau post" : step === 2 ? "📎 Médias" : "🎯 Ciblage & Budget"}
          </h2>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ display: "flex", gap: 6 }}>
              {[1,2,3].map(s => (
                <div key={s} style={{
                  width: 22, height: 5, borderRadius: 3,
                  background: step >= s ? "#c0152a" : "#f0dede",
                  transition: "background 0.2s",
                }} />
              ))}
            </div>
            <button className="modal-close" onClick={onClose}>✕</button>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <AnimatePresence mode="wait">

              {/* STEP 1: Content */}
              {step === 1 && (
                <motion.div key="s1" initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-20 }} className="dash-form">
                  <div className="dash-form-group">
                    <label className="dash-form-label">Titre du post *</label>
                    <input className="dash-form-input"
                      placeholder="Ex: Gestion réseaux sociaux pour lancement produit"
                      value={form.title} onChange={e => set("title", e.target.value)} maxLength={200} />
                    <span className="dash-form-hint">{form.title.length}/200</span>
                  </div>
                  <div className="dash-form-group">
                    <label className="dash-form-label">Description *</label>
                    <textarea className="dash-form-textarea"
                      placeholder="Décrivez votre besoin en détail : objectifs, contexte, attentes..."
                      value={form.description} onChange={e => set("description", e.target.value)}
                      style={{ minHeight: 110 }} />
                  </div>
                  <div className="dash-form-row">
                    <div className="dash-form-group">
                      <label className="dash-form-label">Date limite *</label>
                      <input className={`dash-form-input ${getDeadlineClass(form.deadline)}`}
                        type="date" value={form.deadline}
                        min={new Date().toISOString().split("T")[0]}
                        onChange={e => set("deadline", e.target.value)} />
                    </div>
                    <div className="dash-form-group">
                      <label className="dash-form-label">Région</label>
                      <select className="dash-form-select" value={form.location.region}
                        onChange={e => setNested("location", "region", e.target.value)}>
                        <option value="">Toute l'Algérie</option>
                        {WILAYAT.map(w => <option key={w} value={w}>{w}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="dash-form-group">
                    <label className="dash-form-label">Catégories</label>
                    <div style={{ display:"flex", flexWrap:"wrap", gap:7, marginTop:4 }}>
                      {CATEGORIES.map(cat => (
                        <button key={cat} type="button" onClick={() => toggleCategory(cat)} style={{
                          padding:"5px 12px", borderRadius:20, fontSize:"0.76rem", fontWeight:600,
                          border:"1.5px solid", cursor:"pointer", fontFamily:"inherit", transition:"all 0.15s",
                          borderColor: form.categories.includes(cat) ? "#c0152a" : "#f0dede",
                          background:  form.categories.includes(cat) ? "#fff0f0" : "white",
                          color:       form.categories.includes(cat) ? "#c0152a" : "#9a6060",
                        }}>{cat}</button>
                      ))}
                    </div>
                  </div>
                  {error && <div className="dash-form-error">{error}</div>}
                  <button type="button" className="dash-form-submit" onClick={() => {
                    if (!form.title.trim() || !form.description.trim() || !form.deadline)
                      return setError("Titre, description et date limite requis");
                    setError(""); setStep(2);
                  }}>Suivant →</button>
                </motion.div>
              )}

              {/* STEP 2: Media Upload */}
              {step === 2 && (
                <motion.div key="s2" initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-20 }} className="dash-form">
                  <div className="dash-form-group">
                    <label className="dash-form-label">Photos & Vidéos <span style={{ fontWeight:400, color:"#9a6060" }}>(optionnel)</span></label>
                    <div
                      className={`media-upload-zone ${dragOver ? "drag-over" : ""}`}
                      onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                      onDragLeave={() => setDragOver(false)}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <div className="media-upload-icon">📎</div>
                      <div className="media-upload-label">Glissez vos fichiers ici ou cliquez pour parcourir</div>
                      <div className="media-upload-hint">Images (JPG, PNG, WEBP) ou vidéos (MP4, MOV) · Max 50MB par fichier</div>
                      <input ref={fileInputRef} type="file" multiple accept="image/*,video/*"
                        style={{ display:"none" }} onChange={e => addFiles(e.target.files)} />
                    </div>

                    {mediaFiles.length > 0 && (
                      <div className="media-preview-grid">
                        {mediaFiles.map(m => (
                          <div key={m.id} className="media-preview-item">
                            {m.mimeType.startsWith("video/")
                              ? <video src={m.preview} muted />
                              : <img src={m.preview} alt="" />
                            }
                            <button type="button" className="media-preview-remove"
                              onClick={() => removeMedia(m.id)}>✕</button>
                            {m.progress > 0 && m.progress < 100 && (
                              <div className="media-upload-progress">
                                <div className="media-upload-progress-bar" style={{ width:`${m.progress}%` }} />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div style={{ display:"flex", gap:10, marginTop:4 }}>
                    <button type="button" onClick={() => setStep(1)} style={{
                      flex:1, padding:12, border:"1.5px solid #f0dede", borderRadius:9,
                      background:"white", color:"#9a6060", fontSize:"0.9rem", fontWeight:600,
                      cursor:"pointer", fontFamily:"inherit",
                    }}>← Retour</button>
                    <button type="button" className="dash-form-submit" style={{ flex:2 }}
                      onClick={() => setStep(3)}>
                      Suivant →
                    </button>
                  </div>
                </motion.div>
              )}

              {/* STEP 3: Budget + Targeting */}
              {step === 3 && (
                <motion.div key="s3" initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-20 }} className="dash-form">
                  <div className="dash-form-group">
                    <label className="dash-form-label">Budget estimé (DZD)</label>
                    <div className="dash-form-row">
                      <input className="dash-form-input" type="number" placeholder="Minimum"
                        value={form.budget.min} onChange={e => setNested("budget","min",e.target.value)} min={0} />
                      <input className="dash-form-input" type="number" placeholder="Maximum"
                        value={form.budget.max} onChange={e => setNested("budget","max",e.target.value)} min={0} />
                    </div>
                    <span className="dash-form-hint">Laissez vide si non défini</span>
                  </div>

                  <div className="dash-form-group">
                    <label className="dash-form-label">Cibler des prestataires</label>
                    <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginTop:4 }}>
                      {[
                        { id:"all",        label:"Tous",        icon:"🌐" },
                        { id:"agency",     label:"Agences",     icon:"🏢" },
                        { id:"team",       label:"Équipes",     icon:"👥" },
                        { id:"freelancer", label:"Freelancers", icon:"⚡" },
                      ].map(p => (
                        <button key={p.id} type="button" onClick={() => toggleProvider(p.id)} style={{
                          display:"flex", alignItems:"center", gap:6, padding:"8px 14px",
                          borderRadius:9, fontSize:"0.82rem", fontWeight:600, border:"1.5px solid",
                          cursor:"pointer", fontFamily:"inherit", transition:"all 0.15s",
                          borderColor: form.targetProviders.includes(p.id) ? "#c0152a" : "#f0dede",
                          background:  form.targetProviders.includes(p.id) ? "#fff0f0" : "white",
                          color:       form.targetProviders.includes(p.id) ? "#c0152a" : "#9a6060",
                        }}>{p.icon} {p.label}</button>
                      ))}
                    </div>
                    <span className="dash-form-hint">Laissez "Tous" pour une visibilité maximale</span>
                  </div>

                  {error && <div className="dash-form-error">{error}</div>}

                  <div style={{ display:"flex", gap:10, marginTop:4 }}>
                    <button type="button" onClick={() => setStep(2)} style={{
                      flex:1, padding:12, border:"1.5px solid #f0dede", borderRadius:9,
                      background:"white", color:"#9a6060", fontSize:"0.9rem", fontWeight:600,
                      cursor:"pointer", fontFamily:"inherit",
                    }}>← Retour</button>
                    <button type="submit" className="dash-form-submit" disabled={loading} style={{ flex:2 }}>
                      {loading ? "Publication..." : "Publier le post 🚀"}
                    </button>
                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default CreatePostModal;