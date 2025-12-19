import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { WalletService } from './wallet.service';
import { CreateWalletDto } from './dto/create-wallet.dto';
import { FundWalletDto } from './dto/fund-wallet.dto';
import { TransferFundsDto } from './dto/transfer-funds.dto';
import { Wallet } from './entities/wallet.entity';
import { Transaction } from './entities/transaction.entity';

@Controller('wallets')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Post()
  async createWallet(
    @Body() createWalletDto: CreateWalletDto,
  ): Promise<{ data: Wallet }> {
    try {
      const wallet = await this.walletService.createWallet(createWalletDto);
      return { data: wallet };
    } catch (error) {
      if (error instanceof Error) {
        throw new HttpException(
          {
            status: HttpStatus.CONFLICT,
            error: error.message,
          },
          HttpStatus.CONFLICT,
        );
      }
      throw error;
    }
  }

  @Post(':id/fund')
  async fundWallet(
    @Param('id') walletId: string,
    @Body() fundWalletDto: Omit<FundWalletDto, 'walletId'>,
  ): Promise<{ data: Wallet }> {
    try {
      const wallet = await this.walletService.fundWallet({
        ...fundWalletDto,
        walletId,
      });
      return { data: wallet };
    } catch (error) {
      if (error instanceof Error) {
        throw new HttpException(
          {
            status: HttpStatus.BAD_REQUEST,
            error: error.message,
          },
          HttpStatus.BAD_REQUEST,
        );
      }
      throw error;
    }
  }

  @Post('transfer')
  async transferFunds(
    @Body() transferDto: TransferFundsDto,
  ): Promise<{ data: { fromWallet: Wallet; toWallet: Wallet } }> {
    try {
      const result = await this.walletService.transferFunds(transferDto);
      return { data: result };
    } catch (error) {
      if (error instanceof Error) {
        const status =
          error.message === 'Insufficient balance'
            ? HttpStatus.BAD_REQUEST
            : HttpStatus.NOT_FOUND;
        throw new HttpException(
          {
            status,
            error: error.message,
          },
          status,
        );
      }
      throw error;
    }
  }

  @Get(':id')
  async getWallet(@Param('id') id: string): Promise<{ data: Wallet }> {
    try {
      const wallet = await this.walletService.getWallet(id);
      return { data: wallet };
    } catch (error) {
      if (error instanceof Error) {
        throw new HttpException(
          {
            status: HttpStatus.NOT_FOUND,
            error: error.message,
          },
          HttpStatus.NOT_FOUND,
        );
      }
      throw error;
    }
  }

  @Get(':id/transactions')
  async getWalletTransactions(
    @Param('id') walletId: string,
  ): Promise<{ data: Transaction[] }> {
    try {
      const transactions = await this.walletService.getWalletTransactions(walletId);
      return { data: transactions };
    } catch (error) {
      if (error instanceof Error) {
        throw new HttpException(
          {
            status: HttpStatus.NOT_FOUND,
            error: error.message,
          },
          HttpStatus.NOT_FOUND,
        );
      }
      throw error;
    }
  }

  // For debugging/administration
  @Get()
  async getAllWallets(): Promise<{ data: Wallet[] }> {
    const wallets = await this.walletService.getAllWallets();
    return { data: wallets };
  }
}
