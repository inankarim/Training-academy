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
