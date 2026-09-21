import { Request, Response, NextFunction } from 'express';
import * as learnerService from './learner.service';
import { RequesterContext } from './learner.types';

function clientContext(req: Request) {
  return { ip: req.ip, userAgent: req.headers['user-agent'] };
}

function requesterFrom(req: Request): RequesterContext {
  return { id: req.user!.id, role: req.user!.role };
}

export async function listLearningPaths(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const learningPaths = await learnerService.listLearningPaths(requesterFrom(req));
    res.json({ success: true, data: { learningPaths } });
  } catch (err) {
    next(err);
  }
}

export async function listCoursesInPath(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const courses = await learnerService.listCoursesInPath(requesterFrom(req), req.params.learningPath);
    res.json({ success: true, data: { courses } });
  } catch (err) {
    next(err);
  }
}

export async function getCourse(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const course = await learnerService.getCourseForLearner(requesterFrom(req), req.params.courseId);
    res.json({ success: true, data: { course } });
  } catch (err) {
    next(err);
  }
}

export async function getLesson(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const lesson = await learnerService.getLessonForLearner(requesterFrom(req), req.params.lessonId);
    res.json({ success: true, data: { lesson } });
  } catch (err) {
    next(err);
  }
}

export async function completeLesson(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await learnerService.completeLesson(requesterFrom(req), req.params.lessonId, clientContext(req));
    res.json({ success: true, data: { message: 'Lesson marked complete.' } });
  } catch (err) {
    next(err);
  }
}

export async function submitBlockAttempt(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await learnerService.submitBlockAttempt(
      requesterFrom(req),
      req.params.lessonId,
      req.params.blockId,
      req.body,
      clientContext(req),
    );
    res.json({ success: true, data: { result } });
  } catch (err) {
    next(err);
  }
}

export async function getDashboard(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const dashboard = await learnerService.getDashboard(requesterFrom(req));
    res.json({ success: true, data: { dashboard } });
  } catch (err) {
    next(err);
  }
}
