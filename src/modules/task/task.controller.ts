import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
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

    @Get()
    getState(): any {
        return this.JIRA_AUTOMATION
    }

    @Get('/task/:id')
    getTaskById(@Param('id') id: string): Promise<TaskDto> {
        console.log('get by id');
        return this.taskService.getTaskById(id)
    }

    @Post('/create')
    createTask(@Body() newTask: TaskDto): Promise<DataModel<TaskDto>> {
        return this.taskService.taskIsUnique(newTask.id)
            .then((isUnique: boolean) => isUnique
                ? this.taskService.createTask(newTask)
                : Promise.reject())
            .then((createdTask: TaskDto) => {
                !createdTask.completed && this.estimateQueue.add( 'predictEstimate',{
                    task: createdTask
                })
                return {data: createdTask}
            })
    }

    @Post('/create/jira')
    createTaskFromJira(@Body() newTask: JiraIntegrationTaskDto): Promise<DataModel<TaskDto>> {
        this.JIRA_AUTOMATION = newTask;
        return this.taskService.integrationTaskIsUnique(newTask.id)
            .then((isUnique: boolean) => isUnique
                ? this.taskService.createTask(this.taskService.convertJiraTaskToTask(newTask))
                : Promise.reject())
            .then((createdTask: TaskDto) => {
                this.estimateQueue.add( 'predictEstimate', {
                    task: createdTask
                })
                return {data: createdTask}
            })
            .catch(() => ({ error: { message: ErrorConstantEnum.INTEGRATION_ID_ALREADY_USE } }));
    }

    @Get('/train')
    trainModel(@Query() modelType): Promise<any> {
        console.log('train controller')
        return this.estimateQueue.add('trainModel', {
            modelType: modelType?.modelType
        })
    }

}
