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
}
