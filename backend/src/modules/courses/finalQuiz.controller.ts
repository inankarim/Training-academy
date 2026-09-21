import { Request, Response, NextFunction } from 'express';
import * as finalQuizService from './finalQuiz.service';
import { RequesterContext } from './courses.types';

function clientContext(req: Request) {
  return { ip: req.ip, userAgent: req.headers['user-agent'] };
}

function requesterFrom(req: Request): RequesterContext {
  return { id: req.user!.id, role: req.user!.role };
}

export async function getFinalQuiz(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const finalQuiz = await finalQuizService.getFinalQuiz(requesterFrom(req), req.params.courseId, clientContext(req));
    res.json({ success: true, data: { finalQuiz } });
  } catch (err) {
    next(err);
  }
}

export async function updateFinalQuizConfig(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const finalQuiz = await finalQuizService.updateFinalQuizConfig(
      requesterFrom(req),
      req.params.courseId,
      req.body,
      clientContext(req),
    );
    res.json({ success: true, data: { finalQuiz } });
  } catch (err) {
    next(err);
  }
}

export async function addQuestion(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const questions = await finalQuizService.addFinalQuizQuestion(
      requesterFrom(req),
      req.params.courseId,
      req.body,
      clientContext(req),
    );
    res.status(201).json({ success: true, data: { questions } });
  } catch (err) {
    next(err);
  }
}

export async function updateQuestion(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const questions = await finalQuizService.updateFinalQuizQuestion(
      requesterFrom(req),
      req.params.courseId,
      req.params.questionId,
      req.body,
      clientContext(req),
    );
    res.json({ success: true, data: { questions } });
  } catch (err) {
    next(err);
  }
}

export async function deleteQuestion(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const questions = await finalQuizService.deleteFinalQuizQuestion(
      requesterFrom(req),
      req.params.courseId,
      req.params.questionId,
      clientContext(req),
    );
    res.json({ success: true, data: { questions } });
  } catch (err) {
    next(err);
  }
}

export async function reorderQuestions(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const questions = await finalQuizService.reorderFinalQuizQuestions(
      requesterFrom(req),
      req.params.courseId,
      req.body.questionIds,
      clientContext(req),
    );
    res.json({ success: true, data: { questions } });
  } catch (err) {
    next(err);
  }
}
