import { Request, Response, NextFunction } from 'express';
import * as assignmentsService from './assignments.service';
import { RequesterContext } from './assignments.types';

function clientContext(req: Request) {
  return { ip: req.ip, userAgent: req.headers['user-agent'] };
}

function requesterFrom(req: Request): RequesterContext {
  return { id: req.user!.id, role: req.user!.role };
}

export async function createAssignment(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const assignment = await assignmentsService.createAssignment(requesterFrom(req), req.body, clientContext(req));
    res.status(201).json({ success: true, data: { assignment } });
  } catch (err) {
    next(err);
  }
}

export async function listAssignableCourses(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const courses = await assignmentsService.listAssignableCourses();
    res.json({ success: true, data: { courses } });
  } catch (err) {
    next(err);
  }
}

export async function listAssignments(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const assignments = await assignmentsService.listAssignments({
      courseId: req.query.courseId as string | undefined,
      userId: req.query.userId as string | undefined,
      status: req.query.status as 'assigned' | 'in_progress' | 'completed' | undefined,
    });
    res.json({ success: true, data: { assignments } });
  } catch (err) {
    next(err);
  }
}

export async function getAssignment(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const assignment = await assignmentsService.getAssignment(req.params.assignmentId);
    res.json({ success: true, data: { assignment } });
  } catch (err) {
    next(err);
  }
}

export async function deleteAssignment(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await assignmentsService.deleteAssignment(requesterFrom(req), req.params.assignmentId, clientContext(req));
    res.json({ success: true, data: { message: 'Assignment removed.' } });
  } catch (err) {
    next(err);
  }
}
