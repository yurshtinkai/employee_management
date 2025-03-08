import 'reflect-metadata';
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';
import { DataSource } from 'typeorm';
import { Employee } from '../entities/employee.entity';
import { Department } from '../entities/department.entity';
import { Project } from '../entities/project.entity';

dotenv.config();

const dbName = process.env.DB_NAME || 'employee_department_db';

async function createDatabase() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            port: Number(process.env.DB_PORT || 3306),
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASS || ''
        });

        await connection.query(`CREATE DATABASE IF NOT EXISTS ${dbName}`);
        console.log(`Database ${dbName} created or verified.`);
        await connection.end();
    } catch (error) {
        console.error('Error creating database:', error);
        throw error;
    }
}

export const AppDataSource = new DataSource({
    type: 'mysql',
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: dbName,
    entities: [Employee, Department, Project],
    synchronize: true,
    logging: true
});

export const initializeDatabase = async () => {
    try {
        await createDatabase();
        await AppDataSource.initialize();
        console.log('Database connection initialized');
    } catch (error) {
        console.error('Database initialization error:', error);
        throw error;
    }
};