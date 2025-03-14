import cron from 'node-cron';
import { EmployeeService } from '../services/employee.service';

export function setupScheduledTasks() {
    const employeeService = new EmployeeService();

    // Run at midnight every day
    cron.schedule('0 0 * * *', async () => {
        try {
            console.log('Running scheduled employee deactivation...');
            const deactivatedCount = await employeeService.deactivateInactiveEmployees();
            console.log(`Deactivated ${deactivatedCount} inactive employees`);
        } catch (error) {
            console.error('Error in scheduled deactivation:', error);
        }
    });
}