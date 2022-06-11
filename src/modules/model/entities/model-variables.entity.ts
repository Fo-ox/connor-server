import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('modelVariables')
export class ModelVariablesEntity {
    @PrimaryGeneratedColumn()
        id: number;

    @Column({nullable: true})
        defaultModelId: string;
}
