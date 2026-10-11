import { IsEmail, IsIn, IsString, MinLength } from 'class-validator';

export const STAFF_ROLES = ['MANAGER', 'CASHIER', 'WAITER', 'KITCHEN'] as const;
export type StaffRole = (typeof STAFF_ROLES)[number];

export class RegisterDto {
    @IsEmail()
    email!: string;

    @IsString()
    @MinLength(6)
    password!: string;

    @IsString()
    @MinLength(2)
    fullName!: string;

    @IsIn(STAFF_ROLES)
    role!: StaffRole;
}
