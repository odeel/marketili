import React, { useState, useEffect, useRef } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import useAuth from "../../hooks/useAuth";
import notificationService from "../../services/notificationService";
import {
  IconBell, IconLogOut, IconChevronLeft, IconChevronRight,
  IconTarget, IconBuilding, IconUsers, IconZap, IconUser,
} from "../ui/Icons";
import "../../styles/Dashboard.css";

const ROLE_META = {
  client:        { Icon: IconTarget,   label: "Client",          color: "#c0152a" },
  agency:        { Icon: IconBuilding, label: "Agence",          color: "#7c3aed" },
  team:          { Icon: IconUsers,    label: "Équipe",          color: "#0891b2" },
  freelancer:    { Icon: IconZap,      label: "Freelancer",      color: "#d97706" },
  agency_member: { Icon: IconUser,     label: "Membre d'agence", color: "#7c3aed" },
  team_member:   { Icon: IconUser,     label: "Membre d'équipe", color: "#0891b2" },
  admin:         { Icon: IconUser,     label: "Administrateur",  color: "#c0152a" },
};

const NOTIF_ICON_MAP = {
  pitch_received:  "💬",
  pitch_accepted:  "✓",
  pitch_rejected:  "✗",
  post_published:  "◈",
  project_created: "▶",
  system:          "◉",
};

const DashboardLayout = ({ role, user, navItems = [], children, topbarTitle }) => {
  const navigate   = useNavigate();
  const { logout } = useAuth();
  const [collapsed,   setCollapsed]   = useState(false);
  const [showNotifs,  setShowNotifs]  = useState(false);
  const [notifs,      setNotifs]      = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const notifRef = useRef();

  const meta = ROLE_META[role] || ROLE_META.client;
  const RoleIcon = meta.Icon;

  const displayName =
    user?.companyName ||
    (user?.firstName ? `${user.firstName} ${user.lastName}` : null) ||
    user?.agencyName || user?.teamName || "Mon compte";

  const initials = displayName.split(" ").slice(0, 2)
    .map(w => w[0]?.toUpperCase()).join("");

  useEffect(() => {
    const load = async () => {
      try {
        const data = await notificationService.getAll({ limit: 10 });
        setNotifs(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      } catch {}
    };
    load();
    const interval = setInterval(load, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target))
        setShowNotifs(false);
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

  const handleLogout = () => { logout(); navigate("/login"); };

  return (
    <div className={`dash-layout ${collapsed ? "sidebar-collapsed" : "sidebar-open"}`}>

      {/* ── SIDEBAR ── */}
      <aside className="dash-sidebar">

        {/* Logo */}
        <div className="dash-sidebar-logo">
          {!collapsed && (
            <span className="dash-logo-text">Market<span>ili</span></span>
          )}
          {collapsed && (
            <span className="dash-logo-text"><span>M</span></span>
          )}
          <button className="dash-sidebar-toggle" onClick={() => setCollapsed(o => !o)}
            title={collapsed ? "Agrandir" : "Réduire"}>
            {collapsed
              ? <IconChevronRight size={13} />
              : <IconChevronLeft  size={13} />
            }
          </button>
        </div>

        {/* Role tag */}
        <div className="dash-role-tag" style={{ "--role-color": meta.color }}>
          <span className="dash-role-tag-icon" style={{ color: meta.color }}>
            <RoleIcon size={13} />
          </span>
          {!collapsed && <span>{meta.label}</span>}
        </div>

        {/* Nav */}
        <nav className="dash-nav">
          {navItems.map((item) => (
            <NavLink key={item.path} to={item.path}
              end={item.path.split("/").length === 3}
              className={({ isActive }) => `dash-nav-item${isActive ? " active" : ""}`}
              title={collapsed ? item.label : ""}>
              <span className="dash-nav-icon">
                {/* item.icon is a React element (JSX) — render as-is */}
                {item.icon}
              </span>
              {!collapsed && <span className="dash-nav-label">{item.label}</span>}
              {!collapsed && item.badge > 0 && (
                <span className="dash-nav-badge">{item.badge}</span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Footer: user + logout */}
        <div className="dash-sidebar-footer">
          <div className="dash-user-chip">
            <div className="dash-user-avatar">{initials}</div>
            {!collapsed && (
              <div className="dash-user-info">
                <div className="dash-user-name">{displayName}</div>
                <div className="dash-user-role">{meta.label}</div>
              </div>
            )}
          </div>
          <button className="dash-logout-btn" onClick={handleLogout} title="Se déconnecter">
            <span className="dash-logout-icon"><IconLogOut size={15} /></span>
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

            {/* Notification bell */}
            <div style={{ position: "relative" }} ref={notifRef}>
              <button className="dash-topbar-icon-btn" title="Notifications"
                onClick={handleOpenNotifs}>
                <IconBell size={16} />
                {unreadCount > 0 && <span className="dash-notif-dot" />}
              </button>

              {showNotifs && (
                <div className="dash-notif-dropdown">
                  <div className="dash-notif-header">
                    <span>Notifications</span>
                    {unreadCount === 0 && notifs.length > 0 && (
                      <span style={{ fontSize: "0.68rem", color: "var(--d-muted)", fontWeight: 400 }}>
                        Tout lu
                      </span>
                    )}
                  </div>

                  {notifs.length === 0 ? (
                    <div className="dash-notif-empty">
                      <div className="dash-notif-empty-icon"><IconBell size={16} /></div>
                      <p>Aucune notification</p>
                    </div>
                  ) : (
                    notifs.map(n => (
                      <div key={n._id}
                        className={`dash-notif-item ${n.isRead ? "" : "unread"}`}
                        onClick={() => { if (n.link) navigate(n.link); setShowNotifs(false); }}>
                        <div className="dash-notif-item-icon">
                          <span style={{ fontSize: "0.75rem" }}>
                            {NOTIF_ICON_MAP[n.type] || "◉"}
                          </span>
                        </div>
                        <div className="dash-notif-item-body">
                          <div className="dash-notif-item-title">{n.title}</div>
                          {n.body && (
                            <div className="dash-notif-item-desc">{n.body}</div>
                          )}
                          <div className="dash-notif-item-time">
                            {new Date(n.createdAt).toLocaleDateString("fr-DZ", {
                              day: "numeric", month: "short",
                              hour: "2-digit", minute: "2-digit",
                            })}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="dash-content">
          <AnimatePresence mode="wait">
            <motion.div key={topbarTitle}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22 }}>
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
