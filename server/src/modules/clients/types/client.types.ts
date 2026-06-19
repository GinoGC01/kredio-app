export interface CreateClientDto {
  name: string;
  phone?: string;
  email?: string;
  notes?: string;
}

export interface UpdateClientDto {
  name?: string;
  phone?: string;
  email?: string;
  notes?: string;
}

export interface ClientResponse {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  activeCredits?: number;
  totalDebt?: number;
  totalBorrowed?: number;
  totalCollected?: number;
  debtArs?: number;
  debtUsd?: number;
  clientSince?: Date;
}

export interface RecentPaymentDto {
  id: string;
  amount: number;
  date: Date;
  currency: string;
  creditId: string;
  creditDescription: string | null;
  installmentNumber: number | null;
  method: string;
}
