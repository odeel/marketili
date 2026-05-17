# Task 06 — Deadline Extension UI (Director)

**Status:** 🟡 Partial — backend already supports it, no UI button  
**Effort:** Tiny (single frontend change in DirectorProjects.js)

---

## What's Missing

`updateProject()` in `projectController.js` already accepts a `deadline` field and updates it. There is no dedicated "Extend deadline" button or date picker in the director's project detail view.

---

## Where to Add It

File: `frontend/src/pages/dashboard/agency/DirectorProjects.js`

In the project detail panel (the section that shows project info when a project is selected/expanded), add an inline deadline extension control near the existing deadline display.

---

## Implementation

### State

```js
const [extendMode, setExtendMode] = useState(false);
const [newDeadline, setNewDeadline] = useState("");
const [extending, setExtending] = useState(false);
```

### UI (inside project detail, near the deadline field)

```jsx
<div style={{ display: "flex", alignItems: "center", gap: 10 }}>
  <span style={{ fontSize: "0.82rem", color: dlColor, fontWeight: 700 }}>
    {new Date(project.deadline).toLocaleDateString("fr-DZ")}
  </span>
  {!extendMode && (
    <button onClick={() => { setExtendMode(true); setNewDeadline(project.deadline?.slice(0,10) || ""); }}
      style={{ fontSize: "0.72rem", padding: "3px 10px", borderRadius: 6, border: "1.5px solid #ddd",
        background: "none", cursor: "pointer", color: "#6b7280", fontFamily: "inherit" }}>
      Prolonger
    </button>
  )}
  {extendMode && (
    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
      <input type="date" value={newDeadline} min={project.deadline?.slice(0,10)}
        onChange={e => setNewDeadline(e.target.value)}
        style={{ fontSize: "0.8rem", padding: "4px 8px", borderRadius: 6,
          border: "1.5px solid #ddd", fontFamily: "inherit" }} />
      <button disabled={extending || !newDeadline}
        onClick={async () => {
          setExtending(true);
          try {
            await projectService.update(project._id, { deadline: newDeadline });
            setProject(p => ({ ...p, deadline: newDeadline }));
            setExtendMode(false);
          } catch {}
          setExtending(false);
        }}
        style={{ fontSize: "0.72rem", padding: "4px 10px", borderRadius: 6,
          border: "none", background: "#c0152a", color: "#fff",
          cursor: "pointer", fontFamily: "inherit", fontWeight: 700 }}>
        {extending ? "..." : "Confirmer"}
      </button>
      <button onClick={() => setExtendMode(false)}
        style={{ fontSize: "0.72rem", padding: "4px 8px", borderRadius: 6,
          border: "1.5px solid #ddd", background: "none", cursor: "pointer" }}>
        ✕
      </button>
    </div>
  )}
</div>
```

### Service call

`projectService.update(id, { deadline })` — this method should already exist. If not, add:

```js
update: (id, data) => api.patch(`/projects/${id}`, data).then(r => r.data),
```

---

## Acceptance Criteria

- [ ] Director sees current deadline with a "Prolonger" button next to it
- [ ] Clicking opens an inline date picker (min = current deadline, no past dates)
- [ ] Confirming calls PATCH /projects/:id with the new deadline
- [ ] The displayed deadline updates immediately without page reload
- [ ] The button closes back to read-only view after saving
