import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('users')
export class UserEntity {
    @PrimaryColumn()
        id: string;

    @Column()
        login: string;

    @Column()
        password: string;

    @Column()
        role: string;

    @Column()
        firstName: string;

    @Column({nullable: true})
        lastName: string;

    @Column({nullable: true})
        email: string;

    @Column({nullable: true})
        avatarUrl: string;

    @Column({nullable: true})
        hardSkillsLevel: string;
}
