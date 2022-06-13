import { Injectable } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { SecurityUserDto } from '../user/dto/user.dto';
import { DatasetColumnsKey, NORMALIZE_MAX, NORMALIZE_MIN } from '../../constants/dataset.constants';
import { RandomForestRegression as RFRegression } from 'ml-random-forest';
import { v4 as uuidv4 } from 'uuid';
import { TaskService } from '../task/task.service';
import { ModelDto, ModelTypesEnum } from './dto/model.dto';
import { TaskDto } from '../task/dto/task.dto';
import { TaskEntity } from '../task/entities/task-entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ModelEntity } from './entities/model-entity';
import { ModelVariablesEntity } from './entities/model-variables.entity';
import { ModelVariablesDto } from './dto/model-variables.dto';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const MLR = require("ml-regression-multivariate-linear/lib/index.js");

@Injectable()
export class ModelService {
    constructor(
        private tasksService: TaskService,
        private userService: UserService,
        @InjectRepository(ModelEntity) private modelsRepository: Repository<ModelEntity>,
        @InjectRepository(ModelVariablesEntity) private modelVariablesRepository: Repository<ModelVariablesEntity>,
    ) {
    }

    private datasetContract: string[] = [];
    private dataset: Array<Array<number>> = [];
    private labels: Array<number> = [];

    private modelsState: Record<string, ModelDto> = {};

    public getModelVariable(): Promise<ModelVariablesDto> {
        return this.modelVariablesRepository.find()
            .then((modelVariables: ModelVariablesDto[]) => {
                return modelVariables.length
                    ? modelVariables[0]
                    : this.modelVariablesRepository.insert({
                        defaultModelId: null
                    }).then(() => this.getModelVariable())
            });
    }

    public setModelVariable(newVariablesState: ModelVariablesDto): Promise<ModelVariablesDto> {
        return this.getModelVariable()
            .then((currentState: ModelVariablesDto) => this.modelVariablesRepository
                .update({id: 1}, {...currentState, ...newVariablesState})
                .then(() => this.getModelVariable()))
    }

    public getModels(): Promise<ModelDto[]> {
        return this.modelsRepository.find()
            .then((models: ModelEntity[]) => models?.map((model: ModelEntity) => ({
                id: model.id,
                type: model.type,
                version: model.version,
            })));
    }

    public getFullModelById(modelId: string): Promise<ModelDto> {
        const findModel = this.modelsState[modelId];
        if (findModel) {
            return Promise.resolve(true).then(() => findModel)
        }
        return this.modelsRepository.findOne(modelId)
            .then((model: ModelEntity) => ({
                id: model.id,
                type: model.type,
                version: model.version,
                datasetContract: JSON.parse(model.datasetContract),
                modelInstance: RFRegression.load(JSON.parse(model.modelInstance)),
            }))
            .then((model: ModelDto) => {
                model && (this.modelsState[model.id] = model)
                return model
            })
    }

    public setDefaultModel(defaultId: string): Promise<ModelDto> {
        return this.setModelVariable({defaultModelId: defaultId})
            .then((variables: ModelVariablesDto) => this.getFullModelById(variables.defaultModelId))
    }

    public getDefaultModel(): Promise<ModelDto> {
        return this.getModelVariable()
            .then((variables: ModelVariablesDto) => {
                return this.getFullModelById(variables.defaultModelId)
            })
    }

    public getFullDefaultModel(): Promise<ModelDto> {
        return this.getModelVariable()
            .then((variables: ModelVariablesDto) => this.getFullModelById(variables.defaultModelId))
    }

    public predictEstimate(task: TaskDto): void {
        if (!task) {
            return;
        }

        this.getFullDefaultModel()
            .then((model: ModelDto) => {
                if (!model) {
                    return;
                }

                this.userService.getUserById(task.assigneeId)
                    .then((user: SecurityUserDto) => {
                        const normalizeTask = this.convertTaskToModelContract(task, user, model.datasetContract)
                        const predictResult = model.modelInstance.predict([normalizeTask]);
                        this.tasksService
                            .updateTaskById(task.id, {
                                ...task,
                                predictEstimate: +predictResult[0].toFixed(),
                                predictorType: model.type,
                                predictorVersion: `${model.version}`
                            })
                            .then((updatedTask: TaskDto) => updatedTask.predictEstimate)
                    })
            })
    }

    private convertTaskToModelContract(task: TaskDto, user: SecurityUserDto, contract: string[]): number[] {
        if (!task || !user || !contract?.length) {
            return;
        }
        return contract.map((cell: string) => {
            return cell === (DatasetColumnsKey.TYPE + task.typeId)
            || cell === (DatasetColumnsKey.PRIORITY + task.priorityId)
            || cell === (DatasetColumnsKey.ASSIGNEE + task.assigneeId)
            || cell === (DatasetColumnsKey.ASSIGNEE_SKILL + user.hardSkillsLevel)
            || cell === (DatasetColumnsKey.INITIAL_ESTIMATE + task.initialEstimate)
            || task.tags?.split(',').find((tag: string) => cell === (DatasetColumnsKey.TAGS + tag))
                ? 1
                : 0
        })
    }

