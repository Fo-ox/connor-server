import { Injectable } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { SecurityUserDto } from '../user/dto/user.dto';
import { DatasetColumnsKey, NORMALIZE_MAX, NORMALIZE_MIN } from '../../constants/dataset.constants';
import { RandomForestRegression as RFRegression } from 'ml-random-forest';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const KNN = require("ml-knn/lib/index.js")
import { v4 as uuidv4 } from 'uuid';
import { TaskService } from '../task/task.service';
import { ModelDto } from './dto/model.dto';
import { TaskDto } from '../task/dto/task.dto';
import { TaskEntity } from '../task/entities/task-entity';

@Injectable()
export class ModelService {
    constructor(
        private tasksService: TaskService,
        private userService: UserService,
    ) {
    }

    private datasetContract: string[] = [];
    private dataset: Array<Array<number>> = [];
    private labels: Array<number> = [];

    private modelsState: ModelDto[] = [];
    private defaultModelId: string;
    private versionMap: Record<string, number> = {};

    public getModels(): Promise<ModelDto[]> {
        return Promise.resolve(true)
            .then(() => [...this.modelsState?.map((model: ModelDto) => ({
                id: model.id,
                type: model.type,
                version: model.version,
            }))]);
    }

    public setDefaultModel(defaultId: string): Promise<ModelDto> {
        this.defaultModelId = defaultId
        return Promise.resolve(true)
            .then(() => this.getModelById(defaultId));
    }

    public getDefaultModel(): Promise<ModelDto> {
        return this.getModelById(this.defaultModelId);
    }

    public getModelById(id: string): Promise<ModelDto> {
        return Promise.resolve(true)
            .then(() => this.modelsState.find((model: ModelDto) => model.id === id))
            .then((findModel: ModelDto) => findModel
                ? {
                    id: findModel.id,
                    type: findModel.type,
                    version: findModel.version
                }
                : null
            )
    }

    public predictEstimate(task: TaskDto, modelType: string): void {
        const model: ModelDto = this.modelsState
            .find((model: ModelDto) => model.type === modelType && model.version === this.versionMap[modelType])

        if (!model || !task) {
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

    private getNextModelVersion(modelType: string): number {
        return this.versionMap?.[modelType]
            ? ++this.versionMap[modelType]
            : this.versionMap[modelType] = 1
    }

    public createNewModel(modelType = 'randomForest'): void {
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

        // контракт датасета надо сохранить вместе с обученной моделью
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

    private trainModel(modelType: string): ModelDto {
        const options = {
            seed: 42,
            replacement: true,
            nEstimators: 100
        };

        const regression = new RFRegression(options);
        regression.train(this.dataset, this.labels);

        const model = {
            id: uuidv4(),
            version: this.getNextModelVersion(modelType),
            type: modelType,
            datasetContract: this.datasetContract,
            modelInstance: regression
        };

        this.modelsState.push(model)
        !this.defaultModelId && (this.setDefaultModel(model.id));

        return model;

        // const dataset = [
        //     [1, 0, 1, 1, 1, 1, 0.5728643216],
        //     [0, 1, 1, 1, 0, 0, 0.0502512563],
        //     [0, 1, 1, 1, 0, 0, 0.0502512563],
        //     [0, 1, 1, 1, 0, 0, 0.0502512563],
        //     [0, 1, 1, 1, 0, 0, 0.0502512563],
        //     [1, 0, 1, 1, 1, 1, 0.5728643216],
        //     [1, 0, 1, 1, 1, 1, 0.5728643216],
        //     [1, 0, 1, 1, 1, 1, 0.5728643216],
        //     [1, 0, 1, 1, 1, 1, 0.5728643216]
        // ];
        //
        // const trainingSet = new Array(dataset.length);
        // const predictions = new Array(dataset.length);
        //
        // for (let i = 0; i < dataset.length; ++i) {
        //     trainingSet[i] = dataset[i].slice(0, 6);
        //     predictions[i] = dataset[i][6];
        // }
        //
        // console.log(trainingSet)
        // console.log(predictions)
        //
        // const options = {
        //     seed: 3,
        //     maxFeatures: 2,
        //     replacement: false,
        //     nEstimators: 200
        // };
        //
        // const regression = new RFRegression(options);
        // regression.train(trainingSet, predictions);
        // const result = regression.predict(trainingSet);

    }
}
