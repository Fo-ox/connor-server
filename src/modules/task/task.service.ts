import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TaskEntity } from './entities/task-entity';
import { TaskDto } from './dto/task.dto';
import { v4 as uuidv4 } from 'uuid';
import { JiraIntegrationTaskDto } from './dto/jira-integration-task.dto';

@Injectable()
export class TaskService {
    constructor(
        @InjectRepository(TaskEntity) private tasksRepository: Repository<TaskEntity>,
    ) {
    }

    public createTask(newTask: TaskDto): Promise<TaskDto> {
        const id: string = uuidv4();
        return this.tasksRepository.insert({
            ...newTask,
            id: id,
        }).then(() => {
            return this.getTaskById(id)
        });
    }

    public createTaskFromJira(newTask: JiraIntegrationTaskDto): Promise<TaskDto> {
        const id: string = uuidv4();
        return this.tasksRepository.insert({
            ...newTask,
            id: id,
        }).then(() => this.getTaskById(id));
    }

    public integrationTaskIsUnique(id: string | number): Promise<boolean> {
        return this.tasksRepository
            .findOne({ where: { externalSystemId: id } })
            .then((task: TaskEntity) => !task)
    }

    public taskIsUnique(id: string | number): Promise<boolean> {
        return this.tasksRepository
            .findOne(id)
            .then((task: TaskEntity) => !task)
    }

    public getTaskById(id: string): Promise<TaskDto> {
        return this.tasksRepository.findOne(id)
    }

    public getTaskByIntegrationId(id: string): Promise<TaskDto> {
        return this.tasksRepository.findOne({ where: { externalSystemId: id } })
    }

    public updateTaskById(id: string, newData: TaskDto): Promise<TaskDto> {
        return this.tasksRepository
            .update({id}, newData)
            .then(() => this.getTaskById(id))
    }

    public getAllTasks(params?: {limit?: number, offset?: number, filter?: string}): Promise<TaskDto[]> {
        return this.tasksRepository.find();
    }

    public getTasksCount(): Promise<number> {
        return this.tasksRepository.count();
    }

    public convertJiraTaskToTask(jiraTask: JiraIntegrationTaskDto): TaskDto {
        if (!jiraTask) {
            return;
        }
        return {
            externalSystemId: TaskService.getJiraInternalId(jiraTask),
            name: jiraTask.fields?.summary,
            description: jiraTask.fields?.description,
            projectId: jiraTask.fields?.project?.key,
            statusId: jiraTask.fields?.status?.id?.toString(),
            completed: !!jiraTask.fields?.resolutiondate,
            typeId: jiraTask.fields?.issuetype?.id?.toString(),
            priorityId: jiraTask.fields?.priority?.id?.toString(),
            tags: jiraTask.fields?.labels?.join(','),
            reporterId: jiraTask.fields?.reporter?.accountId,
            assigneeId: jiraTask.fields.assignee?.accountId,
            createDate: new Date(jiraTask.fields?.created)?.toISOString(),
            closeDate: new Date(jiraTask.fields?.resolutiondate)?.toISOString(),
            initialEstimate: jiraTask.fields?.customfield_10029?.value,
            resolvedEstimate: +(jiraTask.fields?.timetracking.timeSpentSeconds / 3600)?.toFixed(),
        }
    }

    public static getJiraInternalId(jiraTask: JiraIntegrationTaskDto): string {
        return `${jiraTask.key}/${jiraTask.id}`
    }

}
