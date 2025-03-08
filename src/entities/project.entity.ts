import { Entity, PrimaryGeneratedColumn, Column, ManyToMany } from 'typeorm';
import { Employee } from './employee.entity';

@Entity()
export class Project {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @ManyToMany(() => Employee, (employee) => employee.projects)
    employees: Employee[];
}
