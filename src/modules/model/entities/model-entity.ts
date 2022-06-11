import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('models')
export class ModelEntity {
    @PrimaryColumn()
        id: string;

    @Column()
        version: number;

    @Column()
        type: string;

    @Column()
        datasetContract: string;

    @Column()
        modelInstance: string;
}
