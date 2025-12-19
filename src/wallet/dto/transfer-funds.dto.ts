import { IsNotEmpty, IsNumber, IsPositive, IsString, IsUUID } from 'class-validator';

export class TransferFundsDto {
  @IsUUID()
  @IsNotEmpty()
  fromWalletId: string;

  @IsUUID()
  @IsNotEmpty()
  toWalletId: string;

  @IsNumber()
  @IsPositive()
  amount: number;

  @IsString()
  @IsNotEmpty()
  referenceId: string; // For idempotency
}
