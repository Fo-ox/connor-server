import { Controller, forwardRef, Get, Inject, Query, UseGuards } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Job, Queue } from 'bull';
import { ModelService } from './model.service';
import { ModelDto, ModelTypesEnum } from './dto/model.dto';
import { DataModel } from '../../models/data.model';
import { ErrorConstantEnum } from '../../constants/error.constant';
import { TaskService } from '../task/task.service';
import { TaskDto } from '../task/dto/task.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('model')
export class ModelController {
    constructor(
        @InjectQueue('connorCore') private estimateQueue: Queue,
        private modelService: ModelService,
        @Inject(forwardRef(() => TaskService)) private taskService: TaskService,
    ) {
    }

    @UseGuards(AuthGuard('jwt'))
    @Get('/train')
    trainModel(@Query() parameters): Promise<any> {
        if (parameters.modelType !== ModelTypesEnum.LINEAR_REGRESSION && parameters.modelType !== ModelTypesEnum.RANDOM_FOREST) {
            return Promise.resolve(true)
                .then(() => ({ error: { message: ErrorConstantEnum.INVALID_MODEL } }))
        }

        return this.estimateQueue.add('trainModel', {
            modelType: parameters?.modelType
        }).then(() => ({data: `Successfully started train ${parameters?.modelType} model`}))
    }

    @UseGuards(AuthGuard('jwt'))
    @Get('/models')
    getModels(): Promise<DataModel<ModelDto[]>> {
        return this.modelService.getModels()
            .then((models: ModelDto[]) => ({data: models.map((model: ModelDto) => ({
                id: model.id,
                type: model.type,
                version: model.version
            }))}));
    }

    @UseGuards(AuthGuard('jwt'))
    @Get('/defaultModel')
    getDefaultModel(@Query() params): Promise<DataModel<ModelDto>> {
        return params.id
            ? this.modelService.setDefaultModel(params.id)
                .then((model: ModelDto) => model
                    ? {data: model}
                    : Promise.reject())
                .catch(() => ({ error: { message: ErrorConstantEnum.ERROR_SET_DEFAULT_MODEL } }))
            : this.modelService.getDefaultModel()
                .then((model) => ({data: {
                    id: model.id,
                    type: model.type,
                    version: model.version
                }}))
    }

    @UseGuards(AuthGuard('jwt'))
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
