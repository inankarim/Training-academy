# Notifications system + due-date lockout + welcome message

## Context

Holcim Academy currently has no concept of an assignment due date being
enforced, and no way for HR/Admin/Super Admin to be notified about
platform events (a new course going live, a learner missing their
deadline). Learners also get a static "Welcome back" banner regardless
of whether it's their first login.

This spec covers three related but independently-shippable pieces:

1. Due-date lockout for course assignments.
2. A MongoDB-backed notification system for staff roles, including
   admin/super-admin-authored custom messages to learners.
3. First-login vs. returning-login welcome copy for learners.

## Goals / non-goals

- Goal: once a learner's assignment due date passes without the course
  being completed, they lose access to that course until HR extends
  the due date.
- Goal: HR, Admin, and Super Admin receive a notification when (a) a
  new course is published, and (b) a learner misses a due date.
- Goal: Admin/Super Admin can author a custom notification sent to one,
  several, or all learners.
- Goal: learners see "Welcome to Holcim Academy!" on their very first
  login ever, and "Welcome back, {name}!" on every login after that.
- Non-goal: email/push notifications — in-app only for this iteration.
- Non-goal: a general-purpose job scheduler/queue — a lightweight
  in-process interval sweep is sufficient at current scale.
- Non-goal: per-notification granular preferences/mute settings.

## Data model (MongoDB — new `notifications` collection)

```ts
interface NotificationDocument {
  _id: ObjectId;
  audienceType: 'role' | 'user';
  audienceRole?: 'hr' | 'admin' | 'super_admin'; // when audienceType='role'
  audienceUserId?: string;                        // when audienceType='user'
  category: 'course_published' | 'assignment_overdue' | 'custom';
  title: string;
  message: string;
  createdBy?: string;       // userId of the staff member who authored a custom message
  relatedCourseId?: string;
  relatedUserId?: string;   // e.g. the learner who missed their due date
  readBy: string[];         // userIds who have read this notification
  createdAt: Date;
}
```

A "send to all learners" custom message is exploded into one document
per learner at creation time (`audienceType: 'user'` per learner). This
keeps the unread-count/read-state query uniform for every notification
kind: a doc is unread for user X if
`(audienceType === 'role' && audienceRole === X.role) || (audienceType === 'user' && audienceUserId === X.id)`
and `!readBy.includes(X.id)`.

Indexes: `{ audienceType: 1, audienceRole: 1, createdAt: -1 }` and
`{ audienceType: 1, audienceUserId: 1, createdAt: -1 }`.

## Due-date lockout

### Schema/type changes (Postgres, `course_assignments`)

- Extend `AssignmentStatus` union: `'assigned' | 'in_progress' | 'completed' | 'overdue'`.
- Add column `overdue_notified_at TIMESTAMPTZ NULL` via a new
  `node-pg-migrate` migration — used as an idempotency guard so the
  overdue notification fires exactly once per lapse.

### Sweep mechanism

A `setInterval`-based sweep runs inside the existing Express process
every 15 minutes (no new infra/dependency):

1. Query assignments where `status IN ('assigned','in_progress')` and
   `due_date < now()` and `overdue_notified_at IS NULL`.
2. For each: set `status = 'overdue'`, set `overdue_notified_at = now()`.
3. Create one `assignment_overdue` notification (`audienceType: 'role'`)
   for each of `hr`, `admin`, `super_admin`, including the learner's
   name and course name in the message, `relatedUserId` and
   `relatedCourseId` set.

This also runs once at server startup (covers due dates that lapsed
while the server was down) and is exported as a plain function so it's
independently testable without waiting on the timer.

### Access enforcement

`learner.service.ts`'s existing `assertAssignment(userId, courseId)` —
already the single gate used by lesson-start, lesson-complete, and
lesson-content-fetch — additionally throws
`AppError('This course is locked because its due date has passed. Contact HR to extend the deadline.', 423)`
when the found assignment's `status === 'overdue'`.

### Reopening

