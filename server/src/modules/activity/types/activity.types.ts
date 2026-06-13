import { Prisma } from '@prisma/client';

export interface CreateActivityDto {
  action: string;
  entity: string;
  entityId: string;
  details?: Prisma.InputJsonValue;
}
