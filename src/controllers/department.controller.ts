import { Request, Response, NextFunction, Router } from "express";
import { DepartmentService } from '../services/department.service';

const router = Router();
const departmentService = new DepartmentService();

const asyncHandler = (fn: Function) =>
    (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };

router.post('/',asyncHandler (async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { name } = req.body;
        
        if (!name) {
            return res.status(400).json({
                status: 'error',
                message: 'Department name is required'
            });
        }

        const newDepartment = await departmentService.create({ name });
        
        res.status(201).json({
            status: 'success',
            message: 'Department created successfully',
            data: newDepartment
        });
    } catch (err) {
        next(err);
    }
}));

export default router;