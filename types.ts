export type TransactionType = 
  | 'deposit' 
  | 'withdrawal' 
  | 'reload' 
  | 'repair' 
  | 'loan_acquisition' 
  | 'loan_repayment';

export interface Transaction {
  id: string;
  date: string; // ISO string from backend
  type: TransactionType;
  amount: number;
  original_amount: number;
  bank_account: string;
  reason: string;
  is_paid: boolean;
  customer_name?: string;
  phone_name?: string;
  fault?: string;
  price_status?: 'Pending' | 'Added';
}

export interface AccountBalance {
  name: string;
  balance: number;
  type: 'asset' | 'liability';
}

export interface MonthlyStats {
  income: number;
  expense: number;
  net: number;
}
