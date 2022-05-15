export class TaskDto {
    id: string;
    internalSystemId?: string;
    name: string;
    description?: string;
    projectId: string;
    statusId: string;
    completed?: boolean;
    typeId: string;
    priorityId?: string;
    tags?: string; // unzip enumerate types
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

