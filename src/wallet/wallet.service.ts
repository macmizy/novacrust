import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { Wallet } from './entities/wallet.entity';
import { Transaction, TransactionType } from './entities/transaction.entity';
import { CreateWalletDto } from './dto/create-wallet.dto';
import { FundWalletDto } from './dto/fund-wallet.dto';
import { TransferFundsDto } from './dto/transfer-funds.dto';

@Injectable()
export class WalletService {
  // In-memory storage
  private wallets: Map<string, Wallet> = new Map();
  private transactions: Map<string, Transaction> = new Map();
  private referenceIds: Set<string> = new Set();

  // Create a new wallet
  async createWallet(createWalletDto: CreateWalletDto): Promise<Wallet> {
    const { id, currency = 'USD' } = createWalletDto;

    // Check if wallet already exists
    if (this.wallets.has(id)) {
      throw new ConflictException('Wallet with this ID already exists');
    }

    const wallet = new Wallet();
    wallet.id = id;
    wallet.currency = currency;
    wallet.balance = 0;
    wallet.transactions = [];
    wallet.createdAt = new Date();
    wallet.updatedAt = new Date();

    this.wallets.set(id, wallet);
    return wallet;
  }

  // Fund a wallet
  async fundWallet(fundWalletDto: FundWalletDto): Promise<Wallet> {
    const { walletId, amount, referenceId } = fundWalletDto;

    // Check for duplicate transaction
    if (this.referenceIds.has(referenceId)) {
      // Idempotency: If this is a retry, return the existing wallet state
      const existingTransaction = Array.from(this.transactions.values()).find(
        (t) => t.referenceId === referenceId,
      );
      if (existingTransaction) {
        return this.getWallet(walletId);
      }
    }

    const wallet = await this.getWallet(walletId);
    
    // Create transaction
    const transaction = new Transaction({
      id: uuidv4(),
      walletId,
      amount,
      type: TransactionType.FUND,
      referenceId,
      metadata: { action: 'wallet_fund' },
    });

    // Update wallet balance
    wallet.balance += amount;
    wallet.transactions.push(transaction);
    wallet.updatedAt = new Date();

    // Save changes
    this.transactions.set(transaction.id, transaction);
    this.referenceIds.add(referenceId);
    this.wallets.set(walletId, wallet);

    return wallet;
  }

  // Transfer funds between wallets
  async transferFunds(transferDto: TransferFundsDto): Promise<{ fromWallet: Wallet; toWallet: Wallet }> {
    const { fromWalletId, toWalletId, amount, referenceId } = transferDto;

    // Check for duplicate transaction
    if (this.referenceIds.has(referenceId)) {
      // Idempotency: If this is a retry, return the existing state
      const existingTransaction = Array.from(this.transactions.values()).find(
        (t) => t.referenceId === referenceId,
      );
      if (existingTransaction) {
        return {
          fromWallet: await this.getWallet(fromWalletId),
          toWallet: await this.getWallet(toWalletId),
        };
      }
    }

    // Get both wallets
    const fromWallet = await this.getWallet(fromWalletId);
    const toWallet = await this.getWallet(toWalletId);

    // Check sufficient balance
    if (fromWallet.balance < amount) {
      throw new Error('Insufficient balance');
    }

    // Create transactions
    const withdrawalTransaction = new Transaction({
      id: uuidv4(),
      walletId: fromWalletId,
      amount: -amount,
      type: TransactionType.TRANSFER,
      referenceId: `${referenceId}-from`,
      metadata: {
        action: 'transfer_out',
        toWalletId,
      },
    });

    const depositTransaction = new Transaction({
      id: uuidv4(),
      walletId: toWalletId,
      amount,
      type: TransactionType.TRANSFER,
      referenceId: `${referenceId}-to`,
      metadata: {
        action: 'transfer_in',
        fromWalletId,
      },
    });

    // Update wallet balances
    fromWallet.balance -= amount;
    toWallet.balance += amount;

    fromWallet.transactions.push(withdrawalTransaction);
    toWallet.transactions.push(depositTransaction);

    const now = new Date();
    fromWallet.updatedAt = now;
    toWallet.updatedAt = now;

    // Save changes
    this.transactions.set(withdrawalTransaction.id, withdrawalTransaction);
    this.transactions.set(depositTransaction.id, depositTransaction);
    this.referenceIds.add(referenceId);
    this.wallets.set(fromWalletId, fromWallet);
    this.wallets.set(toWalletId, toWallet);

    return { fromWallet, toWallet };
  }

  // Get wallet by ID
  async getWallet(id: string): Promise<Wallet> {
    const wallet = this.wallets.get(id);
    if (!wallet) {
      throw new NotFoundException(`Wallet with ID ${id} not found`);
    }
    return wallet;
  }

  // Get all wallets (for debugging/administration)
  async getAllWallets(): Promise<Wallet[]> {
    return Array.from(this.wallets.values());
  }

  // Get transaction history for a wallet
  async getWalletTransactions(walletId: string): Promise<Transaction[]> {
    const wallet = await this.getWallet(walletId);
    return wallet.transactions;
  }
}