    private getNextModelVersion(modelType: string): Promise<number> {
        return this.getModels().then((models: ModelDto[]) => {
            let lastVersion = 0;
            models.forEach((model: ModelDto) => {
                if (model.type === modelType) {
                    model.version > lastVersion
                    && (lastVersion = model.version)
                }
            })
            return ++lastVersion;
        })
    }

    public createNewModel(modelType: ModelTypesEnum): void {
        this.labels = [];
        this.dataset = [];
        this.datasetContract = [];

        this.tasksService.getAllTasks()
            .then((tasks: TaskEntity[]) => {
                this.userService.getAllUsers()
                    .then((users: SecurityUserDto[]) => {

                        this.buildDataset(tasks, users);
                        this.trainModel(modelType);
                    })
            })
    }

    public normalizeValue(value: number): number {
        return +((value - NORMALIZE_MIN) / (NORMALIZE_MAX - NORMALIZE_MIN)).toFixed(10)
    }

    private buildDataset(tasks: TaskEntity[], users: SecurityUserDto[]): void {
        const typesColumns = new Set<string>();
        const priorityColumns = new Set<string>();
        const assigneeColumns = new Set<string>();
        const assigneeSkillsColumns = new Set<string>();
        const initialEstimateColumns = new Set<string>();
        const tagsColumns = new Set<string>();

        const filteredTasks = tasks.filter((task: TaskEntity) => {
            // фильтр на выбросы от 1 до 200 часов на задачу
            return task.completed && (task.resolvedEstimate > NORMALIZE_MIN) && (task.resolvedEstimate < NORMALIZE_MAX)
        });

        filteredTasks.forEach((task: TaskEntity) => {
            task.typeId && typesColumns.add(DatasetColumnsKey.TYPE + task.typeId);
            task.priorityId && priorityColumns.add(DatasetColumnsKey.PRIORITY + task.priorityId);
            task.assigneeId && assigneeColumns.add(DatasetColumnsKey.ASSIGNEE + task.assigneeId);
            const skillLevel = users.find((user:SecurityUserDto) => user.id === task.assigneeId)?.hardSkillsLevel;
            skillLevel && assigneeSkillsColumns.add(DatasetColumnsKey.ASSIGNEE_SKILL + skillLevel);
            task.initialEstimate && initialEstimateColumns.add(DatasetColumnsKey.INITIAL_ESTIMATE + task.initialEstimate);
            task.tags && task.tags?.split(',').forEach((tag: string) => tagsColumns.add(DatasetColumnsKey.TAGS + tag));
        })

        this.datasetContract = [
            ...typesColumns,
            ...priorityColumns,
            ...assigneeColumns,
            ...assigneeSkillsColumns,
            ...tagsColumns,
            ...initialEstimateColumns,
        ];

        filteredTasks.forEach((task: TaskEntity) => {
            const skillLevel = users.find((user:SecurityUserDto) => user.id === task.assigneeId)?.hardSkillsLevel;
            this.dataset.push(this.datasetContract.map((key: string) => {
                return (DatasetColumnsKey.TYPE + task.typeId === key) ||
                (DatasetColumnsKey.PRIORITY + task.priorityId === key) ||
                (DatasetColumnsKey.ASSIGNEE + task.assigneeId === key) ||
                (DatasetColumnsKey.ASSIGNEE_SKILL + skillLevel === key) ||
                (DatasetColumnsKey.INITIAL_ESTIMATE + task.initialEstimate === key) ||
                (task.tags?.split(',')?.map((tag: string) => DatasetColumnsKey.TAGS + tag)?.includes(key))
                    ? 1 : 0
            }));
            this.labels.push(task.resolvedEstimate)
        })
    }

    private trainModel(modelType: ModelTypesEnum): Promise<ModelDto> {
        const options = {
            seed: 42,
            replacement: true,
            nEstimators: 100
        };

        let regression;
        switch (modelType) {
            case ModelTypesEnum.RANDOM_FOREST: {
                regression = new RFRegression(options);
                regression.train(this.dataset, this.labels);
                break;
            }
            case ModelTypesEnum.LINEAR_REGRESSION: {
                regression = new MLR(this.dataset, [this.labels], { intercept: true });
                break;
            }
        }

        return this.getNextModelVersion(modelType)
            .then((newVersion: number) => {
                const model = {
                    id: uuidv4(),
                    version: newVersion,
                    type: modelType,
                    datasetContract: this.datasetContract,
                    modelInstance: regression
                };

                return this.modelsRepository.insert({
                    ...model,
                    modelInstance: JSON.stringify(regression.toJSON()),
                    datasetContract: JSON.stringify(model.datasetContract)
                })
                    .then(() => this.modelsState[model.id] = model)
                    .then(() => this.getDefaultModel()
                        .then((defaultModel: ModelDto) => !defaultModel?.id && this.setDefaultModel(model.id)))
                    .then(() => this.getFullModelById(model.id))
            })
    }
}
