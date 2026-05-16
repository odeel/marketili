// frontend/src/pages/dashboard/agency/DirectorProjects.jsx
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ProgressBar, PriorityBadge } from "./shared";
import projectService from "../../../services/projectService";
import contractService from "../../../services/contractService";
import { IconCheckSquare, IconZap, IconCalendar } from "../../../components/ui/Icons";

const STATUS_COLOR = {
  pending: "#f59e0b", active: "#7c3aed",
  in_review: "#0891b2", completed: "#10b981", cancelled: "#6b7280",
};
const STATUS_LABEL = {
  pending: "En attente", active: "Actif",
  in_review: "En révision", completed: "Terminé", cancelled: "Annulé",
};

const CONTRACT_STATUS_META = {
  draft:        { label: "Brouillon",     color: "#6b7280" },
  sent:         { label: "Envoyé",        color: "#f59e0b" },
  acknowledged: { label: "Reçu confirmé", color: "#0891b2" },
  signed:       { label: "Finalisé",      color: "#10b981" },
  resiliation:  { label: "Résilié",       color: "#ef4444" },
};

const ProjectCard = ({ project: p, index, onClick }) => {
  const clientName = p.client
    ? (p.client.accountType === "company"
        ? p.client.companyName
        : `${p.client.firstName} ${p.client.lastName}`)
    : "Client inconnu";

  return (
    <motion.div className="card" initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }}
      style={{ cursor: "pointer" }} onClick={onClick}>
      <div style={{ padding: "20px 22px" }}>
        <div style={{ display: "flex", justifyContent: "space-between",
          alignItems: "flex-start", marginBottom: 8 }}>
          <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "#1a0a0a", flex: 1 }}>
            {p.title}
          </div>
          <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: "0.7rem",
            fontWeight: 700, background: STATUS_COLOR[p.projectStatus] + "22",
            color: STATUS_COLOR[p.projectStatus], marginLeft: 8, whiteSpace: "nowrap" }}>
            {STATUS_LABEL[p.projectStatus]}
          </span>
        </div>
        <div style={{ fontSize: "0.78rem", color: "#9a6060", marginBottom: 12 }}>
          Client : {clientName}
        </div>
        <ProgressBar value={p.progress || 0} />
        <div style={{ display: "flex", justifyContent: "space-between",
          fontSize: "0.72rem", color: "#9a6060", marginTop: 6 }}>
          <span>{p.progress || 0}% complété</span>
          <span>{p.tasks?.length || 0} tâche{p.tasks?.length !== 1 ? "s" : ""}</span>
        </div>
      </div>
    </motion.div>
  );
};

const TASK_STATUS = {
  todo:        { label: "À faire",     color: "#6b7280" },
  in_progress: { label: "En cours",    color: "#f59e0b" },
  in_review:   { label: "En révision", color: "#0891b2" },
  done:        { label: "Terminé",     color: "#10b981" },
};

