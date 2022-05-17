import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('normalizeTasks')
export class NormalizeTaskEntity {
    @PrimaryColumn()
        id: string;

    @Column()
        typeId: number;

    @Column({nullable: true})
        priorityId: number;

    @Column({nullable: true})
        tags: number;

    @Column({nullable: true})
        assigneeId: number;

    @Column({nullable: true})
        assigneeHardSkillsLevel: number;

    @Column({nullable: true})
        initialEstimate: number;

    @Column({nullable: true})
        resolvedEstimate: number;
}
