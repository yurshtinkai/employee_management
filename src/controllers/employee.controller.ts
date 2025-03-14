import multer from 'multer';
import csv from 'csv-parser';
import { Router } from 'express';
import { EmployeeService } from '../services/employee.service';
import { Readable } from 'stream';

const router = Router();
const employeeService = new EmployeeService();
const upload = multer({ storage: multer.memoryStorage() });

employeeService.assignToProject(1, 2) 
    .then(result => console.log('Assignment successful:', result))
    .catch(error => console.error('Error:', error.message));
    
    
router.get('/', async (req, res, next) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;

        const employees = await employeeService.getAllWithPagination(page, limit);
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
        if (error.message === 'Employee is already assigned to this project') {
            return res.status(400).json({
                status: 'error',
                message: 'Employee is already assigned to this project'
            });
        }
        next(error);
    }
});

router.get('/:id/tenure', async (req, res, next) => {
    try {
        const employeeId = parseInt(req.params.id);
        
        const tenureReport = await employeeService.calculateTenure(employeeId);
        
        res.json(tenureReport);
    } catch (error) {
        if (error.message === 'Employee not found') {
            return res.status(404).json({
                status: 'error',
                message: 'Employee not found'
            });
        }
        next(error);
    }
});

// Add this new route
router.put('/:id/transfer', async (req, res, next) => {
    try {
        const employeeId = parseInt(req.params.id);
        const { departmentId } = req.body;

        if (!departmentId) {
            return res.status(400).json({
                status: 'error',
                message: 'Department ID is required'
            });
        }

        const updatedEmployee = await employeeService.transferDepartment(employeeId, departmentId);
        
        res.json({
            status: 'success',
            message: 'Employee transferred successfully',
            data: updatedEmployee
        });
    } catch (error) {
        if (error.message === 'Employee not found') {
            return res.status(404).json({
                status: 'error',
                message: 'Employee not found'
            });
        }
        if (error.message === 'Department not found') {
            return res.status(404).json({
                status: 'error',
                message: 'Department not found'
            });
        }
        next(error);
    }
});

router.post('/bulk', upload.single('file'), async (req, res, next) => {
    try {
        // Validate file exists
        if (!req.file) {
            return res.status(400).json({
                status: 'error',
                message: 'No file uploaded'
            });
        }

        // Validate file type
        if (!req.file.originalname.endsWith('.csv')) {
            return res.status(400).json({
                status: 'error',
                message: 'Only CSV files are allowed'
            });
        }

        const results: any[] = [];
        const fileBuffer = req.file.buffer;
        const stream = Readable.from(fileBuffer.toString());

        // Parse CSV file
        await new Promise((resolve, reject) => {
            stream
                .pipe(csv({
                    mapValues: ({ header, value }) => value.trim()
                }))
                .on('data', (data) => {
                    // Validate required fields
                    if (!data.name || !data.position || !data.departmentId || !data.hireDate) {
                        reject(new Error('Missing required fields'));
                    }
                    results.push(data);
                })
                .on('end', resolve)
                .on('error', reject);
        });

        // Process and validate the data
        const importedEmployees = await employeeService.bulkCreate(results);

        res.status(201).json({
            status: 'success',
            message: `Successfully imported ${importedEmployees.length} employees`,
            data: importedEmployees
        });

    } catch (error) {
        console.error('Error in bulk import:', error);
        res.status(400).json({
            status: 'error',
            message: error.message || 'Error processing file'
        });
    }
});


// Add this new route
router.post('/deactivate-inactive', async (req, res, next) => {
    try {
        const deactivatedCount = await employeeService.deactivateInactiveEmployees();
        
        res.json({
            status: 'success',
            message: `Deactivated ${deactivatedCount} inactive employees`,
            data: {
                deactivatedCount
            }
        });
    } catch (error) {
        console.error('Error deactivating employees:', error);
        next(error);
    }
});

export default router;