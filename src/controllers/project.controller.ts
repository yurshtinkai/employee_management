import { Request, Response, NextFunction, Router } from "express";
import { ProjectService } from '../services/project.service';

const router = Router();
const projectService = new ProjectService();

const asyncHandler = (fn: Function) =>
    (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };

router.post('/', asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { name } = req.body;

        if (!name) {
            return res.status(400).json({
                status: 'error',
                message: 'Project name is required'
            });
        }

        const newProject = await projectService.create({ name });

        res.status(201).json({
            status: 'success',
            message: 'Project created successfully',
            data: newProject
        });
    } catch (error) {
        console.error('Error creating project:', error);
        next(error);
    }
}));

export default router;