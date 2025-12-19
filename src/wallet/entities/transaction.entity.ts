export enum TransactionType {
  FUND = 'FUND',
  WITHDRAW = 'WITHDRAW',
  TRANSFER = 'TRANSFER',
}

export class Transaction {
  id: string;
  walletId: string;
  amount: number;
  type: TransactionType;
  referenceId: string; // For idempotency
  metadata?: Record<string, any>;
  createdAt: Date = new Date();

  constructor(partial: Partial<Transaction>) {
    Object.assign(this, partial);
  }
}
