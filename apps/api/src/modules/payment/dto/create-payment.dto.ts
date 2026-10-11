import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreatePaymentDto {
    @IsEnum(['CASH', 'BANK_TRANSFER', 'CARD', 'QR', 'OTHER'])
    method!: string;

    @IsNumber()
    @Min(0)
    amount!: number;

    @IsOptional()
    @IsString()
    transactionId?: string;
}
