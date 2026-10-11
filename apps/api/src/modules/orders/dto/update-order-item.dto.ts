import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class UpdateOrderItemDto {
    @IsInt()
    @Min(1)
    quantity!: number;

    @IsOptional()
    @IsString()
    note?: string;
}
