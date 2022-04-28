import { Injectable } from '@nestjs/common';
import { SecurityUserDto, UserDto } from './dto/user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { UserEntity } from './entities/user-entity';

@Injectable()
export class UserService {
    constructor(
        @InjectRepository(UserEntity) private usersRepository: Repository<UserEntity>,
    ) {}

    public authorise(login: string, password: string): Promise<SecurityUserDto> {
        return this.usersRepository
            .findOne({ where: { login: login } })
            .then((user: UserEntity) => user.password === password ? user : null)
    }

    public loginIsUnique(login: string): Promise<boolean> {
        return this.usersRepository
            .findOne({ where: { login: login } })
            .then((user: UserEntity) => !user)
    }

    public createUser(newUser: UserDto): Promise<SecurityUserDto> {
        const id: string = uuidv4();
        return this.usersRepository
            .insert({
                ...newUser,
                id: id,
            })
            .then(() => this.getUserById(id));
    }

    public getUserById(id: string): Promise<SecurityUserDto> {
        return this.usersRepository
            .findOne(id)
            .then((user: UserEntity) => UserService.getSecurityUser(user));
    }

    public getAllUsers(): Promise<SecurityUserDto[]> {
        return this.usersRepository
            .find()
            .then((users: UserEntity[]) => users
                .map((user: UserEntity) => UserService.getSecurityUser(user))
            );
    }

    public static getSecurityUser(user: UserDto): SecurityUserDto {
        return {
            id: user?.id,
            role: user?.role,
            lastName: user?.lastName,
            firstName: user?.firstName,
            email: user?.email,
            hardSkillsLevel: user?.hardSkillsLevel,
            avatarUrl: user?.avatarUrl
        }
    }
}
