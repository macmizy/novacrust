import { Test, TestingModule } from '@nestjs/testing';
import { WalletService } from './wallet.service';
import { ConflictException, NotFoundException } from '@nestjs/common';

describe('WalletService', () => {
  let service: WalletService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WalletService],
    }).compile();

    service = module.get<WalletService>(WalletService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createWallet', () => {
    it('should create a new wallet', async () => {
      const wallet = await service.createWallet({ id: 'test-wallet', currency: 'USD' });
      expect(wallet.id).toBe('test-wallet');
      expect(wallet.balance).toBe(0);
      expect(wallet.currency).toBe('USD');
    });

    it('should throw ConflictException if wallet already exists', async () => {
      await service.createWallet({ id: 'duplicate', currency: 'USD' });
      await expect(service.createWallet({ id: 'duplicate', currency: 'USD' }))
        .rejects
        .toThrow(ConflictException);
    });
  });

  describe('fundWallet', () => {
    it('should add funds to wallet', async () => {
      await service.createWallet({ id: 'wallet-1', currency: 'USD' });
      const funded = await service.fundWallet({
        walletId: 'wallet-1',
        amount: 100,
        referenceId: 'ref-123'
      });
      expect(funded.balance).toBe(100);
    });

    it('should be idempotent with same referenceId', async () => {
      await service.createWallet({ id: 'wallet-2', currency: 'USD' });
      const refId = 'ref-456';
      
      // First fund
      await service.fundWallet({
        walletId: 'wallet-2',
        amount: 50,
        referenceId: refId
      });
      
      // Second fund with same reference
      const result = await service.fundWallet({
        walletId: 'wallet-2',
        amount: 50,
        referenceId: refId
      });
      
      // Balance should only increase by 50, not 100
      expect(result.balance).toBe(50);
    });
  });

  describe('transferFunds', () => {
    beforeEach(async () => {
      await service.createWallet({ id: 'sender', currency: 'USD' });
      await service.createWallet({ id: 'receiver', currency: 'USD' });
      await service.fundWallet({
        walletId: 'sender',
        amount: 200,
        referenceId: 'fund-sender-1'
      });
    });

    it('should transfer funds between wallets', async () => {
      const result = await service.transferFunds({
        fromWalletId: 'sender',
        toWalletId: 'receiver',
        amount: 100,
        referenceId: 'transfer-1'
      });

      expect(result.fromWallet.balance).toBe(100);
      expect(result.toWallet.balance).toBe(100);
    });

    it('should throw error for insufficient balance', async () => {
      await expect(service.transferFunds({
        fromWalletId: 'sender',
        toWalletId: 'receiver',
        amount: 1000, // More than available
        referenceId: 'transfer-2'
      })).rejects.toThrow('Insufficient balance');
    });

    it('should be idempotent with same referenceId', async () => {
      const refId = 'transfer-3';
      
      // First transfer
      await service.transferFunds({
        fromWalletId: 'sender',
        toWalletId: 'receiver',
        amount: 50,
        referenceId: refId
      });
      
      // Second transfer with same reference
      const result = await service.transferFunds({
        fromWalletId: 'sender',
        toWalletId: 'receiver',
        amount: 50,
        referenceId: refId
      });
      
      // Should only transfer once
      expect(result.fromWallet.balance).toBe(150);
      expect(result.toWallet.balance).toBe(50);
    });
  });

  describe('getWallet', () => {
    it('should return wallet if exists', async () => {
      await service.createWallet({ id: 'get-test', currency: 'USD' });
      const wallet = await service.getWallet('get-test');
      expect(wallet).toBeDefined();
      expect(wallet.id).toBe('get-test');
    });

    it('should throw NotFoundException if wallet does not exist', async () => {
      await expect(service.getWallet('non-existent'))
        .rejects
        .toThrow(NotFoundException);
    });
  });

  describe('getWalletTransactions', () => {
    it('should return transactions for wallet', async () => {
      await service.createWallet({ id: 'tx-wallet', currency: 'USD' });
      await service.fundWallet({
        walletId: 'tx-wallet',
        amount: 100,
        referenceId: 'tx-1'
      });
      
      const transactions = await service.getWalletTransactions('tx-wallet');
      expect(transactions).toHaveLength(1);
      expect(transactions[0].amount).toBe(100);
      expect(transactions[0].type).toBe('FUND');
    });
  });
});
