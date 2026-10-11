import { Type } from 'class-transformer';
import { IsArray, ValidateNested } from 'class-validator';
import { CreateOrderItemDto } from './create-order.dto';

export class AddOrderItemsDto {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateOrderItemDto)
    items!: CreateOrderItemDto[];
}
