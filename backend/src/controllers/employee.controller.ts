import { NextFunction, Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';
import { EmployeeService } from '../services/employee.service';
import { EmployeeDepartment } from '../utils/employeeCalculator';

export class EmployeeController {
  private readonly employeeService = new EmployeeService();

  getDashboard = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const query = {
        page: Number(req.query.page ?? 1),
        limit: Number(req.query.limit ?? 15),
        department: req.query.department as EmployeeDepartment | undefined,
        status: req.query.status as string | undefined,
        businessId: req.query.businessId ? Number(req.query.businessId) : undefined,
        search: req.query.search as string | undefined,
      };
      const data = await this.employeeService.getDashboard(req.user!.playerId, query);
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  getCandidates = (_req: AuthenticatedRequest, res: Response): void => {
    const candidates = this.employeeService.generateRecruitmentPool();
    res.status(200).json({ success: true, data: candidates });
  };

  hire = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const employeeId = await this.employeeService.hireEmployee(req.user!.playerId, req.body);
      res.status(201).json({ success: true, data: { employeeId } });
    } catch (error) {
      next(error);
    }
  };

  assign = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.employeeService.assignEmployee(
        req.user!.playerId,
        Number(req.params.employeeId),
        Number(req.body.businessId),
        req.body.department
      );
      res.status(200).json({ success: true, data: { assigned: true } });
    } catch (error) {
      next(error);
    }
  };

  train = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.employeeService.trainEmployee(req.user!.playerId, Number(req.params.employeeId));
      res.status(200).json({ success: true, data: { trained: true } });
    } catch (error) {
      next(error);
    }
  };

  promote = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.employeeService.promoteEmployee(req.user!.playerId, Number(req.params.employeeId));
      res.status(200).json({ success: true, data: { promoted: true } });
    } catch (error) {
      next(error);
    }
  };

  updateSalary = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      await this.employeeService.updateSalary(
        req.user!.playerId,
        Number(req.params.employeeId),
        Number(req.body.hourlyWage)
      );
      res.status(200).json({ success: true, data: { updated: true } });
    } catch (error) {
      next(error);
    }
  };

  fire = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.employeeService.fireEmployee(req.user!.playerId, Number(req.params.employeeId));
      res.status(200).json({ success: true, data: { terminated: true } });
    } catch (error) {
      next(error);
    }
  };

  runPayroll = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const result = await this.employeeService.runPayroll(req.user!.playerId);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  };
}
