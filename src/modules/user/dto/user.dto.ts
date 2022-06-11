export class SecurityUserDto {
    readonly id: string;
    readonly externalSystemId: string;
    readonly role: string;
    readonly firstName: string;
    readonly lastName: string;
    readonly email?: string;
    readonly avatarUrl?: string;
    readonly hardSkillsLevel?: string;
}

export class UserDto extends SecurityUserDto {
    readonly login: string;
    readonly password: string;
}
