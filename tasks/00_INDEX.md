# Tasks Index — Marketili Remaining Work

> Last updated: 2026-05-17
> Source of truth: PROJECT_STATUS.md

This folder contains one file per feature group. Each file specifies exactly what backend and frontend work is needed, which files to touch, and any dependencies.

---

## Priority Order

### 🔴 Priority 1 — Critical Blockers (core workflow broken without these)

| File | Feature | Why Critical |
|---|---|---|
| [01_chat_system.md](01_chat_system.md) | Chat & Messaging | Contract flow is entirely supposed to happen inside chat. PDF, receipt, BDC all sent through messages. Nothing works without this. |
| [02_contract_proforma_pdf.md](02_contract_proforma_pdf.md) | Contract Proforma Form + PDF Generation | Agency cannot generate the formal contract PDF. contractPdf field exists but nothing fills it. Depends on chat being built. |
| [03_pitch_forms_completion.md](03_pitch_forms_completion.md) | Pitch Forms — CONVENTION + 5-step verification | Agency→Freelancer pitch is missing its legal article structure. Agency→Client 5-step form needs routing verification. |

---

### 🟠 Priority 2 — Significant Gaps (feature exists but incomplete)

| File | Feature | Why Important |
|---|---|---|
| [04_notifications_gaps.md](04_notifications_gaps.md) | Notification Director Filter + Missing Triggers | Director receives all notifications including ones meant only for them. Some triggers never fire. |
| [05_freelancer_agency_apply.md](05_freelancer_agency_apply.md) | Freelancer Apply / Agency Invite Workflow | Model is ready but no endpoint or UI. Freelancers have no way to join agencies. |
| [06_analytics_dashboard.md](06_analytics_dashboard.md) | Agency Analytics Dashboard | Director has no pitch win rate, project velocity, or revenue data. Only raw overview stats. |

---

### 🟡 Priority 3 — UI & UX Fixes (small gaps in existing features)

| File | Feature | Why Needed |
|---|---|---|
| [07_project_ui_fixes.md](07_project_ui_fixes.md) | Completed Project Greying + Deadline Extension | Completed projects look the same as active ones. Director can't extend deadline from UI. |
| [08_calendar_reminders_sync.md](08_calendar_reminders_sync.md) | Personal Reminders → Calendar Sync | Notes with reminderDate don't appear in the calendar automatically. |
| [09_team_member_dashboard.md](09_team_member_dashboard.md) | TeamMember Dashboard Completeness | TeamMember role has model + routes but dashboard subpages are sparse. |

---

### 🔵 Priority 4 — Admin & Backfill

| File | Feature | Why Needed |
|---|---|---|
| [10_admin_ads_activity.md](10_admin_ads_activity.md) | Ads System + Admin Activity Log | Admin can't add ads (fully missing). Activity log shows only aggregate stats, not event feed. |
| [11_minor_fields_fixes.md](11_minor_fields_fixes.md) | Minor field and UX gaps | Objectives field, achievements, provider direct-post, search uniformity across all modules. |

---

## Dependency Map

```
01_chat_system
    └── 02_contract_proforma_pdf  (contract PDF sent through chat)

03_pitch_forms_completion
    └── (independent)

04_notifications_gaps
    └── (independent, but easier after 01_chat)

05_freelancer_agency_apply
    └── 04_notifications_gaps (invite notification needed)

06_analytics_dashboard
    └── (independent)

07_project_ui_fixes
    └── (independent)

08_calendar_reminders_sync
    └── (independent)

09_team_member_dashboard
    └── (independent)

10_admin_ads_activity
    └── (independent)

11_minor_fields_fixes
    └── (independent)
```