No new endpoint or update logic is needed here. `assignments.service.ts`'s
`createAssignment` already supports assigning the same course to the
same learner more than once, on purpose ("repeat assignment is an
explicit, supported product requirement" per its existing comment) —
it always inserts a new row rather than updating one. Both
`learner.postgres.repository.ts`'s `findLatestAssignmentForLearnerCourse`
(used by `assertAssignment`) and `assignments.postgres.repository.ts`'s
`findAssignmentsForLearnerAndCourse` key off `assigned_at DESC LIMIT 1`
/ ordering, so a fresh assignment (new `due_date`, `status: 'assigned'`)
immediately becomes the one that governs access — the old `overdue` row
is simply superseded. "HR reopens access" = HR uses the existing
Assign Course flow again with a new due date; no product-facing change
is needed there at all.

## Notification triggers

| Event | Where hooked | Audience |
|---|---|---|
| Course published | `courses.service.ts` → `changeCourseStatus`, right after `pgRepo.setCourseStatus` succeeds inside the `status === 'published'` branch | role: hr, admin, super_admin |
| Assignment overdue | sweep function above | role: hr, admin, super_admin |
| Custom message | new `POST /notifications/custom` | user: each target learner |

## Backend module: `backend/src/modules/notifications/`

Following the existing module convention (see `learner` module):

- `notification.model.ts` — Mongoose schema/model, guarded export
  (`mongoose.models.Notification || mongoose.model(...)`), collection
  `notifications`.
- `notifications.types.ts` — `NotificationDTO`, request/response types.
- `notifications.mongo.repository.ts` — `createForRole`, `createForUser`,
  `createForUsers` (bulk explode), `findForRecipient(user, page)`,
  `countUnreadForRecipient(user)`, `markRead(id, userId)`,
  `markAllRead(user)`.
- `notifications.service.ts` — role/permission checks, orchestrates the
  repository, exposes `notifyCoursePublished`, `notifyAssignmentOverdue`
  (called by the sweep), `sendCustomMessage`.
- `notifications.controller.ts` + `notifications.routes.ts`:
  - `GET /api/v1/notifications` (paginated, mine)
  - `GET /api/v1/notifications/unread-count`
  - `POST /api/v1/notifications/:id/read`
  - `POST /api/v1/notifications/read-all`
  - `POST /api/v1/notifications/custom` — admin/super_admin only
    (`hasPermission`-style guard), body
    `{ title, message, targetLearnerIds: string[] | 'all' }`
- Register routes in the main router alongside existing modules.

## Welcome / welcome-back message

- `auth.service.ts`'s `login()` already fetches the user record (via
  `findUserByEmail`) before calling `authRepo.updateLastLogin(user.id)`.
  Capture `const isFirstLogin = user.last_login_at === null;` from that
  pre-update record, before the update call runs.
- Add `isFirstLogin: boolean` to the login response DTO
  (`AuthenticatedUserDTO` or a sibling field alongside it — not
  persisted, computed per-login).
- Frontend: store `isFirstLogin` from the login response into the auth
  store/context (session-scoped, not persisted across reloads —
  refreshing the dashboard should show "Welcome back" like any other
  subsequent visit, only the login response carries the flag).
- `LearnerDashboard.tsx`'s existing welcome banner (hardcoded
  `Welcome back, {user?.fullName}!`) becomes conditional:
  `isFirstLogin ? 'Welcome to Holcim Academy!' : `Welcome back, ${user.fullName}!``.

## Frontend

### Shared `NotificationBell` component

- New `frontend/src/components/shared/NotificationBell.tsx` — used in
  both `StaffLayout.tsx` and `LearnerLayout.tsx` headers (next to the
  existing `ThemeToggle`), so the bell/dropdown/unread-badge behavior
  is written once.
- `useQuery(['notifications-unread-count'], ..., { refetchInterval: 30_000 })`
  for the badge count; dropdown lazily fetches the recent list on open.
- Dropdown: title, message snippet, relative time, unread dot, "Mark
  all read", "View all" link to a `/notifications` page (staff and
  learner each get a route to the same `NotificationsPage` component
  under their respective layout).

### Staff (`StaffLayout.tsx`)

- `NotificationBell` shown for hr/admin/super_admin roles only (mirrors
  existing `isHr` / `user?.role === 'super_admin'` checks already in
  this file).
- New `NotificationsPage.tsx`: full paginated history. For
  admin/super_admin, a "Compose Message" button opens a small
  modal/form (title, message, recipient picker reusing the existing
  learner list from `listUsersApi` filtered to role `learner`, or an
  "All Learners" toggle) that posts to `/notifications/custom`. Hidden
  entirely for hr (per your answer, only admin/super_admin compose).

### Learner

- `CourseOverviewPage.tsx` / `LessonPlayerPage.tsx`: catch a 423
  response from the existing lesson-access calls and render a locked
  state ("This course is locked — its due date has passed. Contact HR
  to extend your deadline.") instead of the current generic error
  handling.
- `LearnerLayout.tsx` gets the same shared `NotificationBell` (see
  below) so a learner can actually read a custom message sent to them
  — otherwise the "admin can message learners" goal has no receiving
  end. Learners only ever receive `custom` category notifications
  (never in the `hr`/`admin`/`super_admin` role audience), so their
  `NotificationsPage` view has no "Compose" button.

## Testing plan

- Backend: unit tests for the sweep function (assignment flips to
  overdue exactly once, notification created exactly once even if the
  sweep runs twice), `assertAssignment` throwing 423 for overdue
  assignments, reopen logic clearing `overdue_notified_at` and
  resetting status, notification repository read/unread queries for
  both audience types, and the custom-message permission guard
  (rejecting hr/learner, allowing admin/super_admin).
- Manual verification via disposable `@stagetest.example` accounts:
  create an assignment with a past due date directly in Postgres,
  confirm the sweep locks it and generates the HR/Admin/Super Admin
  notification, confirm the learner gets a 423 with the locked UI,
  confirm HR extending the due date restores access, confirm a custom
  message reaches only its targeted learner(s), confirm first login
  shows the "Welcome to Holcim Academy!" copy and a second login shows
  "Welcome back". Clean up all test data afterward per existing
  convention.
