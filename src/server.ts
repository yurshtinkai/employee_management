import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import { initializeDatabase } from './database/db';
import employeeRouter from './controllers/employee.controller';
import { CronService } from './services/cron.service';
import departmentRouter from './controllers/department.controller';

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());


// Error handling middleware
const errorHandler = (err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error(err.stack);
    res.status(500).json({
        status: 'error',
        message: err.message || 'Internal Server Error'
    });
};

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date() });
});

// API routes - make sure this matches your Postman request URL
app.use('/api/employees', employeeRouter);
app.use('/api/departments', departmentRouter); // 


// Error handling middleware should be last
app.use(errorHandler);

const port = process.env.PORT || 4000;

// Initialize database and start server
const cronService = new CronService();

initializeDatabase()
    .then(() => {
        app.listen(port, () => {
            console.log(`Server running at http://localhost:${port}`);
            console.log(`Test the API at http://localhost:${port}/api/employees`);
            
            // Start cron jobs
            cronService.startJobs();
            console.log('Cron jobs initialized');
        });
    })
    .catch(error => {
        console.error('Server startup error:', error);
        process.exit(1);
    });