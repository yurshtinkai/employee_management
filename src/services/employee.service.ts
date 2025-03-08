import { Repository } from 'typeorm';
import { AppDataSource } from '../database/db';
import { Employee } from '../entities/employee.entity';
import { Department } from '../entities/department.entity';
import { Like } from 'typeorm';
import { Project } from '../entities/project.entity'; 

export class EmployeeService {
    private employeeRepository: Repository<Employee>;
    private departmentRepository: Repository<Department>;

    constructor() {
        this.employeeRepository = AppDataSource.getRepository(Employee);
        this.departmentRepository = AppDataSource.getRepository(Department);
        this.projectRepository = AppDataSource.getRepository(Project)
    }

    async getAllWithPagination(page: number = 1, limit: number = 10) {
        try {
            const [employees, total] = await this.employeeRepository.findAndCount({
                where: { isActive: true },
                relations: ['department'],
                skip: (page - 1) * limit,
                take: limit,
                order: {
                    id: 'ASC'
                }
            });

            // Format the response to exactly match the example
            return employees.map(employee => ({
                id: employee.id,
                name: employee.name,
                position: employee.position,
                department: {
                    id: employee.department?.id,
                    name: employee.department?.name
                }
            }));

        } catch (error) {
            console.error('Error fetching employees:', error);
            throw error;
        }
    }
    async updateSalary(id: number, salary: number) {
        // Find the employee
        const employee = await this.employeeRepository.findOne({
            where: { id },
            relations: ['department']
        });

        if (!employee) {
            throw new Error('Employee not found');
        }

        // Update salary
        employee.salary = salary;
        
        // Save changes
        await this.employeeRepository.save(employee);

        // Return formatted response
        return {
            id: employee.id,
            name: employee.name,
            position: employee.position,
            salary: employee.salary,
            department: {
                id: employee.department?.id,
                name: employee.department?.name
            }
        };
    }

    async softDelete(id: number) {
        // Find the employee
        const employee = await this.employeeRepository.findOne({
            where: { id },
            relations: ['department']
        });

        if (!employee) {
            throw new Error('Employee not found');
        }

        // Set isActive to false (soft delete)
        employee.isActive = false;
        
        // Save the changes
        await this.employeeRepository.save(employee);

        // Return formatted response
        return {
            id: employee.id,
            name: employee.name,
            position: employee.position,
            department: {
                id: employee.department?.id,
                name: employee.department?.name
            },
            isActive: employee.isActive
        };
    }

    // Update getAllWithPagination to only return active employees
    async getAllWithPagination(page: number = 1, limit: number = 10) {
        const [employees, total] = await this.employeeRepository.findAndCount({
            where: { isActive: true }, // Only get active employees
            relations: ['department'],
            skip: (page - 1) * limit,
            take: limit
        });

        return employees.map(employee => ({
            id: employee.id,
            name: employee.name,
            position: employee.position,
            department: {
                id: employee.department?.id,
                name: employee.department?.name
            }
        }));
    }


    async create(employeeData: {
        name: string;
        position: string;
        departmentId: number;
        hireDate: string;
    }) {
        try {
            const department = await this.departmentRepository.findOne({
                where: { id: parseInt(employeeData.departmentId.toString()) }
            });

            if (!department) {
                throw new Error('Department not found');
            }

            const employee = this.employeeRepository.create({
                name: employeeData.name,
                position: employeeData.position,
                department: department,
                hireDate: new Date(employeeData.hireDate),
                isActive: true
            });

            const savedEmployee = await this.employeeRepository.save(employee);

            return {
                id: savedEmployee.id,
                name: savedEmployee.name,
                position: savedEmployee.position,
                department: {
                    id: department.id,
                    name: department.name
                },
                hireDate: savedEmployee.hireDate
            };
        } catch (error) {
            console.error('Error in create service:', error);
            throw error;
        }
    }


    async searchByName(name: string) {
        try {
            console.log('Searching for employees with name:', name);
            
            const employees = await this.employeeRepository.find({
                where: {
                    name: Like(`%${name}%`),  // Case-sensitive search
                    isActive: true  // Only search active employees
                },
                relations: ['department'],
                order: {
                    name: 'ASC'  // Sort results alphabetically
                }
            });
    
            console.log(`Found ${employees.length} employees`);
    
            // Format response to match the example
            return employees.map(employee => ({
                id: employee.id,
                name: employee.name,
                position: employee.position,
                department: {
                    id: employee.department?.id,
                    name: employee.department?.name
                }
            }));
        } catch (error) {
            console.error('Error searching employees:', error);
            throw error;
        }
    }

    async assignToProject(employeeId: number, projectId: number) {
        try {
            // Find the employee
            const employee = await this.employeeRepository.findOne({
                where: { id: employeeId },
                relations: ['projects', 'department']
            });

            if (!employee) {
                throw new Error('Employee not found');
            }

            // Find the project
            const project = await this.projectRepository.findOne({
                where: { id: projectId }
            });

            if (!project) {
                throw new Error('Project not found');
            }

            // Initialize projects array if it doesn't exist
            if (!employee.projects) {
                employee.projects = [];
            }

            // Check if the employee is already assigned to the project
            const isAlreadyAssigned = employee.projects.some(p => p.id === projectId);
            if (isAlreadyAssigned) {
                throw new Error('Employee is already assigned to this project');
            }

            // Add project to employee's projects
            employee.projects.push(project);

            // Save the updated employee
            await this.employeeRepository.save(employee);

            // Return formatted response
            return {
                id: employee.id,
                name: employee.name,
                position: employee.position,
                department: {
                    id: employee.department?.id,
                    name: employee.department?.name
                },
                projects: employee.projects.map(p => ({
                    id: p.id,
                    name: p.name
                }))
            };
        } catch (error) {
            console.error('Error assigning project:', error);
            throw error;
        }
    }
}
    // ... other methods ...
