export interface RegisterPaymentDto {
  creditId: string;
  amount: number;
  date?: string;
  note?: string;
}
