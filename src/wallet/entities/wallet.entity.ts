import { Transaction } from './transaction.entity';

export class Wallet {
  id: string;
  currency: string = 'USD'; // Default currency is USD
  balance: number = 0;
  transactions: Transaction[] = [];
  createdAt: Date = new Date();
  updatedAt: Date = new Date();
}
