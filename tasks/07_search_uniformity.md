# Task 07 — Search Uniformity (Remaining Panels)

**Status:** 🟡 Partial — search exists in posts, pitches, contracts, projects, providers  
**Effort:** Tiny (2–3 small frontend additions)

---

## What's Missing

Search is still absent in:
1. **Task list** — Worker and TeamMember task panels have no search
2. **Notification list** — NotificationsPage has no search/text filter

---

## 1. Task List Search

### Files to update

- `frontend/src/pages/dashboard/agency/WorkerTasks.js` (agency member task view)
- `frontend/src/pages/dashboard/team/TeamMemberProjects.js` (team member task view inside project)

### Change

Add a search input above the task list. Filter client-side using `useMemo` (tasks are already loaded):

```js
const [search, setSearch] = useState("");

const filteredTasks = useMemo(() =>
  tasks.filter(t =>
    !search ||
    t.title.toLowerCase().includes(search.toLowerCase()) ||
    t.projectTitle?.toLowerCase().includes(search.toLowerCase())
  ), [tasks, search]);
```

Render:
```jsx
<div style={{ position: "relative", marginBottom: 16 }}>
  <IconSearch size={14} style={{ position: "absolute", left: 12, top: "50%",
    transform: "translateY(-50%)", color: "var(--d-muted)", pointerEvents: "none" }} />
  <input value={search} onChange={e => setSearch(e.target.value)}
    placeholder="Rechercher une tâche..."
    className="dash-form-input" style={{ paddingLeft: 36 }} />
</div>
{/* render filteredTasks instead of tasks */}
```

---

## 2. Notification List Search

### File to update

`frontend/src/pages/dashboard/shared/NotificationsPage.js`

### Change

Add a text input above the list + category filter already exists. Filter client-side:

```js
const [search, setSearch] = useState("");

const filtered = useMemo(() =>
  notifications.filter(n =>
    (!search || n.title.toLowerCase().includes(search.toLowerCase()) || n.body?.toLowerCase().includes(search.toLowerCase()))
    && (!categoryFilter || n.category === categoryFilter)
  ), [notifications, search, categoryFilter]);
```

Render the search input aligned with the existing category filter dropdown.

---

## Acceptance Criteria

- [ ] Worker task panel has a search input that filters tasks by title or project name
- [ ] TeamMember task view has the same search capability
- [ ] NotificationsPage has a search input filtering by title/body text
- [ ] All filtering is client-side (no extra API calls)
- [ ] Empty state shown correctly when no results match
