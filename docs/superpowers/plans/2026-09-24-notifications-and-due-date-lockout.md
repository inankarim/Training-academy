# Notifications System + Due-Date Lockout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Lock a learner out of a course once its assignment due date passes without completion (until HR re-assigns it), add a MongoDB-backed notification system for HR/Admin/Super Admin (course-published, assignment-overdue, and admin/super-admin-authored custom messages to learners), and show learners "Welcome to Holcim Academy!" on their first-ever login vs. "Welcome back" afterward.

**Architecture:** A new `backend/src/modules/notifications/` module (Mongoose model + repo + service + routes) is the single source of truth for all notifications, addressed either to a staff role or to a specific user. Two existing chokepoints get one hook each: `courses.service.ts`'s publish transition fires a role notification, and a new in-process 15-minute sweep in `assignments.service.ts` flips lapsed assignments to `overdue` and fires the overdue notification. Lockout enforcement reuses the single existing `assertAssignment` gate in `learner.service.ts` that already fronts every lesson-access call. The frontend gets one shared `NotificationBell` component used in both staff and learner headers, plus a shared `NotificationsPage`.

**Tech Stack:** Node/Express/TypeScript, PostgreSQL (`node-pg-migrate`), MongoDB (Mongoose), React/Vite/TypeScript, TanStack Query, Zustand, Tailwind, `clsx`, `lucide-react`.

**Spec:** `docs/superpowers/specs/2026-09-24-notifications-and-due-date-lockout-design.md`

## Global Constraints

