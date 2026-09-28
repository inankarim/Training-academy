import { Request, Response, NextFunction } from 'express';
import * as learnerService from './learner.service';
import * as learnerProfileService from './learnerProfile.service';
import { uploadAvatar } from '../../middleware/upload';
import { AppError } from '../../middleware/errorHandler';
import { RequesterContext } from './learner.types';

function clientContext(req: Request) {
  return { ip: req.ip, userAgent: req.headers['user-agent'] };
}

function requesterFrom(req: Request): RequesterContext {
  return { id: req.user!.id, role: req.user!.role };
}

export async function listMyCourses(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const courses = await learnerService.listMyCourses(requesterFrom(req));
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

export async function getFinalQuiz(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const finalQuiz = await learnerService.getFinalQuizForLearner(requesterFrom(req), req.params.courseId);
    res.json({ success: true, data: { finalQuiz } });
  } catch (err) {
    next(err);
  }
}

export async function submitFinalQuizAttempt(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await learnerService.submitFinalQuizAttempt(
      requesterFrom(req),
      req.params.courseId,
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

export async function getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const profile = await learnerProfileService.getLearnerProfile(requesterFrom(req));
    res.json({ success: true, data: { profile } });
  } catch (err) {
    next(err);
  }
}

export function uploadProfilePhoto(req: Request, res: Response, next: NextFunction): void {
  uploadAvatar.single('file')(req, res, async (err: unknown) => {
    if (err) {
      // multer surfaces both "file too large" and our fileFilter's error here.
      next(new AppError(err instanceof Error ? err.message : 'Photo upload failed.', 400));
      return;
    }
    if (!req.file) {
      next(new AppError('No photo was uploaded.', 400));
      return;
    }
    try {
      const avatarUrl = await learnerProfileService.setProfilePhoto(
        requesterFrom(req),
        req.file,
        `${req.protocol}://${req.get('host')}`,
        clientContext(req),
      );
      res.json({ success: true, data: { avatarUrl } });
    } catch (serviceErr) {
      next(serviceErr);
    }
  });
}
