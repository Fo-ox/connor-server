import { Body, Controller, Get, Post, Query } from '@nestjs/common';
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

    @Get('/task')
    getTaskById(@Query() params): Promise<TaskDto> {
        return this.taskService.getTaskById(params.id)
    }

    @Get('/tasks')
    getTaskAllTasks(@Query() params): Promise<TaskDto[]> {
        return this.taskService.getAllTasks(params)
    }

    @Get('/totalCount')
    getTaskAllTasksCount(): Promise<number> {
        return this.taskService.getTasksCount()
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
            .catch(() => ({ error: { message: ErrorConstantEnum.CREATED_ID_ALREADY_USE } }));
    }

    @Post('/update')
    updateTask(@Body() updatedTask: TaskDto): Promise<DataModel<TaskDto>> {
        return this.taskService.getTaskById(updatedTask.id)
            .then((task: TaskDto) => task
                ? this.taskService.updateTaskById(task.id, {...task, ...updatedTask})
                : Promise.reject())
            .then((processedTask: TaskDto) => {
                !processedTask.completed && this.estimateQueue.add( 'predictEstimate',{
                    task: processedTask
                })
                return {data: processedTask}
            })
            .catch(() => ({ error: { message: ErrorConstantEnum.UPDATED_ERROR } }));
    }

    @Post('/create/jira')
    createTaskFromJira(@Body() newTask: JiraIntegrationTaskDto): Promise<DataModel<TaskDto>> {
        return this.taskService.integrationTaskIsUnique(newTask.id)
            .then((isUnique: boolean) => isUnique
                ? this.taskService.createTask(this.taskService.convertJiraTaskToTask(newTask))
                : Promise.reject())
            .then((createdTask: TaskDto) => {
                !createdTask.completed && this.estimateQueue.add( 'predictEstimate', {
                    task: createdTask
                })
                return {data: createdTask}
            })
            .catch(() => ({ error: { message: ErrorConstantEnum.INTEGRATION_ID_ALREADY_USE } }));
    }

    @Post('/update/jira')
    updateTaskFromJira(@Body() updatedTask: JiraIntegrationTaskDto): Promise<DataModel<TaskDto>> {
        return this.taskService.getTaskByIntegrationId(TaskService.getJiraInternalId(updatedTask))
            .then((task: TaskDto) => task
                ? this.taskService.updateTaskById(task.id, {...task, ...this.taskService.convertJiraTaskToTask(updatedTask)})
                : Promise.reject())
            .then((processedTask: TaskDto) => {
                !processedTask.completed && this.estimateQueue.add( 'predictEstimate', {
                    task: processedTask
                })
                return {data: processedTask}
            })
            .catch(() => ({ error: { message: ErrorConstantEnum.UPDATED_ERROR } }));
    }

    @Get('/train')
    trainModel(@Query() modelType): Promise<any> {
        console.log('train controller')
        return this.estimateQueue.add('trainModel', {
            modelType: modelType?.modelType
        })
    }

}