const ProjectDetail = ({ project: initial, agencyId, agencyUser }) => {
  const [project,     setProject]     = useState(initial);
  const [members,     setMembers]     = useState([]);
  const [showAddTask, setShowAddTask] = useState(false);
  const [taskForm,    setTaskForm]    = useState({
    title: "", description: "", priority: "medium", dueDate: "", assignedTo: "",
  });
  const [saving, setSaving] = useState(false);

  // ── Contract state ──
  const [showContractModal, setShowContractModal] = useState(false);
  const [contract,          setContract]          = useState(null);
  const [contractLoading,   setContractLoading]   = useState(true);

  useEffect(() => {
    projectService.getAgencyMembers(agencyId)
      .then(d => setMembers(d.members || []))
      .catch(() => {});
    projectService.getProject(project._id)
      .then(d => setProject(d.project))
      .catch(() => {});
  }, [agencyId, project._id]);

  // ── Load contract ──
  useEffect(() => {
    contractService.getByProject(project._id)
      .then(d => setContract(d.contract))
      .catch(() => {})
      .finally(() => setContractLoading(false));
  }, [project._id]);

  const handleAddTask = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const found = members.find(m => m._id === taskForm.assignedTo);
      const assignedTo = taskForm.assignedTo
        ? [{ memberType: "AgencyMember", memberId: taskForm.assignedTo,
             memberName: found ? `${found.firstName} ${found.lastName}` : "" }]
        : [];
      const d = await projectService.createTask(project._id, { ...taskForm, assignedTo });
      setProject(d.project);
      setShowAddTask(false);
      setTaskForm({ title: "", description: "", priority: "medium", dueDate: "", assignedTo: "" });
    } catch {}
    finally { setSaving(false); }
  };

  const handleStatusChange = async (taskId, status) => {
    try {
      const d = await projectService.updateTask(project._id, taskId, { status });
      setProject(d.project);
    } catch {}
  };

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontWeight: 800, fontSize: "1.15rem", color: "#1a0a0a",
          letterSpacing: "-0.025em", marginBottom: 4 }}>{project.title}</div>
        <ProgressBar value={project.progress || 0} />
        <div style={{ fontSize: "0.75rem", color: "#9a6060", marginTop: 4 }}>
          {project.progress || 0}% · Échéance :{" "}
          {project.deadline ? new Date(project.deadline).toLocaleDateString("fr-DZ") : "—"}
        </div>
      </div>

      {project.assignedMembers?.length > 0 && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
          {project.assignedMembers.map((m, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 6,
              padding: "5px 12px", background: "#fff", border: "1px solid #f0dede",
              borderRadius: 20, fontSize: "0.78rem", color: "#4a2a2a" }}>
              <div style={{ width: 22, height: 22, borderRadius: "50%",
                background: "#c0152a", color: "#fff", fontSize: "0.6rem",
                display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>
                {m.memberName?.[0]?.toUpperCase()}
              </div>
              {m.memberName}
            </div>
          ))}
        </div>
      )}

      {/* ── Contract status card ── */}
      <div className="card" style={{ marginBottom: 16, padding: "16px 22px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "#1a0a0a" }}>Contrat</div>
            <div style={{ fontSize: "0.75rem", color: "#9a6060", marginTop: 2 }}>
              {contractLoading ? "Chargement..."
                : contract
                  ? `${CONTRACT_STATUS_META[contract.status]?.label || contract.status} · ${new Date(contract.createdAt).toLocaleDateString("fr-DZ")}`
                  : "Aucun contrat créé"}
            </div>
          </div>
          {!contractLoading && !contract && (
            <button className="section-cta-btn"
              style={{ padding: "7px 16px", fontSize: "0.8rem" }}
              onClick={() => setShowContractModal(true)}>
              + Créer un contrat
            </button>
          )}
          {contract && (
            <span style={{
              padding: "4px 12px", borderRadius: 20, fontSize: "0.74rem", fontWeight: 700,
              color: CONTRACT_STATUS_META[contract.status]?.color || "#6b7280",
              background: (CONTRACT_STATUS_META[contract.status]?.color || "#6b7280") + "22",
            }}>
              {CONTRACT_STATUS_META[contract.status]?.label}
            </span>
          )}
        </div>
      </div>

      {/* ── Tasks card ── */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-header">
          <div className="section-head" style={{ marginBottom: 0 }}>
            <div>
              <div className="section-head-title">Tâches ({project.tasks?.length || 0})</div>
            </div>
            <button className="section-head-action" onClick={() => setShowAddTask(v => !v)}>
              + Ajouter une tâche
            </button>
          </div>
        </div>

        {showAddTask && (
          <div style={{ padding: "16px 22px", borderBottom: "1px solid #faeaea", background: "#fffbfb" }}>
            <form onSubmit={handleAddTask} className="dash-form">
              <div className="dash-form-row">
                <div className="dash-form-group">
                  <label className="dash-form-label">Titre *</label>
                  <input className="dash-form-input" required value={taskForm.title}
                    onChange={e => setTaskForm(p => ({ ...p, title: e.target.value }))} />
                </div>
                <div className="dash-form-group">
                  <label className="dash-form-label">Priorité</label>
                  <select className="dash-form-select" value={taskForm.priority}
                    onChange={e => setTaskForm(p => ({ ...p, priority: e.target.value }))}>
                    <option value="low">Bas</option>
                    <option value="medium">Moyen</option>
                    <option value="high">Haut</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>
              <div className="dash-form-row">
                <div className="dash-form-group">
                  <label className="dash-form-label">Assigner à</label>
                  <select className="dash-form-select" value={taskForm.assignedTo}
                    onChange={e => setTaskForm(p => ({ ...p, assignedTo: e.target.value }))}>
                    <option value="">Moi-même (directeur)</option>
                    {members.map(m => (
                      <option key={m._id} value={m._id}>
                        {m.firstName} {m.lastName} ({m.jobTitle})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="dash-form-group">
                  <label className="dash-form-label">Date d'échéance</label>
                  <input className="dash-form-input" type="date" value={taskForm.dueDate}
                    onChange={e => setTaskForm(p => ({ ...p, dueDate: e.target.value }))} />
                </div>
              </div>
              <div className="dash-form-group">
                <label className="dash-form-label">Description</label>
                <textarea className="dash-form-textarea" rows={2} value={taskForm.description}
                  onChange={e => setTaskForm(p => ({ ...p, description: e.target.value }))} />
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button type="submit" className="dash-form-submit" style={{ flex: 1 }} disabled={saving}>
                  {saving ? "Ajout..." : "Ajouter la tâche"}
                </button>
                <button type="button" onClick={() => setShowAddTask(false)}
                  style={{ padding: "10px 18px", border: "1.5px solid #f0dede",
                    borderRadius: 9, background: "transparent", cursor: "pointer",
                    fontSize: "0.85rem", color: "#9a6060" }}>
                  Annuler
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="card-body" style={{ padding: "8px 0 0" }}>
          {!project.tasks?.length ? (
            <div className="empty-state" style={{ padding: "32px 24px" }}>
              <div className="empty-state-icon"><IconCheckSquare size={20} /></div>
              <div className="empty-state-title">Aucune tâche pour l'instant</div>
            </div>
          ) : project.tasks.map((task) => (
            <div key={task._id} style={{ display: "flex", alignItems: "center",
              gap: 12, padding: "12px 22px", borderBottom: "1px solid #faeaea" }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: "0.87rem", color: "#1a0a0a" }}>
                  {task.title}
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 4, flexWrap: "wrap" }}>
                  <PriorityBadge priority={task.priority} />
                  {task.dueDate && (
                    <span style={{ fontSize: "0.72rem", color: "#9a6060" }}>
                      {new Date(task.dueDate).toLocaleDateString("fr-DZ")}
                    </span>
                  )}
                  {task.assignedTo?.[0]?.memberName && (
                    <span style={{ fontSize: "0.72rem", color: "#9a6060" }}>
                      {task.assignedTo[0].memberName}
                    </span>
                  )}
                </div>
              </div>
              <select value={task.status}
                onChange={e => handleStatusChange(task._id, e.target.value)}
                style={{ padding: "5px 10px", borderRadius: 8, border: "1.5px solid #f0dede",
                  fontSize: "0.78rem", color: TASK_STATUS[task.status]?.color || "#6b7280",
                  background: "#fff", cursor: "pointer", fontFamily: "inherit" }}>
                {Object.entries(TASK_STATUS).map(([v, s]) => (
                  <option key={v} value={v}>{s.label}</option>
                ))}
              </select>
            </div>
          ))}
        </div>
      </div>

      {/* ── Contract modal ── */}
      <AnimatePresence>
        {showContractModal && (
          <ContractModal
            project={project}
            user={agencyUser}
            onClose={() => setShowContractModal(false)}
            onCreated={() => {
              setShowContractModal(false);
              contractService.getByProject(project._id)
                .then(d => setContract(d.contract))
                .catch(() => {});
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// CONTRACT MODAL — CREATE CONTRACT FORM
// ══════════════════════════════════════════════════════════════════════════════
const ContractModal = ({ project, user, onClose, onCreated }) => {
  const [form, setForm] = useState({
    contractType:    "service_agreement",
    title:           `Contrat — ${project.title}`,
    objet:           "",
    prestations:     "",
    livrables:       "",
    amount:          project.agreedPrice?.amount || "",
    currency:        project.agreedPrice?.currency || "DZD",
    paymentSchedule: "",
    paymentMethod:   "virement",
    startDate:       "",
    endDate:         "",
    confidentialityClause: true,
    exclusivityClause:     false,
    resiliationTerms:      "",
    additionalClauses:     "",
  });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.objet.trim()) return setError("L'objet du contrat est requis");
    setSaving(true);
    setError("");
    try {
      const clientName = project.client
        ? (project.client.accountType === "company"
            ? project.client.companyName
            : `${project.client.firstName} ${project.client.lastName}`)
        : "Client";

      await contractService.create({
        projectId:  project._id,
        pitchId:    project.pitch,
        contractType: form.contractType,
        // Party A = agency (provider)
        partyAType: "Agency",
        partyAId:   project.providerAgency || user._id,
        partyAName: user.agencyName || "Agence",
        // Party B = client
        partyBType: "Client",
        partyBId:   project.client?._id || project.client,
        partyBName: clientName,
        title:       form.title,
        objet:       form.objet,
        prestations: form.prestations,
        livrables:   form.livrables,
        financialTerms: {
          amount:          Number(form.amount) || undefined,
          currency:        form.currency,
          paymentMethod:   form.paymentMethod,
          paymentSchedule: form.paymentSchedule,
        },
        duration: {
          startDate: form.startDate || undefined,
          endDate:   form.endDate   || undefined,
        },
        confidentialityClause: form.confidentialityClause,
        exclusivityClause:     form.exclusivityClause,
        resiliationTerms:      form.resiliationTerms,
        additionalClauses:     form.additionalClauses,
        initiatedBy:           user._id,
        initiatedByRole:       "agency",
      });
      onCreated();
    } catch (err) {
      setError(err.response?.data?.message || "Erreur lors de la création");
    } finally {
      setSaving(false);
    }
  };

  const set = (field) => (e) =>
    setForm(prev => ({ ...prev, [field]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div className="modal-box"
        style={{ maxWidth: 640, maxHeight: "90vh", overflowY: "auto" }}
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 16 }}
        transition={{ duration: 0.25 }}>
        <div className="modal-header">
          <div>
            <h2 className="modal-title">Créer un contrat</h2>
            <p style={{ fontSize: "0.78rem", color: "#9a6060", marginTop: 2 }}>{project.title}</p>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <form onSubmit={handleSubmit} className="dash-form">

            {/* Contract type */}
            <div className="dash-form-group">
              <label className="dash-form-label">Type de contrat</label>
              <select className="dash-form-select" value={form.contractType} onChange={set("contractType")}>
                <option value="service_agreement">Convention de prestation</option>
                <option value="collaboration">Convention de collaboration</option>
                <option value="cdd">CDD</option>
                <option value="cdi">CDI</option>
                <option value="project">Projet ponctuel</option>
              </select>
            </div>

            <div className="dash-form-group">
              <label className="dash-form-label">Titre du contrat</label>
              <input className="dash-form-input" value={form.title} onChange={set("title")} />
            </div>

            {/* ARTICLE 01 */}
            <div className="dash-form-group">
              <label className="dash-form-label">Art. 01 — Objet du contrat *</label>
              <textarea className="dash-form-textarea" rows={3}
                placeholder="Objet principal de la prestation..."
                value={form.objet} onChange={set("objet")} />
            </div>

            {/* ARTICLE 02 */}
            <div className="dash-form-group">
              <label className="dash-form-label">Art. 02 — Nature des prestations</label>
              <textarea className="dash-form-textarea" rows={3}
                placeholder="Détail des services fournis..."
                value={form.prestations} onChange={set("prestations")} />
            </div>

            {/* ARTICLE 03 */}
            <div className="dash-form-group">
              <label className="dash-form-label">Art. 03 — Périmètre & livrables</label>
              <textarea className="dash-form-textarea" rows={3}
                placeholder="Livrables attendus, périmètre du projet..."
                value={form.livrables} onChange={set("livrables")} />
            </div>

            {/* ARTICLE 05 — Financial */}
            <div className="dash-form-row">
              <div className="dash-form-group">
                <label className="dash-form-label">Art. 05 — Montant</label>
                <input className="dash-form-input" type="number" min={0}
                  value={form.amount} onChange={set("amount")} />
              </div>
              <div className="dash-form-group">
                <label className="dash-form-label">Devise</label>
                <select className="dash-form-select" value={form.currency} onChange={set("currency")}>
                  <option value="DZD">DZD</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                </select>
              </div>
              <div className="dash-form-group">
                <label className="dash-form-label">Mode de paiement</label>
                <select className="dash-form-select" value={form.paymentMethod} onChange={set("paymentMethod")}>
                  <option value="virement">Virement</option>
                  <option value="chèque">Chèque</option>
                  <option value="espèces">Espèces</option>
                </select>
              </div>
            </div>

            <div className="dash-form-group">
              <label className="dash-form-label">Échéancier de paiement</label>
              <input className="dash-form-input"
                placeholder="Ex: 50% à la signature, 50% à la livraison"
                value={form.paymentSchedule} onChange={set("paymentSchedule")} />
            </div>

            {/* ARTICLE 08 — Duration */}
            <div className="dash-form-row">
              <div className="dash-form-group">
                <label className="dash-form-label">Art. 08 — Date de début</label>
                <input className="dash-form-input" type="date"
                  value={form.startDate} onChange={set("startDate")} />
              </div>
              <div className="dash-form-group">
                <label className="dash-form-label">Date de fin</label>
                <input className="dash-form-input" type="date"
                  value={form.endDate} onChange={set("endDate")} />
              </div>
            </div>

            {/* Clauses */}
            <div style={{ display: "flex", gap: 20, flexWrap: "wrap", marginBottom: 16 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 8,
                fontSize: "0.85rem", color: "#4a2a2a", cursor: "pointer" }}>
                <input type="checkbox" checked={form.confidentialityClause}
                  onChange={set("confidentialityClause")} />
                Art. 09 — Clause de confidentialité
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: 8,
                fontSize: "0.85rem", color: "#4a2a2a", cursor: "pointer" }}>
                <input type="checkbox" checked={form.exclusivityClause}
                  onChange={set("exclusivityClause")} />
                Art. 10 — Clause d'exclusivité
              </label>
            </div>

            {/* ARTICLE 14 */}
            <div className="dash-form-group">
              <label className="dash-form-label">Art. 14 — Conditions de résiliation</label>
              <textarea className="dash-form-textarea" rows={2}
                placeholder="Modalités de résiliation anticipée..."
                value={form.resiliationTerms} onChange={set("resiliationTerms")} />
            </div>

            <div className="dash-form-group">
              <label className="dash-form-label">Clauses additionnelles</label>
              <textarea className="dash-form-textarea" rows={2}
                placeholder="Autres dispositions..."
                value={form.additionalClauses} onChange={set("additionalClauses")} />
            </div>

            {error && <div className="dash-form-error">{error}</div>}

            <div style={{ display: "flex", gap: 10 }}>
              <button type="submit" className="dash-form-submit" style={{ flex: 2 }} disabled={saving}>
                {saving ? "Création..." : "Créer le contrat"}
              </button>
              <button type="button" onClick={onClose}
                style={{ flex: 1, padding: 12, border: "1.5px solid #f0dede",
                  borderRadius: 9, background: "white", color: "#9a6060",
                  fontSize: "0.9rem", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                Annuler
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════════════════════
const DirectorProjects = ({ user }) => {
  const [projects, setProjects] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [filter,   setFilter]   = useState("all");
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    projectService.getAgencyProjects(user._id)
      .then(d => setProjects(d.projects || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user._id]);

  const filtered = filter === "all" ? projects
    : projects.filter(p => p.projectStatus === filter);

  const STATUS_OPTS = [
    { value: "all",       label: "Tous"        },
    { value: "active",    label: "Actifs"      },
    { value: "in_review", label: "En révision" },
    { value: "completed", label: "Terminés"    },
    { value: "cancelled", label: "Annulés"     },
  ];

  return (
    <div>
      <div className="section-header">
        <div className="section-header-left">
          <h2>Projets</h2>
          <p>{filtered.length} projet{filtered.length !== 1 ? "s" : ""}</p>
        </div>
        {selected && (
          <button className="section-cta-btn"
            style={{ background: "transparent", color: "#9a6060",
              border: "1.5px solid #f0dede", boxShadow: "none" }}
            onClick={() => setSelected(null)}>
            ← Retour
          </button>
        )}
      </div>

      {!selected ? (
        <>
          <div className="filters-bar" style={{ marginBottom: 18 }}>
            {STATUS_OPTS.map(o => (
              <button key={o.value}
                className={`filter-btn${filter === o.value ? " active" : ""}`}
                onClick={() => setFilter(o.value)}>
                {o.label}
              </button>
            ))}
          </div>
          {loading ? <div className="spinner-wrap"><div className="spinner" /></div>
          : filtered.length === 0 ? (
            <div className="card">
              <div className="empty-state" style={{ padding: "64px 24px" }}>
                <div className="empty-state-icon"><IconZap size={20} /></div>
                <div className="empty-state-title">Aucun projet</div>
              </div>
            </div>
          ) : (
            <div style={{ display: "grid",
              gridTemplateColumns: "repeat(auto-fill,minmax(320px,1fr))", gap: 16 }}>
              {filtered.map((p, i) => (
                <ProjectCard key={p._id} project={p} index={i}
                  onClick={() => setSelected(p)} />
              ))}
            </div>
          )}
        </>
      ) : (
        <ProjectDetail project={selected} agencyId={user._id} agencyUser={user} />
      )}
    </div>
  );
};

export default DirectorProjects;