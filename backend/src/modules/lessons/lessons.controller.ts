import { Request, Response, NextFunction } from 'express';
import * as lessonsService from './lessons.service';
import { RequesterContext } from './lessons.types';

function clientContext(req: Request) {
  return { ip: req.ip, userAgent: req.headers['user-agent'] };
}

function requesterFrom(req: Request): RequesterContext {
  return { id: req.user!.id, role: req.user!.role };
}

// --- Modules ---

export async function createModule(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const courseModule = await lessonsService.createModule(
      requesterFrom(req),
      req.params.courseId,
      req.body,
      clientContext(req),
    );
    res.status(201).json({ success: true, data: { module: courseModule } });
  } catch (err) {
    next(err);
  }
}

export async function listModules(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const modules = await lessonsService.listModules(requesterFrom(req), req.params.courseId, clientContext(req));
    res.json({ success: true, data: { modules } });
  } catch (err) {
    next(err);
  }
}

export async function updateModule(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const courseModule = await lessonsService.updateModule(
      requesterFrom(req),
      req.params.courseId,
      req.params.moduleId,
      req.body,
      clientContext(req),
    );
    res.json({ success: true, data: { module: courseModule } });
  } catch (err) {
    next(err);
  }
}

export async function deleteModule(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await lessonsService.deleteModule(requesterFrom(req), req.params.courseId, req.params.moduleId, clientContext(req));
    res.json({ success: true, data: { message: 'Module deleted.' } });
  } catch (err) {
    next(err);
  }
}

export async function reorderModules(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await lessonsService.reorderModules(requesterFrom(req), req.params.courseId, req.body.moduleIds, clientContext(req));
    res.json({ success: true, data: { message: 'Module order updated.' } });
  } catch (err) {
    next(err);
  }
}

// --- Lessons ---

export async function createLesson(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const lesson = await lessonsService.createLesson(
      requesterFrom(req),
      req.params.courseId,
      req.params.moduleId,
      req.body,
      clientContext(req),
    );
    res.status(201).json({ success: true, data: { lesson } });
  } catch (err) {
    next(err);
  }
}

export async function getLesson(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const lesson = await lessonsService.getLessonDetail(requesterFrom(req), req.params.lessonId, clientContext(req));
    res.json({ success: true, data: { lesson } });
  } catch (err) {
    next(err);
  }
}

export async function updateLesson(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const lesson = await lessonsService.updateLesson(
      requesterFrom(req),
      req.params.lessonId,
      req.body,
      clientContext(req),
    );
    res.json({ success: true, data: { lesson } });
  } catch (err) {
    next(err);
  }
}

export async function deleteLesson(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await lessonsService.deleteLesson(requesterFrom(req), req.params.lessonId, clientContext(req));
    res.json({ success: true, data: { message: 'Lesson deleted.' } });
  } catch (err) {
    next(err);
  }
}

export async function reorderLessons(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await lessonsService.reorderLessons(
      requesterFrom(req),
      req.params.courseId,
      req.params.moduleId,
      req.body.lessonIds,
      clientContext(req),
    );
    res.json({ success: true, data: { message: 'Lesson order updated.' } });
  } catch (err) {
    next(err);
  }
}

// --- Blocks ---

export async function addBlock(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const blocks = await lessonsService.addBlock(requesterFrom(req), req.params.lessonId, req.body, clientContext(req));
    res.status(201).json({ success: true, data: { blocks } });
  } catch (err) {
    next(err);
  }
}

export async function updateBlock(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const blocks = await lessonsService.updateBlock(
      requesterFrom(req),
      req.params.lessonId,
      req.params.blockId,
      req.body,
      clientContext(req),
    );
    res.json({ success: true, data: { blocks } });
  } catch (err) {
    next(err);
  }
}

export async function deleteBlock(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const blocks = await lessonsService.deleteBlock(
      requesterFrom(req),
      req.params.lessonId,
      req.params.blockId,
      clientContext(req),
    );
    res.json({ success: true, data: { blocks } });
  } catch (err) {
    next(err);
  }
}

export async function reorderBlocks(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const blocks = await lessonsService.reorderBlocks(
      requesterFrom(req),
      req.params.lessonId,
      req.body.blockIds,
      clientContext(req),
    );
    res.json({ success: true, data: { blocks } });
  } catch (err) {
    next(err);
  }
}

// --- Metadata ---

export function getBlockTypes(_req: Request, res: Response): void {
  res.json({ success: true, data: { blockTypes: lessonsService.getBlockTypeCatalog() } });
}
