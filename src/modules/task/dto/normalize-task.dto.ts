export class NormalizeTaskDto {
    id: string;
    typeId: number;
    priorityId?: number;
    assigneeId?: number;
    assigneeHardSkillsLevel?: number;
    initialEstimate?: number;
    resolvedEstimate?: number;
    tags?: number; // unzip enumerate types
}

