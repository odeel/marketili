import React from "react";

const TYPE_META = {
  contract_pdf:    { label: "Contrat (PDF)",      bg: "#7c3aed", icon: "◤" },
  receipt:         { label: "Reçu",               bg: "#d97706", icon: "◈" },
  bon_de_commande: { label: "Bon de Commande",    bg: "#0891b2", icon: "◆" },
  file:            { label: "Fichier",            bg: "#6b7280", icon: "↓" },
};

const relTime = (date) => {
  const diff  = Date.now() - new Date(date).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 1)   return "à l'instant";
  if (mins < 60)  return `${mins} min`;
  if (hours < 24) return `${hours}h`;
  return `${days}j`;
};

const MessageBubble = ({ message, isMine }) => {
  const { messageType, content, file, senderName, createdAt } = message;

  // ── System message: centered grey line ──
  if (messageType === "system") {
    return (
      <div style={{
        textAlign: "center", padding: "6px 0",
        fontSize: "0.72rem", color: "#9a6060", fontStyle: "italic",
      }}>
        {content}
      </div>
    );
  }

  // ── Document-type messages: full-width card ──
  if (["contract_pdf", "receipt", "bon_de_commande"].includes(messageType)) {
    const meta = TYPE_META[messageType];
    return (
      <div style={{
        display: "flex", flexDirection: isMine ? "row-reverse" : "row",
        alignItems: "flex-end", gap: 8, margin: "6px 0",
      }}>
        <div style={{
          background: meta.bg + "18",
          border: `1.5px solid ${meta.bg}44`,
          borderRadius: 12, padding: "12px 16px",
          maxWidth: "72%", minWidth: 200,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <span style={{
              width: 28, height: 28, borderRadius: "50%",
              background: meta.bg, color: "#fff",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "0.75rem", fontWeight: 700, flexShrink: 0,
            }}>
              {meta.icon}
            </span>
            <span style={{ fontWeight: 700, fontSize: "0.82rem", color: meta.bg }}>
              {meta.label}
            </span>
          </div>
          {file && (
            <a href={file.url} target="_blank" rel="noreferrer"
              style={{
                display: "block", fontSize: "0.8rem", color: meta.bg,
                fontWeight: 600, textDecoration: "none",
                padding: "7px 12px", borderRadius: 7,
                background: meta.bg + "12",
                border: `1px solid ${meta.bg}30`,
                marginTop: 4,
              }}>
              Télécharger — {file.filename}
            </a>
          )}
          <div style={{ fontSize: "0.68rem", color: "#9a6060", marginTop: 6, textAlign: "right" }}>
            {senderName} · {relTime(createdAt)}
          </div>
        </div>
      </div>
    );
  }

  // ── File message ──
  if (messageType === "file" && file) {
    const isPdf   = file.mimeType?.includes("pdf");
    const isImage = file.mimeType?.startsWith("image/");
    return (
      <div style={{
        display: "flex", flexDirection: isMine ? "row-reverse" : "row",
        alignItems: "flex-end", gap: 8, margin: "4px 0",
      }}>
        <div style={{
          background: isMine ? "#c0152a" : "var(--d-surface, #f8f8f8)",
          border: isMine ? "none" : "1.5px solid var(--d-border-soft, #eee)",
          borderRadius: isMine ? "18px 4px 18px 18px" : "4px 18px 18px 18px",
          padding: "10px 14px", maxWidth: "65%",
        }}>
          {isImage ? (
            <a href={file.url} target="_blank" rel="noreferrer">
              <img src={file.url} alt={file.filename}
                style={{ maxWidth: 220, maxHeight: 160, borderRadius: 8, display: "block" }} />
            </a>
          ) : (
            <a href={file.url} target="_blank" rel="noreferrer"
              style={{
                display: "flex", alignItems: "center", gap: 8,
                color: isMine ? "#fff" : "#c0152a", textDecoration: "none",
                fontSize: "0.82rem", fontWeight: 600,
              }}>
              <span style={{ fontSize: "1rem" }}>{isPdf ? "📄" : "📎"}</span>
              {file.filename}
            </a>
          )}
          <div style={{
            fontSize: "0.65rem", marginTop: 4, textAlign: "right",
            color: isMine ? "rgba(255,255,255,0.65)" : "#9a6060",
          }}>
            {senderName} · {relTime(createdAt)}
          </div>
        </div>
      </div>
    );
  }

  // ── Regular text message ──
  return (
    <div style={{
      display: "flex", flexDirection: isMine ? "row-reverse" : "row",
      alignItems: "flex-end", gap: 8, margin: "4px 0",
    }}>
      {!isMine && (
        <div style={{
          width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
          background: "#7c3aed22", color: "#7c3aed",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "0.65rem", fontWeight: 800,
        }}>
          {senderName?.[0]?.toUpperCase()}
        </div>
      )}
      <div style={{ maxWidth: "65%" }}>
        {!isMine && (
          <div style={{ fontSize: "0.68rem", color: "var(--d-muted, #9a6060)", marginBottom: 2, marginLeft: 4 }}>
            {senderName}
          </div>
        )}
        <div style={{
          background: isMine ? "#c0152a" : "var(--d-surface, #f8f8f8)",
          color: isMine ? "#fff" : "var(--d-ink, #1a0a0a)",
          border: isMine ? "none" : "1.5px solid var(--d-border-soft, #eee)",
          borderRadius: isMine ? "18px 4px 18px 18px" : "4px 18px 18px 18px",
          padding: "9px 14px", fontSize: "0.85rem", lineHeight: 1.5,
          wordBreak: "break-word",
        }}>
          {content}
        </div>
        <div style={{
          fontSize: "0.65rem", marginTop: 3,
          textAlign: isMine ? "right" : "left",
          color: "var(--d-muted, #9a6060)",
        }}>
          {relTime(createdAt)}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
