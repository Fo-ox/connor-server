import { Body, Controller, Get, Post } from '@nestjs/common';
import { TaskDto } from './dto/task.dto';
import { DataModel } from '../../models/data.model';
import { TaskService } from './task.service';
import { JiraIntegrationTaskDto } from './dto/jira-integration-task.dto';
import { ErrorConstantEnum } from '../../constants/error.constant';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

@Controller('task')
export class TaskController {

    constructor(
        @InjectQueue('connorCore') private estimateQueue: Queue,
        private taskService: TaskService,
    ) {
    }

    private JIRA_AUTOMATION;

    @Post('/create')
    setState(@Body() newTask: TaskDto): any {
        this.JIRA_AUTOMATION = newTask;
        return newTask;
    }

    @Get()
    getState(): any {
        return this.JIRA_AUTOMATION
    }

    @Post('/create')
    createTask(@Body() newTask: TaskDto): Promise<DataModel<TaskDto>> {
        return this.taskService.createTask(newTask)
            .then((createdTask: TaskDto) => ({data: createdTask}))
    }

    @Post('/create/jira')
    createTaskFromJira(@Body() newTask: JiraIntegrationTaskDto): Promise<DataModel<TaskDto>> {
        return this.taskService.integrationTaskIsUnique(newTask.id)
            .then((isUnique: boolean) => isUnique
                ? this.taskService.createTask(this.taskService.convertJiraTaskToTask(newTask))
                : Promise.reject())
            .then((createdTask: TaskDto) => {
                !createdTask.completed && this.estimateQueue.add( {
                    task: createdTask
                })
                return {data: createdTask}
            })
            .catch(() => ({ error: { message: ErrorConstantEnum.INTEGRATION_ID_ALREADY_USE } }));
    }
}
