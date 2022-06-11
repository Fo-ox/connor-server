export class TaskDto {
    id?: string;
    externalSystemId?: string;
    name: string;
    description?: string;
    projectId: string;
    statusId: string;
    completed?: boolean;
    typeId: string;
    priorityId?: string;
    tags?: string;
    reporterId?: string;
    assigneeId?: string;
    createDate: string;
    closeDate?: string;
    initialEstimate?: string;
    resolvedEstimate?: number;
    predictEstimate?: number;
    predictorVersion?: string;
    predictorType?: string;
}
