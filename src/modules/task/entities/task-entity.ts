import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('tasks')
export class TaskEntity {
    @PrimaryColumn()
        id: string;

    @Column({unique: true, nullable: true})
        externalSystemId: string;

    @Column()
        name: string;

    @Column({nullable: true})
        description: string;

    @Column()
        projectId: string;

    @Column()
        statusId: string;

    @Column({nullable: true})
        completed: boolean;

    @Column()
        typeId: string;

    @Column({nullable: true})
        priorityId: string;

    @Column({nullable: true})
        tags: string;

    @Column({nullable: true})
        reporterId: string;

    @Column({nullable: true})
        assigneeId: string;

    @Column()
        createDate: string;

    @Column({nullable: true})
        closeDate: string;

    @Column({nullable: true})
        initialEstimate: string;

    @Column({nullable: true})
        resolvedEstimate: number;

    @Column({nullable: true})
        predictEstimate: number;

    @Column({nullable: true})
        predictorVersion: string;

    @Column({nullable: true})
        predictorType: string;
}