- In-app notifications only — no email/push (per spec's non-goals).
- No new job-scheduler dependency — the overdue sweep is a plain `setInterval` inside the existing Express process, matching the codebase's current lack of any queue/cron infra.
- Every notification query resolves through one shape: a doc is relevant to recipient `{id, role}` if `(audienceType === 'role' && audienceRole === role) || (audienceType === 'user' && audienceUserId === id)`, and unread if `id` is not in `readBy`.
- Reopening an overdue assignment reuses the existing repeat-assignment flow (`createAssignment` inserting a new row) — no due-date-edit endpoint is added, per the spec's explicit simplification.
- This codebase has no unit test runner set up for `src/` (jest is an unused devDependency) — every prior feature in this project was verified via `npm run typecheck`, `npm run build`, and live curl/UI checks against disposable `*@stagetest.example` accounts, cleaned up afterward. This plan follows that same convention rather than introducing a new jest suite mid-feature.
- Follow existing module conventions exactly: thin controller → service (business rules, permission checks) → repository (raw queries), one module folder per concern, `AppError(message, statusCode)` for all client-facing failures.

## Review Focus

- **A learner whose assignment is already `overdue` opens a lesson they'd bookmarked earlier** — `assertAssignment` must reject with 423 even though the learner never touches the sweep or notifications code directly; Task 6's manual check confirms this via a pre-seeded overdue assignment, not just a freshly-lapsed one.
- **The sweep runs twice before the notification is read** — `overdue_notified_at` must make the second sweep pass a no-op (no duplicate notification, no duplicate status flip attempt); Task 7 tests running the sweep function twice in a row.
- **HR sends a custom message to `'all'` learners while there are zero active learners, or to a `targetLearnerIds` array containing a non-learner or deactivated user id** — must not silently create a notification for the wrong audience or throw an unhandled error; Task 4's validation/service layer explicitly filters to active learners only and rejects an empty resulting audience.
- **A learner's unread badge count must never include another learner's `custom` notification** — since `audienceType: 'user'` notifications are exploded one-per-learner at creation, Task 4's repository query must filter by exact `audienceUserId` match, not by role; Task 4 manually verifies two learners each see only their own custom message.
- **Refreshing the page immediately after first login must not keep re-showing "Welcome to Holcim Academy!"** — `isFirstLogin` is only present on the raw `/auth/login` response, never `/auth/refresh`, so a page reload (which calls refresh, not login) naturally falls back to "Welcome back"; Task 8/14 manually verify login → reload shows the two different states.

---

## Task 1: Due-date lockout schema (Postgres migration + types)

**Files:**
- Create: `backend/migrations/014_assignment_overdue_tracking.js`
- Modify: `backend/src/modules/assignments/assignments.types.ts`

**Interfaces:**
- Produces: `AssignmentStatus = 'assigned' | 'in_progress' | 'completed' | 'overdue'` (used by Tasks 2, 6, 7).
- Produces: `course_assignments.overdue_notified_at` column (used by Task 7's sweep to guard against double-notifying).

- [ ] **Step 1: Write the migration**

```js
// backend/migrations/014_assignment_overdue_tracking.js
exports.shorthands = undefined;

// Adds the tracking needed to lock a learner out of an overdue assignment
// exactly once, and to notify HR/Admin/Super Admin exactly once per lapse.
// overdue_notified_at doubles as: (a) the idempotency guard for the
// notification sweep, and (b) a quick way to tell "flipped to overdue but
// nobody's re-assigned it yet" apart from a still-active assignment.
exports.up = (pgm) => {
  pgm.addColumn('course_assignments', {
    overdue_notified_at: { type: 'timestamptz' },
  });

  pgm.dropConstraint('course_assignments', 'course_assignments_status_check');
  pgm.addConstraint('course_assignments', 'course_assignments_status_check', {
    check: "status IN ('assigned', 'in_progress', 'completed', 'overdue')",
  });
};

exports.down = (pgm) => {
  pgm.dropConstraint('course_assignments', 'course_assignments_status_check');
  pgm.addConstraint('course_assignments', 'course_assignments_status_check', {
    check: "status IN ('assigned', 'in_progress', 'completed')",
  });
  pgm.dropColumn('course_assignments', 'overdue_notified_at');
};
```

- [ ] **Step 2: Run the migration**

Run: `cd backend && npm run migrate:up`
Expected: output lists `014_assignment_overdue_tracking` as run, no errors. If `dropConstraint` fails with "constraint does not exist", run `psql $DATABASE_URL -c "\d course_assignments"` to find the real auto-generated constraint name and substitute it in the migration before re-running.

- [ ] **Step 3: Update the TypeScript type**

In `backend/src/modules/assignments/assignments.types.ts`, change:

```ts
export type AssignmentStatus = 'assigned' | 'in_progress' | 'completed';
```

to:

```ts
export type AssignmentStatus = 'assigned' | 'in_progress' | 'completed' | 'overdue';
```

And add `overdue_notified_at: Date | null;` to the `AssignmentRecord` interface, right after `completed_at: Date | null;`.

- [ ] **Step 4: Typecheck**

Run: `cd backend && npm run typecheck`
Expected: PASS (no errors), since nothing yet references the new field or status value.

- [ ] **Step 5: Commit**

```bash
git add backend/migrations/014_assignment_overdue_tracking.js backend/src/modules/assignments/assignments.types.ts
git commit -m "feat: add overdue tracking column and status to course_assignments"
```

---

## Task 2: Notification data model (MongoDB)

**Files:**
- Create: `backend/src/modules/notifications/notification.model.ts`
- Create: `backend/src/modules/notifications/notifications.types.ts`

**Interfaces:**
- Consumes: none (new module).
- Produces: `NotificationModel` (Mongoose model, used by Task 3's repository), `NotificationDocument`, `NotificationCategory`, `NotificationAudienceType`, `NotificationDTO`, `RequesterContext` (used by Tasks 3, 4).

- [ ] **Step 1: Write the Mongoose model**

```ts
// backend/src/modules/notifications/notification.model.ts
import mongoose, { Schema, Document } from 'mongoose';

export type NotificationAudienceType = 'role' | 'user';
export type NotificationAudienceRole = 'hr' | 'admin' | 'super_admin';
export type NotificationCategory = 'course_published' | 'assignment_overdue' | 'custom';

export interface NotificationDocument extends Document {
  audienceType: NotificationAudienceType;
  audienceRole: NotificationAudienceRole | null;
  audienceUserId: string | null;
  category: NotificationCategory;
  title: string;
  message: string;
  createdBy: string | null;
  relatedCourseId: string | null;
  relatedUserId: string | null;
  readBy: string[];
  createdAt: Date;
}

const NotificationSchema = new Schema<NotificationDocument>(
  {
    audienceType: { type: String, enum: ['role', 'user'], required: true },
    audienceRole: { type: String, enum: ['hr', 'admin', 'super_admin'], default: null },
    audienceUserId: { type: String, default: null, index: true },
    category: { type: String, enum: ['course_published', 'assignment_overdue', 'custom'], required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    createdBy: { type: String, default: null },
    relatedCourseId: { type: String, default: null },
    relatedUserId: { type: String, default: null },
    readBy: { type: [String], default: [] },
    createdAt: { type: Date, default: Date.now },
  },
  { collection: 'notifications', minimize: false },
);

NotificationSchema.index({ audienceType: 1, audienceRole: 1, createdAt: -1 });
NotificationSchema.index({ audienceType: 1, audienceUserId: 1, createdAt: -1 });

export const NotificationModel =
  (mongoose.models.Notification as mongoose.Model<NotificationDocument>) ||
  mongoose.model<NotificationDocument>('Notification', NotificationSchema);
```

- [ ] **Step 2: Write the shared types**

```ts
// backend/src/modules/notifications/notifications.types.ts
import { NotificationCategory } from './notification.model';

export interface RequesterContext {
  id: string;
  role: string;
}

export interface NotificationDTO {
  id: string;
  category: NotificationCategory;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  relatedCourseId: string | null;
  relatedUserId: string | null;
}

export interface PaginatedNotificationsDTO {
  items: NotificationDTO[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface SendCustomMessageInput {
  title: string;
  message: string;
  targetLearnerIds: string[] | 'all';
}
```

- [ ] **Step 3: Typecheck**

Run: `cd backend && npm run typecheck`
Expected: PASS (both new files are self-contained and unused so far).

- [ ] **Step 4: Commit**

```bash
git add backend/src/modules/notifications/notification.model.ts backend/src/modules/notifications/notifications.types.ts
git commit -m "feat: add Notification Mongoose model and shared types"
```

---

## Task 3: Notification repository (MongoDB queries)

**Files:**
- Create: `backend/src/modules/notifications/notifications.mongo.repository.ts`

**Interfaces:**
- Consumes: `NotificationModel`, `NotificationDocument`, `NotificationAudienceRole`, `NotificationCategory` from Task 2's `notification.model.ts`; `RequesterContext` from `notifications.types.ts`.
- Produces: `createRoleNotification`, `createUserNotifications`, `findForRecipient`, `countUnreadForRecipient`, `markRead`, `markAllReadForRecipient` — all consumed by Task 4's service.

- [ ] **Step 1: Write the repository**

```ts
// backend/src/modules/notifications/notifications.mongo.repository.ts
import { NotificationModel, NotificationDocument, NotificationAudienceRole, NotificationCategory } from './notification.model';
import { RequesterContext } from './notifications.types';

function recipientFilter(recipient: RequesterContext) {
  return {
    $or: [
      { audienceType: 'role', audienceRole: recipient.role },
      { audienceType: 'user', audienceUserId: recipient.id },
    ],
  };
}

export async function createRoleNotification(input: {
  audienceRole: NotificationAudienceRole;
  category: NotificationCategory;
  title: string;
  message: string;
  createdBy?: string;
  relatedCourseId?: string;
  relatedUserId?: string;
}): Promise<void> {
  await NotificationModel.create({
    audienceType: 'role',
    audienceRole: input.audienceRole,
    category: input.category,
    title: input.title,
    message: input.message,
    createdBy: input.createdBy ?? null,
    relatedCourseId: input.relatedCourseId ?? null,
    relatedUserId: input.relatedUserId ?? null,
  });
}

export async function createRoleNotificationForRoles(
  roles: NotificationAudienceRole[],
  input: {
    category: NotificationCategory;
    title: string;
    message: string;
    createdBy?: string;
    relatedCourseId?: string;
    relatedUserId?: string;
  },
): Promise<void> {
  await Promise.all(roles.map((audienceRole) => createRoleNotification({ ...input, audienceRole })));
}

/** One document per targeted learner — keeps the unread/read-state query identical for every notification kind. */
export async function createUserNotifications(
  userIds: string[],
  input: { category: NotificationCategory; title: string; message: string; createdBy?: string },
): Promise<void> {
  if (userIds.length === 0) return;
  await NotificationModel.insertMany(
    userIds.map((audienceUserId) => ({
      audienceType: 'user',
      audienceUserId,
      category: input.category,
      title: input.title,
      message: input.message,
      createdBy: input.createdBy ?? null,
      relatedCourseId: null,
      relatedUserId: null,
    })),
  );
}

export async function findForRecipient(
  recipient: RequesterContext,
  page: number,
  pageSize: number,
): Promise<{ items: NotificationDocument[]; total: number }> {
  const filter = recipientFilter(recipient);
  const [items, total] = await Promise.all([
    NotificationModel.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .exec(),
    NotificationModel.countDocuments(filter).exec(),
  ]);
  return { items, total };
}

export async function countUnreadForRecipient(recipient: RequesterContext): Promise<number> {
  return NotificationModel.countDocuments({
    ...recipientFilter(recipient),
    readBy: { $ne: recipient.id },
  }).exec();
}

export async function markRead(notificationId: string, userId: string): Promise<void> {
  await NotificationModel.updateOne({ _id: notificationId }, { $addToSet: { readBy: userId } }).exec();
}

export async function markAllReadForRecipient(recipient: RequesterContext): Promise<void> {
  await NotificationModel.updateMany(recipientFilter(recipient), { $addToSet: { readBy: recipient.id } }).exec();
}
```

- [ ] **Step 2: Typecheck**

Run: `cd backend && npm run typecheck`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add backend/src/modules/notifications/notifications.mongo.repository.ts
git commit -m "feat: add notifications Mongo repository"
```

---

## Task 4: Notification service, controller, routes, validation + mount

**Files:**
- Create: `backend/src/modules/notifications/notifications.service.ts`
- Create: `backend/src/modules/notifications/notifications.controller.ts`
- Create: `backend/src/modules/notifications/notifications.routes.ts`
- Create: `backend/src/modules/notifications/notifications.validation.ts`
- Modify: `backend/src/modules/users/users.repository.ts`
- Modify: `backend/src/routes/index.ts`

**Interfaces:**
- Consumes: everything from Tasks 2 and 3; `AppError` from `backend/src/middleware/errorHandler.ts`; `requireAuth`, `requireRole` from `backend/src/middleware/auth.middleware.ts`; `validate` from `backend/src/middleware/validate.ts`.
- Produces: `notifyCoursePublished`, `notifyAssignmentOverdue` (consumed by Tasks 5 and 7), `notificationsRouter` (mounted in this task), `findActiveLearnerIds` on `users.repository.ts` (consumed only within this task, but exported for reuse).

- [ ] **Step 1: Add the active-learner lookup used by "send to all"**

In `backend/src/modules/users/users.repository.ts`, add this function near `listUsers`:

```ts
/** Every active learner's id — feeds "send this notification to all learners." */
export async function findActiveLearnerIds(): Promise<string[]> {
  const { rows } = await getPool().query<{ id: string }>(
    `SELECT u.id FROM users u JOIN roles r ON r.id = u.role_id WHERE r.name = 'learner' AND u.status = 'active'`,
  );
  return rows.map((r) => r.id);
}
```

- [ ] **Step 2: Write the service**

```ts
// backend/src/modules/notifications/notifications.service.ts
import { AppError } from '../../middleware/errorHandler';
import * as notificationsRepo from './notifications.mongo.repository';
import * as usersRepo from '../users/users.repository';
import { NotificationDocument, NotificationAudienceRole } from './notification.model';
import { RequesterContext, NotificationDTO, PaginatedNotificationsDTO, SendCustomMessageInput } from './notifications.types';

const STAFF_ROLES: NotificationAudienceRole[] = ['hr', 'admin', 'super_admin'];

function toDTO(doc: NotificationDocument, requesterId: string): NotificationDTO {
  return {
    id: doc.id,
    category: doc.category,
    title: doc.title,
    message: doc.message,
    isRead: doc.readBy.includes(requesterId),
    createdAt: doc.createdAt.toISOString(),
    relatedCourseId: doc.relatedCourseId,
    relatedUserId: doc.relatedUserId,
  };
}

export async function notifyCoursePublished(course: { id: string; name: string }, createdBy: string): Promise<void> {
  await notificationsRepo.createRoleNotificationForRoles(STAFF_ROLES, {
    category: 'course_published',
    title: 'New course published',
    message: `"${course.name}" is now live and available to assign.`,
    createdBy,
    relatedCourseId: course.id,
  });
}

export async function notifyAssignmentOverdue(input: {
  learnerId: string;
  learnerName: string;
  courseId: string;
  courseName: string;
}): Promise<void> {
  await notificationsRepo.createRoleNotificationForRoles(STAFF_ROLES, {
    category: 'assignment_overdue',
    title: 'Course assignment overdue',
    message: `${input.learnerName} did not complete "${input.courseName}" by its due date.`,
    relatedCourseId: input.courseId,
    relatedUserId: input.learnerId,
  });
}

export async function sendCustomMessage(
  requester: RequesterContext,
  input: SendCustomMessageInput,
): Promise<{ createdCount: number }> {
  if (!['admin', 'super_admin'].includes(requester.role)) {
    throw new AppError('Only Admin or Super Admin can send custom messages.', 403);
  }
  if (!input.title.trim() || !input.message.trim()) {
    throw new AppError('Title and message are required.', 400);
  }

  let targetIds: string[];
  if (input.targetLearnerIds === 'all') {
    targetIds = await usersRepo.findActiveLearnerIds();
  } else {
    const learners = await Promise.all(input.targetLearnerIds.map((id) => usersRepo.findUserById(id)));
    targetIds = learners
      .filter((u): u is NonNullable<typeof u> => u !== null && u.role_name === 'learner' && u.status === 'active')
      .map((u) => u.id);
  }

  if (targetIds.length === 0) {
    throw new AppError('No active learners matched this message\'s recipients.', 400);
  }

  await notificationsRepo.createUserNotifications(targetIds, {
    category: 'custom',
    title: input.title,
    message: input.message,
    createdBy: requester.id,
  });

  return { createdCount: targetIds.length };
}

export async function listForRequester(
  requester: RequesterContext,
  page: number,
  pageSize: number,
): Promise<PaginatedNotificationsDTO> {
  const { items, total } = await notificationsRepo.findForRecipient(requester, page, pageSize);
  return {
    items: items.map((doc) => toDTO(doc, requester.id)),
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function getUnreadCount(requester: RequesterContext): Promise<number> {
  return notificationsRepo.countUnreadForRecipient(requester);
}

export async function markRead(requester: RequesterContext, notificationId: string): Promise<void> {
  await notificationsRepo.markRead(notificationId, requester.id);
}

export async function markAllRead(requester: RequesterContext): Promise<void> {
  await notificationsRepo.markAllReadForRecipient(requester);
}
```

- [ ] **Step 3: Write validation**

```ts
// backend/src/modules/notifications/notifications.validation.ts
import { body, param, query } from 'express-validator';

export const notificationIdParamValidation = [
  param('id').isString().notEmpty().withMessage('A notification id is required.'),
];

export const listNotificationsValidation = [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('pageSize').optional().isInt({ min: 1, max: 100 }).toInt(),
];

export const sendCustomMessageValidation = [
  body('title').isString().trim().notEmpty().withMessage('Title is required.'),
  body('message').isString().trim().notEmpty().withMessage('Message is required.'),
  body('targetLearnerIds')
    .custom((value) => value === 'all' || (Array.isArray(value) && value.every((id) => typeof id === 'string')))
    .withMessage('targetLearnerIds must be "all" or an array of user ids.'),
];
```

- [ ] **Step 4: Write the controller**

```ts
// backend/src/modules/notifications/notifications.controller.ts
import { Request, Response, NextFunction } from 'express';
import * as notificationsService from './notifications.service';
import { RequesterContext } from './notifications.types';

function requesterFrom(req: Request): RequesterContext {
  return { id: req.user!.id, role: req.user!.role };
}

export async function listNotifications(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const page = Number(req.query.page) || 1;
    const pageSize = Number(req.query.pageSize) || 20;
    const result = await notificationsService.listForRequester(requesterFrom(req), page, pageSize);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

export async function getUnreadCount(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const count = await notificationsService.getUnreadCount(requesterFrom(req));
    res.json({ success: true, data: { count } });
  } catch (err) {
    next(err);
  }
}

export async function markRead(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await notificationsService.markRead(requesterFrom(req), req.params.id);
    res.json({ success: true, data: { message: 'Notification marked as read.' } });
  } catch (err) {
    next(err);
  }
}

export async function markAllRead(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await notificationsService.markAllRead(requesterFrom(req));
    res.json({ success: true, data: { message: 'All notifications marked as read.' } });
  } catch (err) {
    next(err);
  }
}

export async function sendCustomMessage(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await notificationsService.sendCustomMessage(requesterFrom(req), req.body);
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}
```

- [ ] **Step 5: Write the routes**

```ts
// backend/src/modules/notifications/notifications.routes.ts
import { Router } from 'express';
import * as controller from './notifications.controller';
import { notificationIdParamValidation, listNotificationsValidation, sendCustomMessageValidation } from './notifications.validation';
import { validate } from '../../middleware/validate';
import { requireAuth, requireRole } from '../../middleware/auth.middleware';

export const notificationsRouter = Router();

// Every authenticated role (including learner) can read/manage their own
// notifications — the query in notifications.mongo.repository.ts already
// scopes results to "this recipient", so no role restriction belongs here.
notificationsRouter.use(requireAuth);

notificationsRouter.get('/', listNotificationsValidation, validate, controller.listNotifications);
notificationsRouter.get('/unread-count', controller.getUnreadCount);
notificationsRouter.post('/read-all', controller.markAllRead);
notificationsRouter.post('/:id/read', notificationIdParamValidation, validate, controller.markRead);
notificationsRouter.post(
  '/custom',
  requireRole('admin', 'super_admin'),
  sendCustomMessageValidation,
  validate,
  controller.sendCustomMessage,
);
```

- [ ] **Step 6: Mount the router**

In `backend/src/routes/index.ts`, add the import:

```ts
import { notificationsRouter } from '../modules/notifications/notifications.routes';
```

And add this line after `apiRouter.use('/learner', learnerRouter);`:

```ts
apiRouter.use('/notifications', notificationsRouter);
```

- [ ] **Step 7: Typecheck**

Run: `cd backend && npm run typecheck`
Expected: PASS.

- [ ] **Step 8: Build**

Run: `cd backend && npm run build`
Expected: PASS.

- [ ] **Step 9: Manual verification — custom message + unread scoping**

Using disposable accounts (`@stagetest.example`, cleaned up after):
1. Create two learner accounts (`notif1@stagetest.example`, `notif2@stagetest.example`) and one admin account directly via SQL (`crypt()/gen_salt('bf',12)`), matching the existing project convention.
2. Log in as admin via `POST /api/v1/auth/login`, capture the access token.
3. `POST /api/v1/notifications/custom` with `{ "title": "Test", "message": "Hello", "targetLearnerIds": ["<notif1's id>"] }` — expect `201` and `{ createdCount: 1 }`.
4. Log in as `notif1`, `GET /api/v1/notifications` — expect the message present; `GET /api/v1/notifications/unread-count` — expect `1`.
5. Log in as `notif2`, repeat both calls — expect the message absent and unread count `0` (confirms per-user targeting isn't leaking).
6. As `notif1`, `POST /api/v1/notifications/<id>/read`, then re-check unread-count — expect `0`.
7. As a `hr` role account (create one), `POST /api/v1/notifications/custom` — expect `403`.
8. Clean up: delete both learner/admin/hr rows from Postgres and the notification documents from MongoDB's `notifications` collection.

- [ ] **Step 10: Commit**

```bash
git add backend/src/modules/notifications backend/src/modules/users/users.repository.ts backend/src/routes/index.ts
git commit -m "feat: add notifications service, routes, and custom-message endpoint"
```

---

## Task 5: Course-published notification trigger

**Files:**
- Modify: `backend/src/modules/courses/courses.service.ts`

**Interfaces:**
- Consumes: `notifyCoursePublished` from Task 4's `notifications.service.ts`.

- [ ] **Step 1: Add the import**

At the top of `backend/src/modules/courses/courses.service.ts`, add:

```ts
import * as notificationsService from '../notifications/notifications.service';
```

- [ ] **Step 2: Fire the notification after the status actually changes**

In `changeCourseStatus`, change:

```ts
  if (status === 'published') {
    await assertLessonsReadyForPublish(courseId);
  }

  await pgRepo.setCourseStatus(courseId, status);

  await writeAuditLog({
```

to:

```ts
  if (status === 'published') {
    await assertLessonsReadyForPublish(courseId);
  }

  await pgRepo.setCourseStatus(courseId, status);

  if (status === 'published') {
    await notificationsService.notifyCoursePublished({ id: course.id, name: course.name }, requester.id);
  }

  await writeAuditLog({
```

- [ ] **Step 3: Typecheck**

Run: `cd backend && npm run typecheck`
Expected: PASS.

- [ ] **Step 4: Manual verification**

Using a disposable content_creator account and a draft course with at least one ready lesson (matching this project's existing course-publish verification convention): call the existing publish endpoint (`PATCH` course status to `published`), then log in as an `hr`/`admin`/`super_admin` account and `GET /api/v1/notifications` — expect one `course_published` notification referencing that course. Clean up the course and test accounts afterward.

- [ ] **Step 5: Commit**

```bash
git add backend/src/modules/courses/courses.service.ts
git commit -m "feat: notify hr/admin/super_admin when a course is published"
```

---

## Task 6: Due-date lockout enforcement

**Files:**
- Modify: `backend/src/modules/learner/learner.service.ts`

**Interfaces:**
- Consumes: `AssignmentStatus` from Task 1 (the `assignment.status` field already returned by `learnerRepo.findLatestAssignmentForLearnerCourse`).
- Produces: `assertAssignment` now throws 423 for an `overdue` assignment — every caller (`startLesson`, `completeLesson`, lesson-content fetch, `submitBlockAttempt`) inherits this automatically since they all call it first.

- [ ] **Step 1: Add the overdue check**

In `backend/src/modules/learner/learner.service.ts`, change:

```ts
async function assertAssignment(userId: string, courseId: string) {
  const assignment = await learnerRepo.findLatestAssignmentForLearnerCourse(userId, courseId);
  if (!assignment) {
    throw new AppError('This course has not been assigned to you.', 403);
  }
  return assignment;
}
```

to:

```ts
async function assertAssignment(userId: string, courseId: string) {
  const assignment = await learnerRepo.findLatestAssignmentForLearnerCourse(userId, courseId);
  if (!assignment) {
    throw new AppError('This course has not been assigned to you.', 403);
  }
  if (assignment.status === 'overdue') {
    throw new AppError('This course is locked because its due date has passed. Contact HR to extend the deadline.', 423);
  }
  return assignment;
}
```

- [ ] **Step 2: Typecheck**

Run: `cd backend && npm run typecheck`
Expected: PASS.

- [ ] **Step 3: Manual verification**

Using a disposable learner + course + assignment: directly `UPDATE course_assignments SET status = 'overdue' WHERE id = '<id>'` in Postgres, then as that learner call the lesson-content-fetch endpoint (`GET /api/v1/learner/lessons/:lessonId` or equivalent used by `getLearnerLessonApi`) — expect `423` with the lockout message. Then reset `status` back to `'assigned'` and confirm the same call succeeds again. Clean up test rows afterward.

- [ ] **Step 4: Commit**

```bash
git add backend/src/modules/learner/learner.service.ts
git commit -m "feat: lock lesson access when an assignment is overdue"
```

---

## Task 7: Overdue sweep (flip status + fire notification)

**Files:**
- Modify: `backend/src/modules/assignments/assignments.postgres.repository.ts`
- Modify: `backend/src/modules/assignments/assignments.service.ts`
- Modify: `backend/src/server.ts`

**Interfaces:**
- Consumes: `notifyAssignmentOverdue` from Task 4; `usersRepo.findUserById`, `coursesRepo.findCourseById` (already imported in `assignments.service.ts`).
- Produces: `sweepOverdueAssignments()` (exported, independently callable — used by this task's manual test and by the interval below), `startOverdueSweepScheduler()` (called once from `server.ts`).

- [ ] **Step 1: Add repository functions**

In `backend/src/modules/assignments/assignments.postgres.repository.ts`, add:

```ts
/** Assignments whose due date has lapsed but haven't been flagged overdue yet. */
export async function findLapsedAssignments(): Promise<AssignmentRecord[]> {
  const { rows } = await getPool().query<AssignmentRecord>(
    `${ASSIGNMENT_SELECT}
     WHERE status IN ('assigned', 'in_progress')
       AND due_date < CURRENT_DATE
       AND overdue_notified_at IS NULL`,
  );
  return rows;
}

export async function markOverdueNotified(id: string): Promise<void> {
  await getPool().query(
    `UPDATE course_assignments SET status = 'overdue', overdue_notified_at = now() WHERE id = $1`,
    [id],
  );
}
```

- [ ] **Step 2: Add the sweep function to the service**

In `backend/src/modules/assignments/assignments.service.ts`, add the import:

```ts
import * as notificationsService from '../notifications/notifications.service';
```

And add this function (exported, near the bottom of the file):

```ts
/**
 * Flips lapsed assignments to 'overdue' and notifies hr/admin/super_admin,
 * exactly once per assignment (overdue_notified_at is the idempotency
 * guard). Exported standalone so it's callable directly for verification
 * without waiting on the interval in server.ts.
 */
export async function sweepOverdueAssignments(): Promise<number> {
  const lapsed = await assignmentsRepo.findLapsedAssignments();
  for (const assignment of lapsed) {
    await assignmentsRepo.markOverdueNotified(assignment.id);
    const [course, learner] = await Promise.all([
      coursesRepo.findCourseById(assignment.course_id),
      usersRepo.findUserById(assignment.assigned_to),
    ]);
    await notificationsService.notifyAssignmentOverdue({
      learnerId: assignment.assigned_to,
      learnerName: learner?.full_name ?? 'Unknown learner',
      courseId: assignment.course_id,
      courseName: course?.name ?? 'Unknown course',
    });
  }
  return lapsed.length;
}

let sweepInterval: NodeJS.Timeout | null = null;

/** Called once from server.ts after startup. Runs immediately (covers due dates that lapsed while the server was down), then every 15 minutes. */
export function startOverdueSweepScheduler(): void {
  if (sweepInterval) return;
  void sweepOverdueAssignments();
  sweepInterval = setInterval(() => {
    void sweepOverdueAssignments();
  }, 15 * 60 * 1000);
}
```

- [ ] **Step 3: Start the scheduler from server.ts**

In `backend/src/server.ts`, add the import:

```ts
import { startOverdueSweepScheduler } from './modules/assignments/assignments.service';
```

And call it right after the app starts listening, inside `bootstrap()`:

```ts
  const server = app.listen(env.port, () => {
    logger.info(`${env.appName} listening on port ${env.port} [${env.nodeEnv}]`);
  });

  startOverdueSweepScheduler();
```

- [ ] **Step 4: Typecheck**

Run: `cd backend && npm run typecheck`
Expected: PASS.

- [ ] **Step 5: Build**

Run: `cd backend && npm run build`
Expected: PASS.

- [ ] **Step 6: Manual verification — idempotency and end-to-end lock**

Using a disposable learner, course, and an assignment with `due_date` set to yesterday (insert directly via SQL so it starts already lapsed):
1. Confirm the assignment's `status` is `'assigned'` and `overdue_notified_at` is `NULL`.
2. In a Node REPL or a throwaway script requiring `ts-node`, import and call `sweepOverdueAssignments()` from `assignments.service.ts` directly (or restart the dev server and let the startup sweep run). Confirm it returns `1` (or however many lapsed rows exist).
3. Re-check the row: `status` is now `'overdue'`, `overdue_notified_at` is set.
4. Call `sweepOverdueAssignments()` a second time — confirm it returns `0` and no second notification document was created (check the `notifications` collection count before/after).
5. As that learner, confirm lesson access now returns `423` (this exercises Task 6's check against a sweep-produced overdue row, not just a manually-set one).
6. As an hr/admin/super_admin account, confirm exactly one `assignment_overdue` notification exists mentioning the learner and course by name.
7. Clean up all test rows/documents.

- [ ] **Step 7: Commit**

```bash
git add backend/src/modules/assignments/assignments.postgres.repository.ts backend/src/modules/assignments/assignments.service.ts backend/src/server.ts
git commit -m "feat: sweep lapsed assignments to overdue and notify staff"
```

---

## Task 8: First-login vs. welcome-back detection (backend)

**Files:**
- Modify: `backend/src/modules/auth/auth.service.ts`
- Modify: `backend/src/modules/auth/auth.controller.ts`

**Interfaces:**
- Produces: `AuthResult.isFirstLogin: boolean`, present in the `POST /auth/login` JSON response only (not `/auth/refresh`) — consumed by Task 9's frontend types.

- [ ] **Step 1: Extend `AuthResult` and compute the flag before it's overwritten**

In `backend/src/modules/auth/auth.service.ts`, change:

```ts
interface AuthResult {
  accessToken: string;
  refreshTokenValue: string;
  refreshTokenExpiresAt: Date;
  user: AuthenticatedUserDTO;
  permissions: string[];
}
```

to:

```ts
interface AuthResult {
  accessToken: string;
  refreshTokenValue: string;
  refreshTokenExpiresAt: Date;
  user: AuthenticatedUserDTO;
  permissions: string[];
  isFirstLogin: boolean;
}
```

Then in `login()`, capture the pre-update value — `user.last_login_at` is still the value from *before* `updateLastLogin` runs at this point in the function — and change:

```ts
  await clearFailedLogins(email);
  await authRepo.updateLastLogin(user.id);

  const session = await issueSession(user, ctx);
  const permissions = await getPermissionsForRole(user.role_name);

  await writeAuditLog({
    actorUserId: user.id,
    action: 'auth.login',
    ipAddress: ctx.ip,
    userAgent: ctx.userAgent,
  });

  return { ...session, user: toDTO(user), permissions };
```

to:

```ts
  const isFirstLogin = user.last_login_at === null;

  await clearFailedLogins(email);
  await authRepo.updateLastLogin(user.id);

  const session = await issueSession(user, ctx);
  const permissions = await getPermissionsForRole(user.role_name);

  await writeAuditLog({
    actorUserId: user.id,
    action: 'auth.login',
    ipAddress: ctx.ip,
    userAgent: ctx.userAgent,
  });

  return { ...session, user: toDTO(user), permissions, isFirstLogin };
```

Finally, in `refresh()`, find its `return { ...session, user: toDTO(user), permissions };` line (or equivalent) and add `isFirstLogin: false` to that returned object, since a refresh always means a session already existed.

- [ ] **Step 2: Include it in the login response payload**

In `backend/src/modules/auth/auth.controller.ts`'s `login` handler, change:

```ts
    res.json({
      success: true,
      data: { accessToken: result.accessToken, user: result.user, permissions: result.permissions },
    });
```

to:

```ts
    res.json({
      success: true,
      data: {
        accessToken: result.accessToken,
        user: result.user,
        permissions: result.permissions,
        isFirstLogin: result.isFirstLogin,
      },
    });
```

Leave the `refresh` handler's response shape unchanged — it can omit `isFirstLogin` entirely (the frontend type marks it optional in Task 9).

- [ ] **Step 3: Typecheck**

Run: `cd backend && npm run typecheck`
Expected: PASS.

- [ ] **Step 4: Manual verification**

Create a fresh disposable learner account (never logged in — `last_login_at` is `NULL` at creation per the existing user-creation flow). `POST /api/v1/auth/login` — expect `data.isFirstLogin: true`. Log in again with the same credentials — expect `data.isFirstLogin: false`. Clean up the account afterward.

- [ ] **Step 5: Commit**

```bash
git add backend/src/modules/auth/auth.service.ts backend/src/modules/auth/auth.controller.ts
git commit -m "feat: report isFirstLogin on the login response"
```

---

## Task 9: Frontend auth plumbing for isFirstLogin

**Files:**
- Modify: `frontend/src/types/auth.types.ts`
- Modify: `frontend/src/stores/authStore.ts`
- Modify: `frontend/src/hooks/useAuth.ts`

**Interfaces:**
- Consumes: `isFirstLogin` field from Task 8's login response.
- Produces: `useAuth().isFirstLogin: boolean` — consumed by Task 14's `LearnerDashboard.tsx`.

- [ ] **Step 1: Extend the response type**

In `frontend/src/types/auth.types.ts`, change:

```ts
export interface AuthResponseData {
  accessToken: string;
  user: AuthenticatedUser;
  permissions: string[];
}
```

to:

```ts
export interface AuthResponseData {
  accessToken: string;
  user: AuthenticatedUser;
  permissions: string[];
  isFirstLogin?: boolean;
}
```

- [ ] **Step 2: Store it**

In `frontend/src/stores/authStore.ts`, change:

```ts
interface AuthState {
  user: AuthenticatedUser | null;
  accessToken: string | null;
  permissions: string[];
  isAuthenticated: boolean;
  isInitializing: boolean;
  setAuth: (payload: { user: AuthenticatedUser; accessToken: string; permissions: string[] }) => void;
```

to:

```ts
interface AuthState {
  user: AuthenticatedUser | null;
  accessToken: string | null;
  permissions: string[];
  isAuthenticated: boolean;
  isInitializing: boolean;
  isFirstLogin: boolean;
  setAuth: (payload: { user: AuthenticatedUser; accessToken: string; permissions: string[]; isFirstLogin?: boolean }) => void;
```

And change the store body:

```ts
export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  permissions: [],
  isAuthenticated: false,
  isInitializing: true,

  setAuth: ({ user, accessToken, permissions }) =>
    set({
      user,
      accessToken,
      permissions,
      isAuthenticated: true,
      isInitializing: false,
    }),
```

to:

```ts
export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  permissions: [],
  isAuthenticated: false,
  isInitializing: true,
  isFirstLogin: false,

  setAuth: ({ user, accessToken, permissions, isFirstLogin }) =>
    set({
      user,
      accessToken,
      permissions,
      isAuthenticated: true,
      isInitializing: false,
      isFirstLogin: isFirstLogin ?? false,
    }),
```

Also add `isFirstLogin: false` to the object passed to `set()` inside `clearAuth`, right alongside its other reset fields.

- [ ] **Step 3: Expose it from the hook**

In `frontend/src/hooks/useAuth.ts`, add `isFirstLogin` to the destructured store values and to the returned object:

```ts
  const {
    user,
    accessToken,
    permissions,
    isAuthenticated,
    isInitializing,
    isFirstLogin,
    setAuth,
    clearAuth,
    updateUser,
  } = useAuthStore();
```

```ts
  return {
    user,
    accessToken,
    permissions,
    isAuthenticated,
    isInitializing,
    isFirstLogin,
    login,
    logout,
    hasRole,
    hasPermission,
    isStaff,
    isLearner,
    updateUser,
  };
```

- [ ] **Step 4: Typecheck**

Run: `cd frontend && npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/types/auth.types.ts frontend/src/stores/authStore.ts frontend/src/hooks/useAuth.ts
git commit -m "feat: thread isFirstLogin from login response into auth store"
```

---

## Task 10: Frontend notifications types + API service

**Files:**
- Create: `frontend/src/types/notifications.types.ts`
- Create: `frontend/src/services/notifications.service.ts`

**Interfaces:**
- Produces: `NotificationItem`, `PaginatedNotifications`, `SendCustomMessageInput` types; `listNotificationsApi`, `getUnreadCountApi`, `markNotificationReadApi`, `markAllNotificationsReadApi`, `sendCustomMessageApi` — consumed by Task 11's `NotificationBell` and Task 12's `NotificationsPage`.

- [ ] **Step 1: Write the types**

```ts
// frontend/src/types/notifications.types.ts
export type NotificationCategory = 'course_published' | 'assignment_overdue' | 'custom';

export interface NotificationItem {
  id: string;
  category: NotificationCategory;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  relatedCourseId: string | null;
  relatedUserId: string | null;
}

export interface PaginatedNotifications {
  items: NotificationItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface SendCustomMessageInput {
  title: string;
  message: string;
  targetLearnerIds: string[] | 'all';
}
```

- [ ] **Step 2: Write the service**

```ts
// frontend/src/services/notifications.service.ts
import { apiClient } from './apiClient';
import { ApiResponse } from '../types/auth.types';
import { NotificationItem, PaginatedNotifications, SendCustomMessageInput } from '../types/notifications.types';

const BASE = '/notifications';

function unwrap<T>(data: ApiResponse<T>, fallback: string): T {
  if (!data.success || !data.data) {
    throw new Error(data.error?.message || fallback);
  }
  return data.data;
}

export async function listNotificationsApi(page = 1, pageSize = 20): Promise<PaginatedNotifications> {
  const { data } = await apiClient.get<ApiResponse<PaginatedNotifications>>(BASE, { params: { page, pageSize } });
  return unwrap(data, 'Failed to fetch notifications');
}

export async function getUnreadCountApi(): Promise<number> {
  const { data } = await apiClient.get<ApiResponse<{ count: number }>>(`${BASE}/unread-count`);
  return unwrap(data, 'Failed to fetch unread count').count;
}

export async function markNotificationReadApi(id: string): Promise<void> {
  const { data } = await apiClient.post<ApiResponse<{ message: string }>>(`${BASE}/${id}/read`);
  unwrap(data, 'Failed to mark notification as read');
}

export async function markAllNotificationsReadApi(): Promise<void> {
  const { data } = await apiClient.post<ApiResponse<{ message: string }>>(`${BASE}/read-all`);
  unwrap(data, 'Failed to mark all notifications as read');
}

export async function sendCustomMessageApi(input: SendCustomMessageInput): Promise<{ createdCount: number }> {
  const { data } = await apiClient.post<ApiResponse<{ createdCount: number }>>(`${BASE}/custom`, input);
  return unwrap(data, 'Failed to send message');
}
```

- [ ] **Step 3: Typecheck**

Run: `cd frontend && npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/types/notifications.types.ts frontend/src/services/notifications.service.ts
git commit -m "feat: add frontend notifications types and API service"
```

---

## Task 11: Shared NotificationBell component + wire into both layouts

**Files:**
- Create: `frontend/src/components/shared/NotificationBell.tsx`
- Modify: `frontend/src/layouts/StaffLayout.tsx`
- Modify: `frontend/src/layouts/LearnerLayout.tsx`

**Interfaces:**
- Consumes: `listNotificationsApi`, `getUnreadCountApi`, `markNotificationReadApi`, `markAllNotificationsReadApi` from Task 10; `useAuth()` for role gating and navigation.
- Produces: `<NotificationBell notificationsPath="/staff/notifications" />` / `<NotificationBell notificationsPath="/learner/notifications" />` usage — the path is passed in since staff and learner mount the shared `NotificationsPage` (Task 12) under different route prefixes.

- [ ] **Step 1: Write the component**

```tsx
// frontend/src/components/shared/NotificationBell.tsx
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell } from 'lucide-react';
import clsx from 'clsx';
import {
  listNotificationsApi,
  getUnreadCountApi,
  markNotificationReadApi,
  markAllNotificationsReadApi,
} from '../../services/notifications.service';

function formatRelativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export const NotificationBell: React.FC<{ notificationsPath: string }> = ({ notificationsPath }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['notifications-unread-count'],
    queryFn: getUnreadCountApi,
    refetchInterval: 30_000,
  });

  const { data: list } = useQuery({
    queryKey: ['notifications-recent'],
    queryFn: () => listNotificationsApi(1, 5),
    enabled: isOpen,
  });

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function handleItemClick(id: string, isRead: boolean) {
    if (!isRead) {
      await markNotificationReadApi(id);
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-recent'] });
    }
  }

  async function handleMarkAllRead() {
    await markAllNotificationsReadApi();
    queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
    queryClient.invalidateQueries({ queryKey: ['notifications-recent'] });
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="relative rounded p-1.5 text-ink-muted hover:bg-surface hover:text-ink"
        title="Notifications"
      >
        <Bell className="h-4.5 w-4.5" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-status-danger px-1 text-[9px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full z-30 mt-2 w-80 rounded-lg border border-surface-border bg-surface-card shadow-card">
          <div className="flex items-center justify-between border-b border-surface-border px-3 py-2.5">
            <p className="text-xs font-bold text-ink">Notifications</p>
            <button onClick={handleMarkAllRead} className="text-[11px] font-semibold text-accent hover:text-accent-hover">
              Mark all read
            </button>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {!list || list.items.length === 0 ? (
              <p className="p-4 text-center text-[11px] text-ink-muted">No notifications yet.</p>
            ) : (
              list.items.map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleItemClick(n.id, n.isRead)}
                  className="flex w-full items-start gap-2 border-b border-surface-border px-3 py-2.5 text-left last:border-0 hover:bg-surface/60"
                >
                  <span
                    className={clsx('mt-1 h-1.5 w-1.5 shrink-0 rounded-full', n.isRead ? 'bg-transparent' : 'bg-accent')}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-ink">{n.title}</p>
                    <p className="line-clamp-2 text-[11px] text-ink-muted">{n.message}</p>
                    <p className="mt-0.5 text-[10px] text-ink-faint">{formatRelativeTime(n.createdAt)}</p>
                  </div>
                </button>
              ))
            )}
          </div>
          <button
            onClick={() => {
              setIsOpen(false);
              navigate(notificationsPath);
            }}
            className="w-full border-t border-surface-border py-2 text-center text-[11px] font-semibold text-accent hover:text-accent-hover"
          >
            View all
          </button>
        </div>
      )}
    </div>
  );
};
```

- [ ] **Step 2: Wire into StaffLayout**

In `frontend/src/layouts/StaffLayout.tsx`, add the import:

```ts
import { NotificationBell } from '../components/shared/NotificationBell';
```

Then restrict it to hr/admin/super_admin. Add this line right after the existing `const isHr = user?.role === 'hr';`:

```ts
  const canSeeNotifications = ['hr', 'admin', 'super_admin'].includes(user?.role ?? '');
```

And change the header's button container:

```tsx
          <div className="flex items-center gap-3">
            <ThemeToggle variant="light-chrome" />
            <button
              onClick={() => navigate('/learner/dashboard')}
              className="rounded border border-surface-border px-3 py-1.5 text-xs font-medium text-ink-muted hover:border-ink hover:text-ink"
            >
              Switch to Learner View
            </button>
          </div>
```

to:

```tsx
          <div className="flex items-center gap-3">
            {canSeeNotifications && <NotificationBell notificationsPath="/staff/notifications" />}
            <ThemeToggle variant="light-chrome" />
            <button
              onClick={() => navigate('/learner/dashboard')}
              className="rounded border border-surface-border px-3 py-1.5 text-xs font-medium text-ink-muted hover:border-ink hover:text-ink"
            >
              Switch to Learner View
            </button>
          </div>
```

- [ ] **Step 3: Wire into LearnerLayout**

In `frontend/src/layouts/LearnerLayout.tsx`, add the import:

```ts
import { NotificationBell } from '../components/shared/NotificationBell';
```

And change:

```tsx
            <ThemeToggle variant="light-chrome" />

            {/* User pill */}
```

to:

```tsx
            <NotificationBell notificationsPath="/learner/notifications" />

            <ThemeToggle variant="light-chrome" />

            {/* User pill */}
```

- [ ] **Step 4: Typecheck**

Run: `cd frontend && npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 5: Build**

Run: `cd frontend && npm run build`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/components/shared/NotificationBell.tsx frontend/src/layouts/StaffLayout.tsx frontend/src/layouts/LearnerLayout.tsx
git commit -m "feat: add shared NotificationBell to staff and learner headers"
```

---

## Task 12: Shared NotificationsPage (+ compose modal) and routes

**Files:**
- Create: `frontend/src/pages/shared/NotificationsPage.tsx`
- Modify: `frontend/src/App.tsx`

**Interfaces:**
- Consumes: `listNotificationsApi`, `markNotificationReadApi`, `markAllNotificationsReadApi`, `sendCustomMessageApi` from Task 10; `listUsersApi` from `frontend/src/services/users.service.ts` (existing, filtered to `role: 'learner'`) for the recipient picker.
- Produces: routes `/staff/notifications` and `/learner/notifications`.

- [ ] **Step 1: Confirm the existing users-list API shape**

Run: `grep -n "listUsersApi" frontend/src/services/users.service.ts`
Expected: a function `listUsersApi(params: UserListParams): Promise<PaginatedUsersResponse>` (per `frontend/src/types/auth.types.ts`'s existing `UserListParams`/`PaginatedUsersResponse`). This task's compose picker calls it with `{ role: 'learner', status: 'active', pageSize: 100 }`.

- [ ] **Step 2: Write the page**

```tsx
// frontend/src/pages/shared/NotificationsPage.tsx
import React, { useState } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { Bell, X } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { listNotificationsApi, markNotificationReadApi, markAllNotificationsReadApi, sendCustomMessageApi } from '../../services/notifications.service';
import { listUsersApi } from '../../services/users.service';
import clsx from 'clsx';

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export const NotificationsPage: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [isComposing, setIsComposing] = useState(false);

  const canCompose = user?.role === 'admin' || user?.role === 'super_admin';

  const { data, isLoading } = useQuery({
    queryKey: ['notifications-page', page],
    queryFn: () => listNotificationsApi(page, 20),
  });

  const markReadMutation = useMutation({
    mutationFn: markNotificationReadApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications-page'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: markAllNotificationsReadApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications-page'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-ink">Notifications</h1>
          <p className="mt-1 text-xs text-ink-muted">Course and assignment updates relevant to your role.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => markAllReadMutation.mutate()}
            className="rounded border border-surface-border px-3 py-1.5 text-xs font-medium text-ink-muted hover:border-ink hover:text-ink"
          >
            Mark all read
          </button>
          {canCompose && (
            <button
              onClick={() => setIsComposing(true)}
              className="rounded-md bg-accent px-4 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-accent-hover"
            >
              Compose Message
            </button>
          )}
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-surface-border bg-surface-card shadow-card">
        {isLoading ? (
          <div className="p-10 text-center text-xs text-ink-muted">Loading notifications...</div>
        ) : !data || data.items.length === 0 ? (
          <div className="p-12 text-center">
            <Bell className="mx-auto h-8 w-8 text-ink-faint" />
            <h3 className="mt-3 text-sm font-bold text-ink">No notifications yet</h3>
          </div>
        ) : (
          <ul className="divide-y divide-surface-border">
            {data.items.map((n) => (
              <li
                key={n.id}
                onClick={() => !n.isRead && markReadMutation.mutate(n.id)}
                className={clsx('cursor-pointer px-5 py-4 hover:bg-surface/50', !n.isRead && 'bg-accent/5')}
              >
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-ink">{n.title}</p>
                  <span className="text-[11px] text-ink-faint">{formatDateTime(n.createdAt)}</span>
                </div>
                <p className="mt-1 text-xs text-ink-muted">{n.message}</p>
              </li>
            ))}
          </ul>
        )}
      </div>

      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="rounded border border-surface-border px-3 py-1 text-xs disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-xs text-ink-muted">
            Page {data.page} of {data.totalPages}
          </span>
          <button
            disabled={page >= data.totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="rounded border border-surface-border px-3 py-1 text-xs disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}

      {isComposing && <ComposeMessageModal onClose={() => setIsComposing(false)} />}
    </div>
  );
};

const ComposeMessageModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [sendToAll, setSendToAll] = useState(true);
  const [selectedLearnerIds, setSelectedLearnerIds] = useState<string[]>([]);

  const { data: learners } = useQuery({
    queryKey: ['learners-for-compose'],
    queryFn: () => listUsersApi({ role: 'learner', status: 'active', pageSize: 100 }),
  });

  const sendMutation = useMutation({
    mutationFn: () =>
      sendCustomMessageApi({
        title,
        message,
        targetLearnerIds: sendToAll ? 'all' : selectedLearnerIds,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications-page'] });
      onClose();
    },
  });

  function toggleLearner(id: string) {
    setSelectedLearnerIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-charcoal/50 p-4">
      <div className="w-full max-w-md rounded-lg bg-surface-card p-5 shadow-card">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-ink">Compose Message</h2>
          <button onClick={onClose} className="text-ink-muted hover:text-ink">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 space-y-3">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
            className="w-full rounded border border-surface-border bg-surface px-3 py-2 text-xs text-ink"
          />
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Message"
            rows={4}
            className="w-full rounded border border-surface-border bg-surface px-3 py-2 text-xs text-ink"
          />

          <label className="flex items-center gap-2 text-xs text-ink">
            <input type="checkbox" checked={sendToAll} onChange={(e) => setSendToAll(e.target.checked)} />
            Send to all learners
          </label>

          {!sendToAll && (
            <div className="max-h-40 overflow-y-auto rounded border border-surface-border p-2">
              {(learners?.items ?? []).map((l) => (
                <label key={l.id} className="flex items-center gap-2 py-1 text-xs text-ink">
                  <input
                    type="checkbox"
                    checked={selectedLearnerIds.includes(l.id)}
                    onChange={() => toggleLearner(l.id)}
                  />
                  {l.fullName} <span className="text-ink-faint">({l.email})</span>
                </label>
              ))}
            </div>
          )}
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} className="rounded border border-surface-border px-3 py-1.5 text-xs text-ink-muted">
            Cancel
          </button>
          <button
            disabled={!title.trim() || !message.trim() || (!sendToAll && selectedLearnerIds.length === 0) || sendMutation.isPending}
            onClick={() => sendMutation.mutate()}
            className="rounded-md bg-accent px-4 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
          >
            {sendMutation.isPending ? 'Sending...' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  );
};
```

- [ ] **Step 3: Add routes**

In `frontend/src/App.tsx`, add the lazy import alongside the other page imports:

```ts
const NotificationsPage = lazyImport(() => import('./pages/shared/NotificationsPage'), 'NotificationsPage');
```

Add this route inside the `/learner` route block, after `<Route path="lessons/:lessonId" element={<LessonPlayerPage />} />`:

```tsx
              <Route path="notifications" element={<NotificationsPage />} />
```

Add this route inside the `/staff` route block, after the Assignments route:

```tsx
              <Route
                path="notifications"
                element={
                  <ProtectedRoute allowedRoles={['hr', 'admin', 'super_admin']} redirectToLoginPath="/staff/login">
                    <NotificationsPage />
                  </ProtectedRoute>
                }
              />
```

- [ ] **Step 4: Typecheck**

Run: `cd frontend && npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 5: Build**

Run: `cd frontend && npm run build`
Expected: PASS.

- [ ] **Step 6: Manual verification**

Log in as admin, navigate to `/staff/notifications`, click "Compose Message", send a message to "all learners". Log in as a disposable learner, navigate to `/learner/notifications`, confirm the message appears and clicking it marks it read (bell badge count drops). Confirm the "Compose Message" button is absent for an `hr` account. Clean up test accounts/messages afterward.

- [ ] **Step 7: Commit**

```bash
git add frontend/src/pages/shared/NotificationsPage.tsx frontend/src/App.tsx
git commit -m "feat: add shared NotificationsPage with admin/super_admin compose modal"
```

---

## Task 13: Locked-course UI for learners

**Files:**
- Modify: `frontend/src/pages/learner/CourseOverviewPage.tsx`
- Modify: `frontend/src/pages/learner/LessonPlayerPage.tsx`

**Interfaces:**
- Consumes: axios error responses from `getLearnerCourseApi` / `getLearnerLessonApi` (existing) — a 423 status from Task 6's backend change.

- [ ] **Step 1: Add locked-state handling to CourseOverviewPage**

In `frontend/src/pages/learner/CourseOverviewPage.tsx`, add the import:

```ts
import axios from 'axios';
```

Change:

```ts
  const { data: course, isLoading } = useQuery({
    queryKey: ['learner-course', courseId],
    queryFn: () => getLearnerCourseApi(courseId!),
    enabled: Boolean(courseId),
  });

  if (isLoading || !course) {
    return <p className="text-xs text-ink-faint">Loading course...</p>;
  }
```

to:

```ts
  const { data: course, isLoading, error } = useQuery({
    queryKey: ['learner-course', courseId],
    queryFn: () => getLearnerCourseApi(courseId!),
    enabled: Boolean(courseId),
    retry: false,
  });

  if (axios.isAxiosError(error) && error.response?.status === 423) {
    return (
      <div className="rounded-lg border border-status-warning/30 bg-status-warningSubtle p-6 text-center">
        <p className="text-sm font-bold text-status-warning">This course is locked</p>
        <p className="mt-1 text-xs text-ink-muted">
          {(error.response.data as { error?: { message?: string } })?.error?.message ||
            'Its due date has passed. Contact HR to extend your deadline.'}
        </p>
        <Link to="/learner/courses" className="mt-3 inline-block text-xs font-semibold text-accent hover:text-accent-hover">
          Back to My Courses
        </Link>
      </div>
    );
  }

  if (isLoading || !course) {
    return <p className="text-xs text-ink-faint">Loading course...</p>;
  }
```

- [ ] **Step 2: Add the same handling to LessonPlayerPage**

In `frontend/src/pages/learner/LessonPlayerPage.tsx`, add the import (if not already present — check first with `grep -n "^import axios" frontend/src/pages/learner/LessonPlayerPage.tsx`):

```ts
import axios from 'axios';
```

Change:

```ts
  const { data: lesson, isLoading } = useQuery({
    queryKey: ['learner-lesson', lessonId],
    queryFn: () => getLearnerLessonApi(lessonId!),
    enabled: Boolean(lessonId),
  });
```

to:

```ts
  const { data: lesson, isLoading, error: lessonError } = useQuery({
    queryKey: ['learner-lesson', lessonId],
    queryFn: () => getLearnerLessonApi(lessonId!),
    enabled: Boolean(lessonId),
    retry: false,
  });
```

Find where the component returns its loading state (look for `if (isLoading || !lesson)` or similar near the top of the returned JSX) and add this check immediately before it:

```tsx
  if (axios.isAxiosError(lessonError) && lessonError.response?.status === 423) {
    return (
      <div className="mx-auto max-w-lg rounded-lg border border-status-warning/30 bg-status-warningSubtle p-6 text-center">
        <p className="text-sm font-bold text-status-warning">This course is locked</p>
        <p className="mt-1 text-xs text-ink-muted">
          {(lessonError.response.data as { error?: { message?: string } })?.error?.message ||
            'Its due date has passed. Contact HR to extend your deadline.'}
        </p>
        <button
          onClick={() => navigate('/learner/courses')}
          className="mt-3 text-xs font-semibold text-accent hover:text-accent-hover"
        >
          Back to My Courses
        </button>
      </div>
    );
  }
```

(Confirm `navigate` is already in scope from `useNavigate()` at the top of the component — it is, per the existing `ChevronLeft`/back-navigation code already in this file.)

- [ ] **Step 3: Typecheck**

Run: `cd frontend && npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 4: Build**

Run: `cd frontend && npm run build`
Expected: PASS.

- [ ] **Step 5: Manual verification**

Using the overdue assignment from Task 6/7's verification (or a fresh one set to `overdue` directly via SQL): as that learner, navigate to `/learner/courses/:courseId` and `/learner/lessons/:lessonId` in the browser — confirm both show the locked-state message instead of a blank page or unhandled error. Clean up test rows afterward.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/pages/learner/CourseOverviewPage.tsx frontend/src/pages/learner/LessonPlayerPage.tsx
git commit -m "feat: show a locked-course state when a course assignment is overdue"
```

---

## Task 14: Welcome / welcome-back copy on the learner dashboard

**Files:**
- Modify: `frontend/src/pages/learner/LearnerDashboard.tsx`

**Interfaces:**
- Consumes: `isFirstLogin` from `useAuth()` (Task 9).

- [ ] **Step 1: Make the banner copy conditional**

In `frontend/src/pages/learner/LearnerDashboard.tsx`, change:

```ts
  const { user } = useAuth();
```

to:

```ts
  const { user, isFirstLogin } = useAuth();
```

And change:

```tsx
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-ink">
              Welcome back, {user?.fullName}!
            </h1>
```

to:

```tsx
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-ink">
              {isFirstLogin ? 'Welcome to Holcim Academy!' : `Welcome back, ${user?.fullName}!`}
            </h1>
```

- [ ] **Step 2: Typecheck**

Run: `cd frontend && npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 3: Build**

Run: `cd frontend && npm run build`
Expected: PASS.

- [ ] **Step 4: Manual verification**

Create a brand-new disposable learner account and log in for the first time in the browser — confirm the dashboard banner reads "Welcome to Holcim Academy!". Reload the page (triggers `/auth/refresh`, not `/auth/login`) — confirm it now reads "Welcome back, {name}!". Log out and log back in — confirm it also reads "Welcome back" (not the first-login copy again). Clean up the account afterward.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/pages/learner/LearnerDashboard.tsx
git commit -m "feat: show first-login welcome copy vs. welcome-back on the learner dashboard"
```

---

## Task 15: Full end-to-end verification pass

**Files:** none (verification only).

**Interfaces:** none.

- [ ] **Step 1: Full typecheck and build, both sides**

Run: `cd backend && npm run typecheck && npm run build`
Expected: PASS.

Run: `cd frontend && npx tsc --noEmit && npm run build`
Expected: PASS.

- [ ] **Step 2: Lint**

Run: `cd backend && npm run lint`
Expected: PASS (or only pre-existing warnings unrelated to this feature's files).

- [ ] **Step 3: End-to-end manual walkthrough with disposable accounts**

Using fresh `*@stagetest.example` accounts (one content_creator, one hr, one admin, one super_admin, two learners) created directly via SQL per this project's established convention, and cleaned up (Postgres rows + Mongo `notifications` and any test `quiz_attempts`/`course_assignments` documents/rows) at the end:

1. content_creator publishes a course → hr/admin/super_admin each see a `course_published` notification.
2. hr assigns that course to learner A with a due date of yesterday.
3. Restart the backend (or wait for the 15-minute interval, or call `sweepOverdueAssignments()` directly) → learner A's assignment flips to `overdue`; hr/admin/super_admin each get one `assignment_overdue` notification; a second sweep run does not duplicate it.
4. Learner A tries to open the course/a lesson → sees the locked-course UI (423).
5. hr re-assigns the same course to learner A with a due date in the future → learner A can access it again immediately (no separate "reopen" action needed).
6. admin sends a custom message to learner B only → learner B sees it in their bell/notifications page; learner A does not.
7. hr attempts `POST /notifications/custom` → rejected with 403.
8. Learner B logs in for the very first time → sees "Welcome to Holcim Academy!"; reloads → sees "Welcome back".
9. Delete all test Postgres rows (`users`, `course_assignments`, `courses` if created for this run), all Mongo documents created during this pass (`notifications`, any `quiz_attempts`), and confirm via direct DB queries that only pre-existing real data remains.

- [ ] **Step 4: Report results**

No commit for this task — it's verification-only. Summarize pass/fail for each of the 9 steps above to the user.
