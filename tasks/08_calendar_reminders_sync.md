# Task 08 — Calendar: Personal Reminders Sync

**Priority:** 🟡 Priority 3
**Depends on:** nothing
**Blocks:** nothing

---

## Why This Exists

The spec says:
> "personal todo list, reminders, pinned tasks, quick notes — separate from official project tasks. Activity planning and also everything automatically appears in calendar."

Currently:
- `PersonalNote` model has `isReminder: true` and `reminderDate` fields
- The calendar shows project deadlines and task due dates (from `calendarController`)
- BUT personal reminder notes with a `reminderDate` do NOT appear on the calendar

The calendar controller only queries `Project` and embedded `Task` models. It never queries `PersonalNote`.

---

## Backend Work

### 1. Update `backend/controllers/calendarController.js`

In the existing `getCalendarEvents()` function:

After building the array of project deadline events and task due date events, add a third query:

```js
// Personal notes with reminderDate set
const notes = await PersonalNote.find({
  owner: userId,
  ownerRole: role,
  isReminder: true,
  reminderDate: { $gte: startDate, $lte: endDate },
  isDone: false
});

const noteEvents = notes.map(n => ({
  id: n._id,
  type: 'reminder',
  title: n.text.length > 60 ? n.text.substring(0, 60) + '…' : n.text,
  date: n.reminderDate,
  dlColor: '#8b5cf6',  // purple — distinct from project/task colors
  source: 'note',
  noteId: n._id
}));
```

Merge `noteEvents` into the returned events array.

Import `PersonalNote` at the top of the controller.

### 2. No new routes needed

The existing `GET /api/calendar/:role/:id` endpoint already returns all events. Adding notes to the same response is sufficient.

---

## Frontend Work

### 1. Update calendar rendering in all calendar pages

The calendar component (SharedCalendar or role-specific variants) already renders events from `calendarService.getEvents()`. It needs to:

- Handle the new `type: "reminder"` event type
- Render reminder events with a purple color (`#8b5cf6`) and a different icon (bell icon, not briefcase or checklist)
- Render the note text as the event title
- On click: show a popover/tooltip with the full note text and a "Marquer comme fait" button
  - "Marquer comme fait" calls `noteService.update(noteId, { isDone: true })` and removes the event from the calendar

### 2. Update the PersonalNotes UI to reflect calendar state

In `frontend/src/pages/dashboard/shared/PersonalNotes.js`:

When a note has `isReminder: true` and `reminderDate` set:
- Show a small calendar icon next to the note
- Tooltip: "Apparaît dans le calendrier le [date]"

---

## Files to Modify

```
backend/controllers/calendarController.js
    - ADD PersonalNote query
    - ADD noteEvents to returned array

frontend/src/pages/dashboard/shared/SharedCalendar.js (or each role's calendar page)
    - ADD handling for type="reminder" events (purple color, bell icon)
    - ADD "Marquer comme fait" click action

frontend/src/pages/dashboard/shared/PersonalNotes.js
    - ADD calendar indicator on reminder notes with reminderDate set
```

---

## Acceptance Criteria

- [ ] A personal note with `isReminder: true` and `reminderDate: [future date]` appears on the calendar on that date
- [ ] Reminder events appear in purple, distinct from project deadlines (colored) and task dates
- [ ] Clicking a reminder event on the calendar shows its text and a "Marquer comme fait" button
- [ ] Clicking "Marquer comme fait" marks the note as done and removes it from the calendar
- [ ] Done notes no longer appear on the calendar
- [ ] Notes without `reminderDate` or with `isReminder: false` do not appear on the calendar
- [ ] Personal notes list shows a calendar icon on notes that have a reminder date
