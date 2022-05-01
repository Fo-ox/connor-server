import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { UserService } from "./user.service";
import { SecurityUserDto, UserDto } from './dto/user.dto';
import { DataModel, Token } from '../../models/data.model';
import { ErrorConstantEnum } from '../../constants/error.constant';
import { AuthGuard } from '@nestjs/passport';

@Controller('user')
export class UserController {
    constructor(private userService: UserService) {
    }

    @Get('/authorise')
    authorise(@Query() credentials): Promise<DataModel<SecurityUserDto & Token>> {
        return this.userService.authorise(credentials.login, credentials.password)
            .then((user: SecurityUserDto & Token) => user
                ? { data: user }
                : { error: { message: ErrorConstantEnum.AUTHORISE_ERROR }
                });
    }

    @UseGuards(AuthGuard('jwt'))
    @Get('/users')
    getUsers(): Promise<DataModel<SecurityUserDto[]>> {
        return this.userService.getAllUsers()
            .then((users: SecurityUserDto[]) => ({data: users}));
    }

    @Post('/create')
    createUser(@Body() newUser: UserDto): Promise<DataModel<SecurityUserDto>> {
        return this.userService.loginIsUnique(newUser.login)
            .then((isUnique: boolean) => isUnique
                ? this.userService.createUser(newUser)
                : Promise.reject())
            .then((createdUser: SecurityUserDto) => ({data: createdUser}))
            .catch(() => ({ error: { message: ErrorConstantEnum.LOGIN_ALREADY_USE } }));
    }
}
