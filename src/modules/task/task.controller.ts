import { Body, Controller, forwardRef, Get, Inject, Post, Query, UseGuards } from '@nestjs/common';
import { TaskDto } from './dto/task.dto';
import { DataModel } from '../../models/data.model';
import { TaskService } from './task.service';
import { JiraIntegrationTaskDto } from './dto/jira-integration-task.dto';
import { ErrorConstantEnum } from '../../constants/error.constant';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { ModelService } from '../model/model.service';
import { ModelDto } from '../model/dto/model.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('task')
export class TaskController {

    constructor(
        @InjectQueue('connorCore') private estimateQueue: Queue,
        private taskService: TaskService,
        @Inject(forwardRef(() => ModelService)) private modelService: ModelService,
    ) {
    }

    @UseGuards(AuthGuard('jwt'))
    @Get('/task')
    getTaskById(@Query() params): Promise<DataModel<TaskDto>> {
        return this.taskService.getTaskById(params.id)
            .then((task: TaskDto) => ({data: task}))
    }

    @UseGuards(AuthGuard('jwt'))
    @Get('/tasks')
    getTaskAllTasks(@Query() params): Promise<DataModel<TaskDto[]>> {
        return this.taskService.getAllTasks(params)
            .then((tasks: TaskDto[]) => ({data: tasks}))
    }

    @UseGuards(AuthGuard('jwt'))
    @Get('/totalCount')
    getTaskAllTasksCount(): Promise<DataModel<number>> {
        return this.taskService.getTasksCount()
            .then((count: number) => ({data: count}))
    }

    @UseGuards(AuthGuard('jwt'))
    @Post('/create')
    createTask(@Body() newTask: TaskDto): Promise<DataModel<TaskDto>> {
        return this.taskService.taskIsUnique(newTask.id)
            .then((isUnique: boolean) => isUnique
                ? this.taskService.createTask(newTask)
                : Promise.reject())
            .then((createdTask: TaskDto) => {
                this.modelService.getDefaultModel()
                    .then((model: ModelDto) => model
                        && !createdTask.completed
                        && this.estimateQueue.add( 'predictEstimate',{
                            task: createdTask
                        }))
                return {data: createdTask}
            })
            .catch(() => ({ error: { message: ErrorConstantEnum.CREATED_ID_ALREADY_USE } }));
    }

    @UseGuards(AuthGuard('jwt'))
    @Post('/update')
    updateTask(@Body() updatedTask: TaskDto): Promise<DataModel<TaskDto>> {
        return this.taskService.getTaskById(updatedTask.id)
            .then((task: TaskDto) => task
                ? this.taskService.updateTaskById(task.id, {...task, ...updatedTask})
                : Promise.reject())
            .then((processedTask: TaskDto) => {
                this.modelService.getDefaultModel()
                    .then((model: ModelDto) => model
                        && !processedTask.completed
                        && this.estimateQueue.add( 'predictEstimate',{
                            task: processedTask
                        }))
                return {data: processedTask}
            })
            .catch(() => ({ error: { message: ErrorConstantEnum.UPDATED_ERROR } }));
    }

    @Post('/create/jira')
    createTaskFromJira(@Body() newTask: JiraIntegrationTaskDto): Promise<DataModel<TaskDto>> {
        console.log('create start');
        return this.taskService.integrationTaskIsUnique(newTask.id)
            .then((isUnique: boolean) => isUnique
                ? this.taskService.createTask(this.taskService.convertJiraTaskToTask(newTask))
                : Promise.reject())
            .then((createdTask: TaskDto) => {
                console.log('im in estimate')
                this.modelService.getDefaultModel()
                    .then((model: ModelDto) => model
                        && !createdTask.completed
                        && this.estimateQueue.add( 'predictEstimate',{
                            task: createdTask
                        }))
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
                this.modelService.getDefaultModel()
                    .then((model: ModelDto) => model
                        && !processedTask.completed
                        && this.estimateQueue.add( 'predictEstimate',{
                            task: processedTask
                        }))
                return {data: processedTask}
            })
            .catch(() => ({ error: { message: ErrorConstantEnum.UPDATED_ERROR } }));
    }

}
