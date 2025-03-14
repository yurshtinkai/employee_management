import { Repository, Like, MoreThan } from 'typeorm';
import { AppDataSource } from '../database/db';
import { Employee } from '../entities/employee.entity';
import { Department } from '../entities/department.entity';
import { Project } from '../entities/project.entity';
import { parse } from 'csv-parse';
import fs from 'fs';

export class EmployeeService {
    private employeeRepository: Repository<Employee> = AppDataSource.getRepository(Employee);
    private departmentRepository: Repository<Department> = AppDataSource.getRepository(Department);
    private projectRepository: Repository<Project> = AppDataSource.getRepository(Project);

    async getAll(page: number = 1, limit: number = 10) {
        return this.employeeRepository.find({
            relations: ['department', 'projects'],
            skip: (page - 1) * limit,
            take: limit,
            where: { isActive: true }
        });
    }

    async searchByName(name: string) {
        return this.employeeRepository.find({
            where: {
                name: Like(`%${name}%`),
                isActive: true
            },
            relations: ['department']
        });
    }


    // async getById(){
    //     return this.employeeRepository.find({
    //      where: {id},
    //      relations:["department"]
    //     })
    // }
    async updateSalary(id: number, salary: number) {
        const employee = await this.getById(id);
        if (!employee) throw new Error('Employee not found');
        
        employee.salary = salary;
        return this.employeeRepository.save(employee);
    }

    async calculateTenure(id: number) {
        const employee = await this.getById(id);
        if (!employee) throw new Error('Employee not found');

        const hireDate = new Date(employee.hireDate);
        const today = new Date();
        const tenure = today.getFullYear() - hireDate.getFullYear();

        return { years: tenure };
    }

    async assignToProject(employeeId: number, projectId: number) {
        const employee = await this.employeeRepository.findOne({
            where: { id: employeeId },
            relations: ['projects']
        });
        if (!employee) throw new Error('Employee not found');

        const project = await this.projectRepository.findOne({
            where: { id: projectId }
        });
        if (!project) throw new Error('Project not found');

        employee.projects = [...employee.projects, project];
        return this.employeeRepository.save(employee);
    }

    async transferDepartment(employeeId: number, newDepartmentId: number) {
        const department = await this.departmentRepository.findOne({
            where: { id: newDepartmentId }
        });
        if (!department) throw new Error('Department not found');

        const employee = await this.getById(employeeId);
        if (!employee) throw new Error('Employee not found');

        employee.department = department;
        employee.departmentId = newDepartmentId;
        return this.employeeRepository.save(employee);
    }

    async bulkImport(filePath: string) {
        const results = [];
        const parser = fs.createReadStream(filePath).pipe(parse({
            columns: true,
            skip_empty_lines: true
        }));

        for await (const record of parser) {
            const employee = this.employeeRepository.create({
                name: record.name,
                position: record.position,
                departmentId: parseInt(record.departmentId),
                hireDate: new Date(record.hireDate)
            });
            results.push(await this.employeeRepository.save(employee));
        }
        return results;
    }

    async deactivateInactiveEmployees() {
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const inactiveEmployees = await this.employeeRepository.find({
            where: {
                lastActivityDate: MoreThan(sixMonthsAgo),
                isActive: true
            }
        });

        for (const employee of inactiveEmployees) {
            employee.isActive = false;
            await this.employeeRepository.save(employee);
        }

        return inactiveEmployees;
    }
}
