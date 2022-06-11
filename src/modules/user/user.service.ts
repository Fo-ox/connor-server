import { Injectable } from '@nestjs/common';
import { SecurityUserDto, UserDto } from './dto/user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { UserEntity } from './entities/user-entity';
import { JwtService } from '@nestjs/jwt';
import { Token } from '../../models/data.model';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UserService {
    constructor(
        @InjectRepository(UserEntity) private usersRepository: Repository<UserEntity>,
        private readonly jwtService: JwtService
    ) {}

    public hashPassword(password: string): Promise<string> {
        return bcrypt.hash(password, 10)
    }

    public getToken(id: string): Token {
        const payload = {id};
        return { access_token: this.jwtService.sign(payload) };
    }

    public authorise(login: string, password: string): Promise<SecurityUserDto & Token> {
        return this.usersRepository
            .findOne({ where: { login: login } })
            .then((user: UserEntity) => bcrypt.compare(password, user.password)
                .then((accept: boolean) => accept
                    ? {...UserService.getSecurityUser(user), ...this.getToken(user.id)}
                    : null
                )
            )
    }

    public loginIsUnique(login: string): Promise<boolean> {
        return this.usersRepository
            .findOne({ where: { login: login } })
            .then((user: UserEntity) => !user)
    }

    public createUser(newUser: UserDto): Promise<SecurityUserDto> {
        const id: string = uuidv4();
        return this.hashPassword(newUser.password)
            .then((hashPassword: string) => {
                return this.usersRepository
                    .insert({
                        ...newUser,
                        password: hashPassword,
                        id: id,
                    })
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

    public updateUserById(id: string, newData: UserDto): Promise<SecurityUserDto> {
        return this.usersRepository
            .update({id}, newData)
            .then(() => this.getUserById(id))
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
