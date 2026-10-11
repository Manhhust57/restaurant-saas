import { IsOptional, IsString, MaxLength } from 'class-validator';

export class BranchFilterDto {
    @IsOptional()
    @IsString()
    @MaxLength(64)
    branchId?: string;
}
