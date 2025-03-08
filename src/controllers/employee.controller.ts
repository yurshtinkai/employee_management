import { Router } from 'express';
import { EmployeeService } from '../services/employee.service';

const router = Router();
const employeeService = new EmployeeService();

employeeService.assignToProject(1, 2) // Assign Employee ID 1 to Project ID 2
    .then(result => console.log('Assignment successful:', result))
    .catch(error => console.error('Error:', error.message));
    
// Create new employee
router.get('/', async (req, res, next) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;

        const employees = await employeeService.getAllWithPagination(page, limit);
        // Return array directly to match the example
        res.json(employees);
    } catch (err) {
        console.error('Error in get employees:', err);
        next(err);
    }
});
router.post('/', async (req, res, next) => {
    try {
        const { name, position, departmentId, hireDate } = req.body;

        if (!name || !position || !departmentId || !hireDate) {
            return res.status(400).json({
                status: 'error',
                message: 'Missing required fields'
            });
        }

        const newEmployee = await employeeService.create({
            name,
            position,
            departmentId,
            hireDate
        });

        res.status(201).json({
            status: 'success',
            message: 'Employee created successfully',
            data: newEmployee
        });
    } catch (error) {
        if (error.message === 'Department not found') {
            return res.status(404).json({
                status: 'error',
                message: 'Department not found'
            });
        }
        
        console.error('Error creating employee:', error);
        res.status(500).json({
            status: 'error',
            message: 'Error creating employee'
        });
    }
});

router.put('/:id/salary', async (req, res, next) => {
    try {
        const employeeId = parseInt(req.params.id);
        const { salary } = req.body;

        // Validate salary
        if (salary === undefined || salary < 0) {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid salary value'
            });
        }

        const updatedEmployee = await employeeService.updateSalary(employeeId, salary);
        
        res.json({
            status: 'success',
            message: 'Salary updated successfully',
            data: updatedEmployee
        });
    } catch (err) {
        if (err.message === 'Employee not found') {
            return res.status(404).json({
                status: 'error',
                message: 'Employee not found'
            });
        }
        next(err);
    }
});

router.delete('/:id', async (req, res, next) => {
    try {
        const employeeId = parseInt(req.params.id);
        
        const result = await employeeService.softDelete(employeeId);
        
        res.json({
            status: 'success',
            message: 'Employee deactivated successfully',
            data: result
        });
    } catch (err) {
        if (err.message === 'Employee not found') {
            return res.status(404).json({
                status: 'error',
                message: 'Employee not found'
            });
        }
        next(err);
    }
});

router.get('/search', async (req, res, next) => {
    try {
        const name = req.query.name as string;
        
        if (!name) {
            return res.status(400).json({
                status: 'error',
                message: 'Name parameter is required'
            });
        }

        console.log('Searching for name:', name);
        const employees = await employeeService.searchByName(name);
        
        res.json(employees);
    } catch (err) {
        console.error('Search error:', err);
        next(err);
    }
});

router.post('/:id/projects', async (req, res, next) => {
    try {
        const employeeId = parseInt(req.params.id);
        const { projectId } = req.body;

        if (!projectId) {
            return res.status(400).json({
                status: 'error',
                message: 'Project ID is required'
            });
        }

        const result = await employeeService.assignToProject(employeeId, projectId);
        
        res.status(200).json({
            status: 'success',
            message: 'Employee assigned to project successfully',
            data: result
        });
    } catch (error) {
        if (error.message === 'Employee not found') {
            return res.status(404).json({
                status: 'error',
                message: 'Employee not found'
            });
        }
        if (error.message === 'Project not found') {
            return res.status(404).json({
                status: 'error',
                message: 'Project not found'
            });
        }
        next(error);
    }
});






export default router;