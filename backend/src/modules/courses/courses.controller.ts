import { Request, Response, NextFunction } from 'express';
import * as coursesService from './courses.service';
import { RequesterContext } from './courses.types';

function clientContext(req: Request) {
  return { ip: req.ip, userAgent: req.headers['user-agent'] };
}

function requesterFrom(req: Request): RequesterContext {
  return { id: req.user!.id, role: req.user!.role };
}

export async function createCourse(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const course = await coursesService.createCourse(requesterFrom(req), req.body, clientContext(req));
    res.status(201).json({ success: true, data: { course } });
  } catch (err) {
    next(err);
  }
}

export async function listCourses(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await coursesService.listCoursesForCreator(requesterFrom(req));
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

export async function getCourse(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const course = await coursesService.getCourseDetail(requesterFrom(req), req.params.courseId, clientContext(req));
    res.json({ success: true, data: { course } });
  } catch (err) {
    next(err);
  }
}

export async function updateCourse(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const course = await coursesService.updateCourse(
      requesterFrom(req),
      req.params.courseId,
      req.body,
      clientContext(req),
    );
    res.json({ success: true, data: { course } });
  } catch (err) {
    next(err);
  }
}

export async function archiveCourse(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await coursesService.archiveCourse(requesterFrom(req), req.params.courseId, clientContext(req));
    res.json({ success: true, data: { message: 'Course archived.' } });
  } catch (err) {
    next(err);
  }
}

export async function changeStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const course = await coursesService.changeCourseStatus(
      requesterFrom(req),
      req.params.courseId,
      req.body.status,
      clientContext(req),
    );
    res.json({ success: true, data: { course } });
  } catch (err) {
    next(err);
  }
}
