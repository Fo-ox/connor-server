export class NormalizeTaskDto {
    id: string;
    typeId: string;
    priorityId?: string;
    tags?: string; // unzip enumerate types
    assigneeId?: string;
    assigneeHardSkillsLevel?: string;
    createDate: string;
    initialEstimate?: string;
}

