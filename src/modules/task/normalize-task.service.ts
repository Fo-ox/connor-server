import { Injectable } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { TaskEntity } from './entities/task-entity';
import { SecurityUserDto } from '../user/dto/user.dto';
import { DatasetColumnsKey, NORMALIZE_MAX, NORMALIZE_MIN } from '../../constants/dataset.constants';
import { TaskService } from './task.service';

@Injectable()
export class NormalizeTaskService {
    constructor(
        private tasksService: TaskService,
        private userService: UserService,
    ) {
    }

    private dataset: Array<Array<number>> = [];
    private labels: Array<number> = [];

    public buildDataset(): void {
        this.labels = [];
        this.dataset = [];

        this.tasksService.getAllTasks()
            .then((tasks: TaskEntity[]) => {
                this.userService.getAllUsers()
                    .then((users: SecurityUserDto[]) => {
                        let columns: string[] = [];
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
                        columns = [
                            ...typesColumns,
                            ...priorityColumns,
                            ...assigneeColumns,
                            ...assigneeSkillsColumns,
                            ...tagsColumns,
                            ...initialEstimateColumns,
                        ];

                        filteredTasks.forEach((task: TaskEntity) => {
                            const skillLevel = users.find((user:SecurityUserDto) => user.id === task.assigneeId)?.hardSkillsLevel;
                            this.dataset.push(columns.map((key: string) => {
                                return (DatasetColumnsKey.TYPE + task.typeId === key) ||
                                    (DatasetColumnsKey.PRIORITY + task.priorityId === key) ||
                                    (DatasetColumnsKey.ASSIGNEE + task.assigneeId === key) ||
                                    (DatasetColumnsKey.ASSIGNEE_SKILL + skillLevel === key) ||
                                    (DatasetColumnsKey.INITIAL_ESTIMATE + task.initialEstimate === key) ||
                                    (task.tags?.split(',')?.map((tag: string) => DatasetColumnsKey.TAGS + tag)?.includes(key))
                                    ? 1 : 0
                            }));
                            this.labels.push(this.normalizeValue(task.resolvedEstimate))
                        })

                        console.log(columns);
                        console.log(this.dataset);
                        console.log(this.labels);
                    })
            })
    }

    public normalizeValue(value: number): number {
        return +((value - NORMALIZE_MIN) / (NORMALIZE_MAX - NORMALIZE_MIN)).toFixed(10)
    }
}
