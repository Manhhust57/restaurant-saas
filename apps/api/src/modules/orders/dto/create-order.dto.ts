import { Type } from 'class-transformer';
import { IsArray, IsInt, IsOptional, IsString, Min, MinLength, ValidateNested } from 'class-validator';

export class CreateOrderItemDto {
    @IsString()
    @MinLength(1)
    productId!: string;

    @IsInt()
    @Min(1)
    quantity!: number;

    @IsOptional()
    @IsString()
    note?: string;
}

export class CreateOrderDto {
    @IsString()
    @MinLength(1)
    branchId!: string;

    @IsOptional()
    @IsString()
    tableId?: string;

    @IsOptional()
    @IsString()
    note?: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateOrderItemDto)
    items!: CreateOrderItemDto[];
}
