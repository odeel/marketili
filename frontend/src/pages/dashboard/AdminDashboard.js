import React, { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import DashboardLayout from "../../components/layout/DashboardLayout";
import useAuth         from "../../hooks/useAuth";
import adminService    from "../../services/adminService";
import adService       from "../../services/adService";
import {
  IconUsers, IconUser, IconBriefcase, IconSend,
  IconFlag, IconTarget, IconSearch,
} from "../../components/ui/Icons";
import "../../styles/Dashboard.css";

// ── Tabs ──────────────────────────────────────────────────────────────────────
const TABS = [
  { id: "users",    label: "Utilisateurs"  },
  { id: "stats",    label: "Statistiques"  },
  { id: "posts",    label: "Posts"         },
  { id: "activity", label: "Activité"      },
  { id: "ads",      label: "Publicités"    },
  { id: "log",      label: "Journal"       },
  { id: "options",  label: "Options"       },
];

const ROLE_LABELS = {
  client: "Client", agency: "Agence", agency_member: "Membre agence",
  team: "Équipe", team_member: "Membre équipe", freelancer: "Freelancer",
};
const ROLE_COLORS = {
  client: "#0891b2", agency: "#7c3aed", agency_member: "#6d28d9",
  team: "#059669", team_member: "#047857", freelancer: "#d97706",
};

const fmt = (d) => d
  ? new Date(d).toLocaleDateString("fr-DZ", { day: "2-digit", month: "short", year: "numeric" })
  : "—";

const relTime = (d) => {
  if (!d) return "";
  const diff = Date.now() - new Date(d);
  const m = Math.floor(diff / 60000);
  if (m < 60) return `il y a ${m}min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `il y a ${h}h`;
  return `il y a ${Math.floor(h / 24)}j`;
};

// ── Stat card ─────────────────────────────────────────────────────────────────
const StatCard = ({ label, value, sub, color }) => (
  <motion.div
    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
    style={{ padding: "20px 22px", borderRadius: 14, background: "#fff",
      border: "1px solid #eee", boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
      flex: 1, minWidth: 140 }}>
    <div style={{ fontWeight: 800, fontSize: "2rem", color, lineHeight: 1 }}>{value ?? "—"}</div>
    <div style={{ fontWeight: 600, fontSize: "0.82rem", color: "#1a0a2e", marginTop: 6 }}>{label}</div>
    {sub && <div style={{ fontSize: "0.72rem", color: "#888", marginTop: 2 }}>{sub}</div>}
  </motion.div>
);

// ── Users panel ───────────────────────────────────────────────────────────────
const UsersPanel = () => {
  const [users,   setUsers]   = useState([]);
  const [role,    setRole]    = useState("");
  const [search,  setSearch]  = useState("");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminService.getUsers({ role, search });
      const list = res.data?.users || res.data || [];
      setUsers(Array.isArray(list) ? list : []);
    } catch (err) {
      setError(err.response?.data?.message || "Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  }, [role, search]);

  useEffect(() => { fetchUsers(); }, [role]);

  const handleToggle = async (u) => {
    try {
      await adminService.toggleUser(u._roleLabel || u.role, u._id);
      fetchUsers();
    } catch {}
  };

  return (
    <div>
      <div className="section-header">
        <div className="section-header-left">
          <h2>Utilisateurs</h2>
          <p style={{ color: "var(--d-muted)" }}>{users.length} comptes trouvés</p>
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
        <select className="dash-form-input" value={role}
          onChange={e => setRole(e.target.value)} style={{ flex: "0 0 180px" }}>
          <option value="">Tous les rôles</option>
          {Object.entries(ROLE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <div style={{ display: "flex", gap: 10, flex: 1 }}>
          <input className="dash-form-input" placeholder="Rechercher..."
            value={search} onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === "Enter" && fetchUsers()}
            style={{ flex: 1 }} />
          <button className="section-cta-btn" onClick={fetchUsers}>Rechercher</button>
        </div>
      </div>

      {error && (
        <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8,
          padding: "12px 16px", marginBottom: 16, color: "#b91c1c", fontSize: "0.84rem" }}>
          {error}
        </div>
      )}

      <div className="card">
        {loading ? (
          <div className="spinner-wrap"><div className="spinner" /></div>
        ) : users.length === 0 ? (
          <div className="empty-state" style={{ padding: "64px 24px" }}>
            <div className="empty-state-icon"><IconUser size={20} /></div>
            <div className="empty-state-title">Aucun utilisateur trouvé</div>
          </div>
        ) : (
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>Nom</th><th>Email</th><th>Rôle</th><th>Statut</th><th>Action</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u, i) => (
                <tr key={u._id || i}>
                  <td style={{ fontWeight: 600, fontSize: "0.85rem" }}>
                    {u.firstName || u.agencyName || u.teamName || "—"}
                    {u.lastName ? ` ${u.lastName}` : ""}
                  </td>
                  <td style={{ fontSize: "0.82rem", color: "var(--d-muted)" }}>{u.email}</td>
                  <td>
                    <span style={{ padding: "2px 9px", borderRadius: 20, fontSize: "0.7rem",
                      fontWeight: 600, background: (ROLE_COLORS[u._roleLabel] || "#888") + "18",
                      color: ROLE_COLORS[u._roleLabel] || "#888" }}>
                      {ROLE_LABELS[u._roleLabel] || u._roleLabel}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: "0.75rem", fontWeight: 600,
                      color: u.isActive !== false ? "#059669" : "#ef4444" }}>
                      {u.isActive !== false ? "Actif" : "Inactif"}
                    </span>
                  </td>
                  <td>
                    <button onClick={() => handleToggle(u)}
                      style={{ padding: "5px 12px", borderRadius: 8, fontSize: "0.75rem",
                        fontWeight: 600, cursor: "pointer", border: "none", fontFamily: "inherit",
                        background: u.isActive !== false ? "#fee2e2" : "#d1fae5",
                        color: u.isActive !== false ? "#b91c1c" : "#065f46" }}>
                      {u.isActive !== false ? "Désactiver" : "Activer"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

// ── Stats panel ───────────────────────────────────────────────────────────────
const StatsPanel = () => {
  const [stats,   setStats]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminService.getStats()
      .then(d => setStats(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="spinner-wrap"><div className="spinner" /></div>;
  if (!stats)  return <div style={{ color: "var(--d-muted)" }}>Erreur de chargement</div>;

  return (
    <div>
      <div className="section-header">
        <div className="section-header-left">
          <h2>Statistiques</h2>
          <p style={{ color: "var(--d-muted)" }}>Vue d'ensemble de la plateforme</p>
        </div>
      </div>

      {/* Users */}
      <div style={{ marginBottom: 8, fontWeight: 700, fontSize: "0.8rem",
        color: "var(--d-muted)", letterSpacing: "0.04em", textTransform: "uppercase" }}>
        Utilisateurs
      </div>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 28 }}>
        <StatCard label="Total utilisateurs" value={stats.users.total} color="#1a0a2e"
          sub={`${stats.activity.newClientsThisMonth} nouveaux ce mois`} />
        <StatCard label="Clients" value={stats.users.client} color="#0891b2" />
        <StatCard label="Agences" value={stats.users.agency} color="#7c3aed" />
        <StatCard label="Équipes" value={stats.users.team} color="#059669" />
        <StatCard label="Freelancers" value={stats.users.freelancer} color="#d97706" />
      </div>

      {/* Posts */}
      <div style={{ marginBottom: 8, fontWeight: 700, fontSize: "0.8rem",
        color: "var(--d-muted)", letterSpacing: "0.04em", textTransform: "uppercase" }}>
        Posts
      </div>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 28 }}>
        <StatCard label="Total posts" value={stats.posts.total} color="#1a0a2e"
          sub={`${stats.activity.postsThisMonth} ce mois`} />
        <StatCard label="Ouverts" value={stats.posts.open} color="#059669" />
        <StatCard label="En cours" value={stats.posts.inProgress} color="#f59e0b" />
        <StatCard label="Fermés" value={stats.posts.closed} color="#6b7280" />
      </div>

      {/* Pitches */}
      <div style={{ marginBottom: 8, fontWeight: 700, fontSize: "0.8rem",
        color: "var(--d-muted)", letterSpacing: "0.04em", textTransform: "uppercase" }}>
        Offres
      </div>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 28 }}>
        <StatCard label="Total offres" value={stats.pitches.total} color="#1a0a2e" />
        <StatCard label="En attente" value={stats.pitches.pending} color="#f59e0b" />
        <StatCard label="Acceptées" value={stats.pitches.accepted} color="#059669" />
        <StatCard label="Rejetées" value={stats.pitches.rejected} color="#ef4444" />
      </div>

      {/* Projects */}
      <div style={{ marginBottom: 8, fontWeight: 700, fontSize: "0.8rem",
        color: "var(--d-muted)", letterSpacing: "0.04em", textTransform: "uppercase" }}>
        Projets
      </div>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <StatCard label="Total projets" value={stats.projects.total} color="#1a0a2e" />
        <StatCard label="Actifs" value={stats.projects.active} color="#0891b2" />
        <StatCard label="Terminés" value={stats.projects.completed} color="#059669" />
        <StatCard label="Annulés" value={stats.projects.cancelled} color="#6b7280" />
      </div>
    </div>
  );
};

// ── Posts moderation panel ────────────────────────────────────────────────────
const PostsPanel = () => {
  const [posts,    setPosts]    = useState([]);
  const [total,    setTotal]    = useState(0);
  const [pages,    setPages]    = useState(1);
  const [page,     setPage]     = useState(1);
  const [status,   setStatus]   = useState("all");
  const [search,   setSearch]   = useState("");
  const [loading,  setLoading]  = useState(true);
  const [removing, setRemoving] = useState(null);
  const [modal,    setModal]    = useState(null);
  const [reason,   setReason]   = useState("");

  const load = useCallback(() => {
    setLoading(true);
    adminService.getPosts({ status: status !== "all" ? status : undefined, search: search || undefined, page, limit: 15 })
      .then(d => { setPosts(d.posts || []); setTotal(d.total || 0); setPages(d.pages || 1); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [status, search, page]);

  useEffect(() => { load(); }, [load]);

  const handleRemove = async () => {
    if (!modal) return;
    setRemoving(modal._id);
    try {
      await adminService.removePost(modal._id, reason);
      setPosts(prev => prev.map(p => p._id === modal._id ? { ...p, status: "closed" } : p));
      setModal(null);
      setReason("");
    } catch {}
    setRemoving(null);
  };

  const STATUS_COLOR = { open: "#059669", in_progress: "#f59e0b", closed: "#6b7280", reactivated: "#0891b2" };
  const STATUS_LABEL = { open: "Ouvert", in_progress: "En cours", closed: "Fermé", reactivated: "Réactivé" };

  return (
    <div>
      <div className="section-header">
        <div className="section-header-left">
          <h2>Modération des posts</h2>
          <p style={{ color: "var(--d-muted)" }}>{total} post{total !== 1 ? "s" : ""}</p>
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
        <select className="dash-form-input" value={status}
          onChange={e => { setStatus(e.target.value); setPage(1); }} style={{ flex: "0 0 160px" }}>
          <option value="all">Tous les statuts</option>
          <option value="open">Ouverts</option>
          <option value="in_progress">En cours</option>
          <option value="closed">Fermés</option>
        </select>
        <input className="dash-form-input" placeholder="Rechercher un titre..."
          value={search} onChange={e => setSearch(e.target.value)}
          onKeyDown={e => e.key === "Enter" && load()}
          style={{ flex: 1 }} />
        <button className="section-cta-btn" onClick={load}>Rechercher</button>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div className="spinner-wrap"><div className="spinner" /></div>
        ) : posts.length === 0 ? (
          <div className="empty-state" style={{ padding: "48px 24px" }}>
            <div className="empty-state-title">Aucun post trouvé</div>
          </div>
        ) : (
          <>
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Titre</th><th>Client</th><th>Statut</th>
                  <th>Offres</th><th>Date</th><th>Action</th>
                </tr>
              </thead>
              <tbody>
                {posts.map((p, i) => {
                  const clientName = p.client
                    ? (p.client.accountType === "company"
                        ? p.client.companyName
                        : `${p.client.firstName} ${p.client.lastName}`)
                    : "Inconnu";
                  return (
                    <motion.tr key={p._id}
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.03 }}>
                      <td style={{ fontWeight: 600, fontSize: "0.85rem", maxWidth: 220 }}>
                        <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {p.title}
                        </div>
                        {p.adminNote && (
                          <div style={{ fontSize: "0.68rem", color: "#ef4444", marginTop: 2 }}>
                            Note admin : {p.adminNote}
                          </div>
                        )}
                      </td>
                      <td style={{ fontSize: "0.82rem", color: "var(--d-muted)" }}>{clientName}</td>
                      <td>
                        <span style={{ padding: "2px 9px", borderRadius: 20, fontSize: "0.7rem",
                          fontWeight: 600, background: (STATUS_COLOR[p.status] || "#888") + "18",
                          color: STATUS_COLOR[p.status] || "#888" }}>
                          {STATUS_LABEL[p.status] || p.status}
                        </span>
                      </td>
                      <td style={{ fontSize: "0.82rem", textAlign: "center" }}>{p.pitchCount || 0}</td>
                      <td style={{ fontSize: "0.78rem", color: "var(--d-muted)" }}>{fmt(p.createdAt)}</td>
                      <td>
                        {p.status !== "closed" && (
                          <button onClick={() => { setModal(p); setReason(""); }}
                            style={{ padding: "5px 12px", borderRadius: 8, fontSize: "0.72rem",
                              fontWeight: 600, cursor: "pointer", border: "none",
                              background: "#fee2e2", color: "#b91c1c", fontFamily: "inherit" }}>
                            Retirer
                          </button>
                        )}
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>

            {pages > 1 && (
              <div style={{ display: "flex", justifyContent: "center", gap: 8,
                padding: "16px 20px", borderTop: "1px solid var(--d-border-soft)" }}>
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  style={{ padding: "5px 12px", borderRadius: 8, fontSize: "0.78rem",
                    border: "1px solid #ddd", background: "none", cursor: "pointer",
                    opacity: page === 1 ? 0.4 : 1 }}>
                  Précédent
                </button>
                <span style={{ padding: "5px 12px", fontSize: "0.78rem", color: "var(--d-muted)" }}>
                  {page} / {pages}
                </span>
                <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages}
                  style={{ padding: "5px 12px", borderRadius: 8, fontSize: "0.78rem",
                    border: "1px solid #ddd", background: "none", cursor: "pointer",
                    opacity: page === pages ? 0.4 : 1 }}>
                  Suivant
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Remove modal */}
      <AnimatePresence>
        {modal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
              display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}
            onClick={e => e.target === e.currentTarget && setModal(null)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96 }}
              style={{ background: "#fff", borderRadius: 16, padding: "28px 32px",
                width: "100%", maxWidth: 440, boxShadow: "0 24px 64px rgba(0,0,0,0.18)" }}>
              <div style={{ fontWeight: 700, fontSize: "1.05rem", marginBottom: 8 }}>
                Retirer ce post
              </div>
              <div style={{ fontSize: "0.85rem", color: "var(--d-muted)", marginBottom: 18 }}>
                "{modal.title}"
              </div>
              <label className="dash-form-label">Raison (optionnel)</label>
              <textarea
                className="dash-form-input"
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder="Raison du retrait..."
                rows={3}
                style={{ resize: "vertical", fontFamily: "inherit" }}
              />
              <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
                <button onClick={handleRemove} disabled={removing === modal._id}
                  style={{ flex: 1, padding: "10px", borderRadius: 10, border: "none",
                    background: "#ef4444", color: "#fff", fontWeight: 700,
                    cursor: "pointer", fontFamily: "inherit", fontSize: "0.88rem",
                    opacity: removing === modal._id ? 0.6 : 1 }}>
                  {removing === modal._id ? "Retrait en cours..." : "Confirmer le retrait"}
                </button>
                <button onClick={() => setModal(null)}
                  style={{ padding: "10px 18px", borderRadius: 10, fontFamily: "inherit",
                    border: "1.5px solid var(--d-border-soft)", background: "none",
                    cursor: "pointer", fontSize: "0.88rem" }}>
                  Annuler
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ── Activity panel ────────────────────────────────────────────────────────────
const ActivityPanel = () => {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminService.getActivity()
      .then(d => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="spinner-wrap"><div className="spinner" /></div>;
  if (!data)   return <div style={{ color: "var(--d-muted)" }}>Erreur de chargement</div>;

  const PITCH_TYPE_LABEL = {
    agency_to_client: "Agence → Client",
    team_to_client: "Équipe → Client",
    freelancer_to_client: "Freelancer → Client",
    agency_to_freelancer: "Agence → Freelancer",
  };
  const STATUS_COLOR = { open: "#059669", in_progress: "#f59e0b", closed: "#6b7280", pending: "#f59e0b", accepted: "#059669", rejected: "#ef4444" };

  return (
    <div>
      <div className="section-header">
        <div className="section-header-left">
          <h2>Activité récente</h2>
          <p style={{ color: "var(--d-muted)" }}>Inscriptions, posts et offres</p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>

        {/* Registrations */}
        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: "14px 20px 12px", borderBottom: "1px solid var(--d-border-soft)",
            fontWeight: 700, fontSize: "0.9rem" }}>
            Inscriptions récentes
          </div>
          {(data.registrations || []).length === 0 ? (
            <div style={{ padding: "24px", textAlign: "center", color: "var(--d-muted)", fontSize: "0.82rem" }}>
              Aucune inscription récente
            </div>
          ) : data.registrations.map((r, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              style={{ padding: "10px 20px", borderBottom: "1px solid var(--d-border-soft)",
                display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 30, height: 30, borderRadius: "50%", flexShrink: 0,
                background: (ROLE_COLORS[r.type] || "#888") + "22",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: ROLE_COLORS[r.type] || "#888", fontSize: "0.62rem", fontWeight: 700 }}>
                {r.name?.[0]?.toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: "0.83rem",
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {r.name}
                </div>
                <div style={{ fontSize: "0.7rem", color: "var(--d-muted)" }}>{r.email}</div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 2 }}>
                <span style={{ padding: "1px 8px", borderRadius: 10, fontSize: "0.66rem",
                  fontWeight: 600, background: (ROLE_COLORS[r.type] || "#888") + "18",
                  color: ROLE_COLORS[r.type] || "#888" }}>
                  {ROLE_LABELS[r.type] || r.type}
                </span>
                <span style={{ fontSize: "0.66rem", color: "var(--d-muted)" }}>
                  {relTime(r.createdAt)}
                </span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Recent posts */}
        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: "14px 20px 12px", borderBottom: "1px solid var(--d-border-soft)",
            fontWeight: 700, fontSize: "0.9rem" }}>
            Posts récents
          </div>
          {(data.posts || []).length === 0 ? (
            <div style={{ padding: "24px", textAlign: "center", color: "var(--d-muted)", fontSize: "0.82rem" }}>
              Aucun post récent
            </div>
          ) : data.posts.map((p, i) => (
            <motion.div key={p._id}
              initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              style={{ padding: "10px 20px", borderBottom: "1px solid var(--d-border-soft)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ fontWeight: 600, fontSize: "0.83rem", flex: 1,
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", paddingRight: 8 }}>
                  {p.title}
                </div>
                <span style={{ fontSize: "0.66rem", fontWeight: 700,
                  color: STATUS_COLOR[p.status] || "#888" }}>
                  {p.status}
                </span>
              </div>
              <div style={{ fontSize: "0.7rem", color: "var(--d-muted)", marginTop: 2 }}>
                {relTime(p.createdAt)}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Recent pitches */}
        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: "14px 20px 12px", borderBottom: "1px solid var(--d-border-soft)",
            fontWeight: 700, fontSize: "0.9rem" }}>
            Offres récentes
          </div>
          {(data.pitches || []).length === 0 ? (
            <div style={{ padding: "24px", textAlign: "center", color: "var(--d-muted)", fontSize: "0.82rem" }}>
              Aucune offre récente
            </div>
          ) : data.pitches.map((p, i) => (
            <motion.div key={p._id}
              initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              style={{ padding: "10px 20px", borderBottom: "1px solid var(--d-border-soft)" }}>
              <div style={{ fontWeight: 600, fontSize: "0.83rem", marginBottom: 2 }}>
                {p.post?.title || "Post supprimé"}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between",
                fontSize: "0.7rem", color: "var(--d-muted)" }}>
                <span>{PITCH_TYPE_LABEL[p.pitchType] || p.pitchType}</span>
                <span style={{ color: STATUS_COLOR[p.status] || "#888", fontWeight: 600 }}>
                  {p.status}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ── Options panel ─────────────────────────────────────────────────────────────
const OPTIONS_KEYS = [
  { key: "specialties",  label: "Spécialités" },
  { key: "regions",      label: "Régions"     },
  { key: "categories",   label: "Catégories"  },
];

const OptionGroup = ({ keyName, label }) => {
  const [values,  setValues]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [input,   setInput]   = useState("");
  const [saving,  setSaving]  = useState(false);
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    adminService.getOptions(keyName)
      .then(d => setValues(d.values || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [keyName]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    setSaving(true);
    try {
      const d = await adminService.addOptionValue(keyName, input.trim());
      setValues(d.values || []);
      setInput("");
    } catch {}
    setSaving(false);
  };

  const handleDelete = async (val) => {
    setDeleting(val);
    try {
      const d = await adminService.deleteOptionValue(keyName, val);
      setValues(d.values || []);
    } catch {}
    setDeleting(null);
  };

  return (
    <div className="card" style={{ padding: "20px 24px", marginBottom: 16 }}>
      <div style={{ fontWeight: 700, fontSize: "0.95rem", marginBottom: 16 }}>{label}</div>

      <form onSubmit={handleAdd} style={{ display: "flex", gap: 10, marginBottom: 16 }}>
        <input className="dash-form-input" value={input} onChange={e => setInput(e.target.value)}
          placeholder={`Ajouter une ${label.toLowerCase().slice(0, -1)}...`}
          style={{ flex: 1 }} />
        <button type="submit" className="section-cta-btn" disabled={saving || !input.trim()}>
          {saving ? "..." : "Ajouter"}
        </button>
      </form>

      {loading ? (
        <div style={{ color: "var(--d-muted)", fontSize: "0.82rem" }}>Chargement...</div>
      ) : values.length === 0 ? (
        <div style={{ color: "var(--d-muted)", fontSize: "0.82rem" }}>Aucune valeur</div>
      ) : (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {values.map(v => (
            <motion.div key={v}
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              style={{ display: "flex", alignItems: "center", gap: 6,
                padding: "5px 10px 5px 12px", borderRadius: 20,
                background: "#f3f4f6", border: "1px solid var(--d-border-soft)" }}>
              <span style={{ fontSize: "0.8rem", fontWeight: 500 }}>{v}</span>
              <button onClick={() => handleDelete(v)} disabled={deleting === v}
                style={{ width: 16, height: 16, borderRadius: "50%", border: "none",
                  background: "none", cursor: "pointer", color: "#9b2c2c",
                  fontSize: "0.9rem", lineHeight: 1, padding: 0, display: "flex",
                  alignItems: "center", justifyContent: "center",
                  opacity: deleting === v ? 0.4 : 0.6 }}>
                ×
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

const OptionsPanel = () => (
  <div>
    <div className="section-header">
      <div className="section-header-left">
        <h2>Options dynamiques</h2>
        <p style={{ color: "var(--d-muted)" }}>
          Gérez les listes déroulantes utilisées dans les formulaires
        </p>
      </div>
    </div>
    {OPTIONS_KEYS.map(o => (
      <OptionGroup key={o.key} keyName={o.key} label={o.label} />
    ))}
  </div>
);

// ═════════════════════════════════════════════════════════════════════════════
// ADS PANEL
// ═════════════════════════════════════════════════════════════════════════════
const TARGET_ROLES = ["all","client","agency","agency_member","team","team_member","freelancer"];
const PLACEMENTS   = ["banner","sidebar","card"];

const AdsPanel = () => {
  const [ads,       setAds]       = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [showForm,  setShowForm]  = useState(false);
  const [form,      setForm]      = useState({ title: "", imageUrl: "", linkUrl: "", placement: "banner", targetRoles: ["all"], isActive: true });
  const [saving,    setSaving]    = useState(false);

  const load = useCallback(() => {
    adService.getAdminAds()
      .then(d => setAds(d.ads || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await adService.createAd(form);
      setShowForm(false);
      setForm({ title: "", imageUrl: "", linkUrl: "", placement: "banner", targetRoles: ["all"], isActive: true });
      load();
    } catch {}
    setSaving(false);
  };

  const toggleRole = (r) => {
    setForm(prev => ({
      ...prev,
      targetRoles: prev.targetRoles.includes(r)
        ? prev.targetRoles.filter(x => x !== r)
        : [...prev.targetRoles, r],
    }));
  };

  if (loading) return <div className="spinner-wrap"><div className="spinner" /></div>;

  return (
    <div>
      <div className="section-header">
        <div className="section-header-left">
          <h2>Publicités</h2>
          <p style={{ color: "var(--d-muted)" }}>{ads.length} publicité{ads.length !== 1 ? "s" : ""} au total</p>
        </div>
        <button className="section-cta-btn" onClick={() => setShowForm(s => !s)}>
          {showForm ? "Annuler" : "+ Nouvelle publicité"}
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ padding: "20px 22px", marginBottom: 20 }}>
          <form onSubmit={handleCreate}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
              <div>
                <label className="dash-form-label">Titre *</label>
                <input className="dash-form-input" required value={form.title}
                  onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
              </div>
              <div>
                <label className="dash-form-label">URL image</label>
                <input className="dash-form-input" placeholder="https://..." value={form.imageUrl}
                  onChange={e => setForm(p => ({ ...p, imageUrl: e.target.value }))} />
              </div>
              <div>
                <label className="dash-form-label">URL lien (clic)</label>
                <input className="dash-form-input" placeholder="https://..." value={form.linkUrl}
                  onChange={e => setForm(p => ({ ...p, linkUrl: e.target.value }))} />
              </div>
              <div>
                <label className="dash-form-label">Emplacement</label>
                <select className="dash-form-input" value={form.placement}
                  onChange={e => setForm(p => ({ ...p, placement: e.target.value }))}>
                  {PLACEMENTS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            </div>
            <div style={{ marginBottom: 12 }}>
              <label className="dash-form-label">Rôles ciblés</label>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 4 }}>
                {TARGET_ROLES.map(r => (
                  <label key={r} style={{ display: "flex", alignItems: "center", gap: 4,
                    fontSize: "0.78rem", cursor: "pointer" }}>
                    <input type="checkbox" checked={form.targetRoles.includes(r)}
                      onChange={() => toggleRole(r)} />
                    {r}
                  </label>
                ))}
              </div>
            </div>
            <button type="submit" className="section-cta-btn" disabled={saving}>
              {saving ? "Création..." : "Créer la publicité"}
            </button>
          </form>
        </div>
      )}

      {ads.length === 0 ? (
        <div className="card" style={{ padding: "48px 24px", textAlign: "center",
          color: "var(--d-muted)", fontSize: "0.82rem" }}>
          Aucune publicité créée
        </div>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {ads.map(ad => (
            <div key={ad._id} className="card" style={{ padding: "16px 20px",
              display: "flex", alignItems: "center", gap: 16,
              opacity: ad.isActive ? 1 : 0.55 }}>
              {ad.imageUrl && (
                <img src={ad.imageUrl} alt={ad.title}
                  style={{ height: 44, width: 80, objectFit: "cover", borderRadius: 6 }} />
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: "0.9rem" }}>{ad.title}</div>
                <div style={{ fontSize: "0.72rem", color: "var(--d-muted)", marginTop: 2 }}>
                  {ad.placement} · {(ad.targetRoles || []).join(", ")}
                  {ad.linkUrl && ` · ${ad.linkUrl}`}
                </div>
              </div>
              <span style={{ fontSize: "0.68rem", fontWeight: 700, padding: "3px 10px",
                borderRadius: 20,
                background: ad.isActive ? "#d1fae5" : "#f3f4f6",
                color: ad.isActive ? "#065f46" : "#6b7280" }}>
                {ad.isActive ? "Actif" : "Inactif"}
              </span>
              <button onClick={async () => { await adService.toggleAd(ad._id); load(); }}
                style={{ padding: "4px 12px", borderRadius: 6, fontSize: "0.72rem",
                  fontWeight: 700, cursor: "pointer", border: "1.5px solid #ddd",
                  background: "transparent", fontFamily: "inherit" }}>
                {ad.isActive ? "Désactiver" : "Activer"}
              </button>
              <button onClick={async () => { await adService.deleteAd(ad._id); load(); }}
                style={{ padding: "4px 12px", borderRadius: 6, fontSize: "0.72rem",
                  fontWeight: 700, cursor: "pointer", border: "1.5px solid #fca5a5",
                  color: "#ef4444", background: "transparent", fontFamily: "inherit" }}>
                Supprimer
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
// ACTIVITY LOG PANEL
// ═════════════════════════════════════════════════════════════════════════════
const ACTION_TYPES = [
  "user_registered","user_disabled","user_enabled",
  "post_created","post_closed",
  "pitch_sent","pitch_accepted",
  "project_created","project_completed",
  "contract_signed","ad_created","member_created","account_restored",
];
const ACTION_ICONS = {
  user_registered: "👤", user_disabled: "🚫", user_enabled: "✅",
  post_created: "📝", post_closed: "🔒",
  pitch_sent: "📨", pitch_accepted: "🤝",
  project_created: "📁", project_completed: "🏁",
  contract_signed: "📃", ad_created: "📢",
  member_created: "👥", account_restored: "🔓",
};

const ActivityLogPanel = () => {
  const [logs,    setLogs]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [page,    setPage]    = useState(1);
  const [total,   setTotal]   = useState(0);
  const [filter,  setFilter]  = useState("");
  const LIMIT = 30;

  const load = useCallback((p = 1, f = filter) => {
    setLoading(true);
    const params = { page: p, limit: LIMIT };
    if (f) params.actionType = f;
    adService.getActivityLog(params)
      .then(d => { setLogs(d.logs || []); setTotal(d.total || 0); setPage(p); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [filter]); // eslint-disable-line

  useEffect(() => { load(1, filter); }, [filter]); // eslint-disable-line

  const fmtDate = (d) => d
    ? new Date(d).toLocaleString("fr-DZ", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
    : "";

  return (
    <div>
      <div className="section-header">
        <div className="section-header-left">
          <h2>Journal d'activité</h2>
          <p style={{ color: "var(--d-muted)" }}>{total} événement{total !== 1 ? "s" : ""}</p>
        </div>
        <select className="dash-form-input" value={filter}
          onChange={e => setFilter(e.target.value)}
          style={{ width: "auto", padding: "6px 12px", fontSize: "0.78rem" }}>
          <option value="">Tous les types</option>
          {ACTION_TYPES.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
      </div>

      {loading ? <div className="spinner-wrap"><div className="spinner" /></div> : (
        <>
          <div className="card" style={{ padding: 0 }}>
            {logs.length === 0 ? (
              <div style={{ padding: "48px 24px", textAlign: "center", color: "var(--d-muted)", fontSize: "0.82rem" }}>
                Aucune activité enregistrée
              </div>
            ) : logs.map((log, i) => (
              <div key={log._id || i} style={{
                padding: "12px 20px", borderBottom: "1px solid var(--d-border-soft)",
                display: "flex", alignItems: "flex-start", gap: 12 }}>
                <span style={{ fontSize: "1.1rem", flexShrink: 0, marginTop: 1 }}>
                  {ACTION_ICONS[log.actionType] || "📌"}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--d-ink)" }}>
                    {log.description}
                  </div>
                  <div style={{ fontSize: "0.7rem", color: "var(--d-muted)", marginTop: 2 }}>
                    {log.actorName && <span>{log.actorName} · </span>}
                    <span style={{ fontStyle: "italic" }}>{log.actionType}</span>
                  </div>
                </div>
                <div style={{ fontSize: "0.68rem", color: "var(--d-muted)", whiteSpace: "nowrap", flexShrink: 0 }}>
                  {fmtDate(log.createdAt)}
                </div>
              </div>
            ))}
          </div>

          {total > LIMIT && (
            <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 16 }}>
              <button disabled={page <= 1} onClick={() => load(page - 1)}
                className="section-cta-btn"
                style={{ background: "transparent", border: "1.5px solid #ddd", color: "var(--d-muted)" }}>
                ← Précédent
              </button>
              <span style={{ padding: "9px 16px", fontSize: "0.82rem", color: "var(--d-muted)" }}>
                {page} / {Math.ceil(total / LIMIT)}
              </span>
              <button disabled={page >= Math.ceil(total / LIMIT)} onClick={() => load(page + 1)}
                className="section-cta-btn"
                style={{ background: "transparent", border: "1.5px solid #ddd", color: "var(--d-muted)" }}>
                Suivant →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
// ROOT
// ═════════════════════════════════════════════════════════════════════════════
const AdminDashboard = () => {
  const { user, role, loading, isAuthenticated } = useAuth();
  const [tab, setTab] = useState("users");

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center",
        height: "100vh", background: "#0d0d0d", flexDirection: "column", gap: 12 }}>
        <div style={{ width: 36, height: 36, border: "3px solid #2a0a0a",
          borderTopColor: "#c0152a", borderRadius: "50%",
          animation: "spin 0.7s linear infinite" }} />
        <p style={{ color: "#9a6060", fontSize: "0.85rem" }}>Chargement...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!isAuthenticated || role !== "admin") {
    window.location.href = "/login";
    return null;
  }

  const NAV = [
    { label: "Utilisateurs",  icon: <IconUsers    size={16} />, path: "#" },
    { label: "Statistiques",  icon: <IconTarget   size={16} />, path: "#" },
    { label: "Posts",         icon: <IconFlag     size={16} />, path: "#" },
    { label: "Activité",      icon: <IconBriefcase size={16} />, path: "#" },
    { label: "Options",       icon: <IconSearch   size={16} />, path: "#" },
  ];

  const PANEL_MAP = {
    users:    <UsersPanel />,
    stats:    <StatsPanel />,
    posts:    <PostsPanel />,
    activity: <ActivityPanel />,
    ads:      <AdsPanel />,
    log:      <ActivityLogPanel />,
    options:  <OptionsPanel />,
  };

  return (
    <DashboardLayout role="admin" user={user} navItems={[]} topbarTitle="Administration">
      <div>
        {/* Tab bar */}
        <div style={{ display: "flex", gap: 4, marginBottom: 24,
          borderBottom: "2px solid var(--d-border-soft)", paddingBottom: 0 }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{
                padding: "9px 20px", borderRadius: "8px 8px 0 0", fontSize: "0.84rem",
                fontWeight: 700, cursor: "pointer", border: "none", fontFamily: "inherit",
                background: tab === t.id ? "#c0152a" : "none",
                color: tab === t.id ? "#fff" : "var(--d-muted)",
                borderBottom: tab === t.id ? "2px solid #c0152a" : "2px solid transparent",
                transition: "background 0.15s, color 0.15s",
                marginBottom: -2,
              }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Panel */}
        <AnimatePresence mode="wait">
          <motion.div key={tab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18 }}>
            {PANEL_MAP[tab]}
          </motion.div>
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
