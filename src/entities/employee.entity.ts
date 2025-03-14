import { 
    Entity, 
    PrimaryGeneratedColumn, 
    Column, 
    CreateDateColumn, 
    ManyToMany,
    ManyToOne,
    JoinTable
} from 'typeorm';
import { Department } from './department.entity';
import { Project } from './project.entity';

@Entity()
export class Employee {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column()
    position: string;


    @Column({ nullable: true }) 
    jobTitle: string;

    @Column()
    salary: number;

    @ManyToOne(() => Department)
    department: Department;

    @Column({ default: true })
    isActive: boolean;

    @Column({ type: 'timestamp', nullable: true })
    lastActivityDate: Date;

    @CreateDateColumn()
    hireDate: Date;

   
    @ManyToMany(() => Project)
    @JoinTable({
        name: "employee_projects",
        joinColumn: {
            name: "employeeId",
            referencedColumnName: "id"
        },
        inverseJoinColumn: {
            name: "projectId",
            referencedColumnName: "id"
        }
    })
    projects: Project[];
}