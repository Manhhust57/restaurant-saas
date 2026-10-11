import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Min, MinLength } from 'class-validator';

export const TABLE_STATUSES = ['AVAILABLE', 'OCCUPIED', 'RESERVED', 'DISABLED'] as const;

export class CreateTableDto {
    @IsString()
    @MinLength(1)
    branchId!: string;

    @IsString()
    @MinLength(1)
    name!: string;

    @IsString()
    @MinLength(1)
    code!: string;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    capacity?: number;

    @IsOptional()
    @IsIn(TABLE_STATUSES)
    status?: string;
}
