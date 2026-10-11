import { IsDateString, IsOptional, IsString, MaxLength } from 'class-validator';

export class SalesQueryDto {
    @IsOptional()
    @IsString()
    @MaxLength(64)
    branchId?: string;

    @IsOptional()
    @IsDateString()
    from?: string;

    @IsOptional()
    @IsDateString()
    to?: string;
}
