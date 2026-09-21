import { Request, Response, NextFunction } from 'express';
import * as usersService from './users.service';

function clientContext(req: Request) {
  return { ip: req.ip, userAgent: req.headers['user-agent'] };
}

function requesterFrom(req: Request) {
  return { id: req.user!.id, role: req.user!.role, permissions: req.user!.permissions! };
}

export async function createUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await usersService.createUser(requesterFrom(req), req.body, clientContext(req));
    res.status(201).json({
      success: true,
      data: {
        user: result.user,
        tempPassword: result.tempPassword,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function listUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const page = typeof req.query.page === 'string' ? parseInt(req.query.page, 10) || 1 : 1;
    const pageSize = typeof req.query.pageSize === 'string' ? parseInt(req.query.pageSize, 10) || 20 : 20;

    const result = await usersService.listUsers(
      requesterFrom(req),
      {
        role: req.query.role as string | undefined,
        status: req.query.status as 'active' | 'deactivated' | undefined,
        departmentId: req.query.departmentId as string | undefined,
        regionId: req.query.regionId as string | undefined,
        areaId: req.query.areaId as string | undefined,
        territoryId: req.query.territoryId as string | undefined,
        salesRole: req.query.salesRole as string | undefined,
        employeeType: req.query.employeeType as string | undefined,
        designation: req.query.designation as string | undefined,
        search: req.query.search as string | undefined,
      },
      { page, pageSize },
    );

    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

export async function getUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await usersService.getUserDetail(requesterFrom(req), req.params.id);
    res.json({ success: true, data: { user } });
  } catch (err) {
    next(err);
  }
}

export async function updateUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await usersService.updateUser(requesterFrom(req), req.params.id, req.body, clientContext(req));
    const user = await usersService.getUserDetail(requesterFrom(req), req.params.id);
    res.json({ success: true, data: { user } });
  } catch (err) {
    next(err);
  }
}

export async function deactivateUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await usersService.deactivateUser(requesterFrom(req), req.params.id, clientContext(req));
    res.json({ success: true, data: { message: 'User deactivated.' } });
  } catch (err) {
    next(err);
  }
}

export async function reactivateUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await usersService.reactivateUser(requesterFrom(req), req.params.id, clientContext(req));
    res.json({ success: true, data: { message: 'User reactivated.' } });
  } catch (err) {
    next(err);
  }
}

export async function getOrganizationalMetadata(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const meta = await usersService.getOrganizationalMetadata();
    res.json({ success: true, data: meta });
  } catch (err) {
    next(err);
  }
}
