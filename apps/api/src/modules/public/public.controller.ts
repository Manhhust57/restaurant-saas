import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsInt, IsOptional, IsString, Min, ValidateNested } from 'class-validator';
import { PublicService } from './public.service';

class PublicOrderItemDto {
    @IsString()
    productId!: string;

    @IsInt()
    @Min(1)
    quantity!: number;

    @IsOptional()
    @IsString()
    note?: string;
}

class CreatePublicOrderDto {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => PublicOrderItemDto)
    items!: PublicOrderItemDto[];
}

@ApiTags('public')
@Controller('api/v1/public')
export class PublicController {
    constructor(private readonly publicService: PublicService) { }

    @Get('tables/:token')
    async getTableInfo(@Param('token') token: string) {
        return this.publicService.getTableByToken(token);
    }

    @Get('menu/:token')
    async getMenu(@Param('token') token: string) {
        return this.publicService.getMenuByTableToken(token);
    }

    @Post('orders/:token')
    async createOrder(@Param('token') token: string, @Body() dto: CreatePublicOrderDto) {
        return this.publicService.createOrderFromTable(token, dto);
    }
}
