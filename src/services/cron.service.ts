import * as cron from 'node-cron';
import { EmployeeService } from './employee.service';

export class CronService {
    private employeeService: EmployeeService;

    constructor() {
        this.employeeService = new EmployeeService();
    }

    startJobs() {
        cron.schedule('0 0 * * *', async () => {
            console.log('Running automatic employee deactivation check...');
            try {
                const result = await this.employeeService.deactivateInactiveEmployees();
                console.log(`Deactivated ${result.deactivatedCount} inactive employees`);
            } catch (error) {
                console.error('Error in automatic deactivation:', error);
            }
        });
    }
}