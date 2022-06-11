import { Controller, forwardRef, Get, Inject, Query } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Job, Queue } from 'bull';
import { ModelService } from './model.service';
import { ModelDto } from './dto/model.dto';
import { DataModel } from '../../models/data.model';
import { ErrorConstantEnum } from '../../constants/error.constant';
import { TaskService } from '../task/task.service';
import { TaskDto } from '../task/dto/task.dto';

@Controller('model')
export class ModelController {
    constructor(
        @InjectQueue('connorCore') private estimateQueue: Queue,
        private modelService: ModelService,
        @Inject(forwardRef(() => TaskService)) private taskService: TaskService,
    ) {
    }

    @Get('/train')
    trainModel(@Query() modelType): Promise<any> {
        console.log('train controller')
        return this.estimateQueue.add('trainModel', {
            modelType: modelType?.modelType
        })
    }

    @Get('/models')
    getModels(): Promise<DataModel<ModelDto[]>> {
        return this.modelService.getModels()
            .then((models: ModelDto[]) => ({data: models}));
    }

    @Get('/defaultModel')
    getDefaultModel(@Query() params): Promise<DataModel<ModelDto>> {
        return params.id
            ? this.modelService.setDefaultModel(params.id)
                .then((model: ModelDto) => model
                    ? {data: model}
                    : Promise.reject())
                .catch(() => ({ error: { message: ErrorConstantEnum.ERROR_SET_DEFAULT_MODEL } }))
            : this.modelService.getDefaultModel()
                .then((model) => ({data: model}))
    }

    @Get('/predict')
    predictById(@Query() params): Promise<DataModel<TaskDto>> {
        return this.taskService.getTaskById(params.taskId)
            .then((task: TaskDto) => task
                ? this.modelService.getDefaultModel()
                    .then((model: ModelDto) => model
                        ? this.estimateQueue.add( 'predictEstimate', { task: task })
                            .then((jobValue: Job<TaskDto>) => ({data: jobValue.data}))
                        : Promise.reject())
                    .catch(() => ({ error: { message: ErrorConstantEnum.EMPTY_DEFAULT_MODEL } }))
                : Promise.reject())
            .catch(() => ({ error: { message: ErrorConstantEnum.FIND_ERROR } }))
    }
}
