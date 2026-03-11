import React, { useState, useEffect, useRef } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import useAuth from "../../hooks/useAuth";
import notificationService from "../../services/notificationService";
import "../../styles/Dashboard.css";

const DashboardLayout = ({ role, user, navItems = [], children, topbarTitle }) => {
  const navigate   = useNavigate();
  const { logout } = useAuth();
  const [collapsed,    setCollapsed]    = useState(false);
  const [showNotifs,   setShowNotifs]   = useState(false);
  const [notifs,       setNotifs]       = useState([]);
  const [unreadCount,  setUnreadCount]  = useState(0);
  const notifRef = useRef();

  const ROLE_META = {
    client:       { icon: "🎯", label: "Client",          color: "#c0152a" },
    agency:       { icon: "🏢", label: "Agence",          color: "#7c3aed" },
    team:         { icon: "👥", label: "Équipe",          color: "#0891b2" },
    freelancer:   { icon: "⚡", label: "Freelancer",      color: "#d97706" },
    agency_member:{ icon: "👤", label: "Membre d'agence", color: "#7c3aed" },
    team_member:  { icon: "👤", label: "Membre d'équipe", color: "#0891b2" },
  };

  const meta = ROLE_META[role] || ROLE_META.client;

  const displayName =
    user?.companyName ||
    (user?.firstName ? `${user.firstName} ${user.lastName}` : null) ||
    user?.agencyName || user?.teamName || "Mon compte";

  const initials = displayName.split(" ").slice(0, 2)
    .map(w => w[0]?.toUpperCase()).join("");

  // ── Fetch notifications on mount + every 60s ──
  useEffect(() => {
    const fetchNotifs = async () => {
      try {
        const data = await notificationService.getAll({ limit: 10 });
        setNotifs(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      } catch {
        // Silently fail — notifications are non-critical
      }
    };
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 60000);
    return () => clearInterval(interval);
  }, []);

  // ── Close dropdown on outside click ──
  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifs(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleOpenNotifs = async () => {
    setShowNotifs(o => !o);
    if (!showNotifs && unreadCount > 0) {
      try {
        await notificationService.markAllRead();
        setUnreadCount(0);
        setNotifs(prev => prev.map(n => ({ ...n, isRead: true })));
      } catch {}
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const NOTIF_ICONS = {
    pitch_received:  "💡",
    pitch_accepted:  "✅",
    pitch_rejected:  "❌",
    post_published:  "📋",
    project_created: "🚀",
    system:          "📢",
  };

  return (
    <div className={`dash-layout ${collapsed ? "sidebar-collapsed" : "sidebar-open"}`}>

      {/* ── SIDEBAR ── */}
      <aside className="dash-sidebar">
        <div className="dash-sidebar-logo">
          <span className="dash-logo-text">
            {collapsed
              ? <span style={{ color: "#e0253f" }}>M</span>
              : <>Market<span>ili</span></>
            }
          </span>
          <button className="dash-sidebar-toggle"
            onClick={() => setCollapsed(o => !o)}
            title={collapsed ? "Agrandir" : "Réduire"}>
            {collapsed ? "→" : "←"}
          </button>
        </div>

        <div className="dash-role-tag" style={{ "--role-color": meta.color }}>
          <span>{meta.icon}</span>
          {!collapsed && <span>{meta.label}</span>}
        </div>

        <nav className="dash-nav">
          {navItems.map((item) => (
            <NavLink key={item.path} to={item.path}
              end={item.path.split("/").length === 3}
              className={({ isActive }) => `dash-nav-item${isActive ? " active" : ""}`}
              title={collapsed ? item.label : ""}>
              <span className="dash-nav-icon">{item.icon}</span>
              {!collapsed && <span className="dash-nav-label">{item.label}</span>}
              {!collapsed && item.badge > 0 && (
                <span className="dash-nav-badge">{item.badge}</span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="dash-sidebar-footer">
          <div className="dash-user-chip" style={{ "--role-color": meta.color }}>
            <div className="dash-user-avatar">{initials}</div>
            {!collapsed && (
              <div className="dash-user-info">
                <div className="dash-user-name">{displayName}</div>
                <div className="dash-user-role">{meta.label}</div>
              </div>
            )}
          </div>
          <button className="dash-logout-btn" onClick={handleLogout} title="Se déconnecter">
            <span className="dash-logout-icon">⏏</span>
            {!collapsed && <span>Déconnexion</span>}
          </button>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <div className="dash-main">
        <header className="dash-topbar">
          <div className="dash-topbar-left">
            <h1 className="dash-topbar-title">{topbarTitle}</h1>
          </div>
          <div className="dash-topbar-right">
            <div style={{ position: "relative" }} ref={notifRef}>
              <button className="dash-topbar-icon-btn" title="Notifications"
                onClick={handleOpenNotifs}>
                🔔
                {unreadCount > 0 && (
                  <span className="dash-notif-dot" style={{
                    width: unreadCount > 9 ? "auto" : 6,
                    height: unreadCount > 9 ? "auto" : 6,
                    padding: unreadCount > 9 ? "1px 4px" : 0,
                    fontSize: "0.6rem", fontWeight: 700,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    {unreadCount > 9 ? "9+" : ""}
                  </span>
                )}
              </button>

              {showNotifs && (
                <div className="dash-notif-dropdown">
                  <div className="dash-notif-header">
                    <span>Notifications</span>
                    {unreadCount === 0 && notifs.length > 0 && (
                      <span style={{ fontSize: "0.7rem", color: "var(--d-muted)", fontWeight: 400 }}>Tout lu</span>
                    )}
                  </div>
                  {notifs.length === 0 ? (
                    <div className="dash-notif-empty">
                      <span>🔔</span>
                      <p>Aucune notification pour le moment</p>
                    </div>
                  ) : (
                    <div>
                      {notifs.map(n => (
                        <div key={n._id} className={`dash-notif-item ${n.isRead ? "" : "unread"}`}
                          onClick={() => { if (n.link) navigate(n.link); setShowNotifs(false); }}>
                          <div className="dash-notif-item-icon">{NOTIF_ICONS[n.type] || "📢"}</div>
                          <div className="dash-notif-item-body">
                            <div className="dash-notif-item-title">{n.title}</div>
                            {n.body && <div className="dash-notif-item-desc">{n.body}</div>}
                            <div className="dash-notif-item-time">
                              {new Date(n.createdAt).toLocaleDateString("fr-DZ", { day:"numeric", month:"short", hour:"2-digit", minute:"2-digit" })}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="dash-content">
          <AnimatePresence mode="wait">
            <motion.div key={topbarTitle}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}>
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;