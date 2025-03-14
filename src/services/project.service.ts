import { Repository } from 'typeorm';
import { AppDataSource } from '../database/db';
import { Project } from '../entities/project.entity';

export class ProjectService {
    private projectRepository: Repository<Project>;

    constructor() {
        this.projectRepository = AppDataSource.getRepository(Project);
    }

    async create(projectData: { name: string }) {
        try {
            const project = this.projectRepository.create({
                name: projectData.name,
                isActive: true
            });

            const savedProject = await this.projectRepository.save(project);

            return {
                id: savedProject.id,
                name: savedProject.name
            };
        } catch (error) {
            console.error('Error in create project service:', error);
            throw error;
        }
    }
}