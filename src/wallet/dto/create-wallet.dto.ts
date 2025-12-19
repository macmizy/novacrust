import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateWalletDto {
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsString()
  @IsOptional()
  currency?: string = 'USD';
}
