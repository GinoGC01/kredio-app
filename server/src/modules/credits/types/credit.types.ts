export interface CreateCreditDto {
  clientId: string;
  amount: number;
  interestRate: number;
  installments: number;
  frequency: 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY';
  currency?: 'ARS' | 'USD';
  description?: string;
  dueDate: string;
}

export interface CreditResponse {
  id: string;
  amount: number;
  interestRate: number;
  totalAmount: number;
  balance: number;
  installments: number;
  frequency: string;
  currency: string;
  description: string | null;
  status: string;
  dueDate: Date;
  clientId: string;
  createdAt: Date;
}
