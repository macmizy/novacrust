import { IsNotEmpty, IsNumber, IsPositive, IsString, IsUUID } from 'class-validator';

export class FundWalletDto {
  @IsUUID()
  @IsNotEmpty()
  walletId: string;

  @IsNumber()
  @IsPositive()
  amount: number;

  @IsString()
  @IsNotEmpty()
  referenceId: string; // For idempotency
}
