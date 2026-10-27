import type { Prisma } from "../../../../generated/prisma/client";
import type {
  createSpaceSchema,
  updateSpaceSchema,
} from "@/features/admin/schemas/space-admin.schema";

export type CreateSpaceInput = import("zod").z.infer<
  typeof createSpaceSchema
>;

export type UpdateSpaceInput = import("zod").z.infer<
  typeof updateSpaceSchema
>;

type AdminSpaceSelect = {
  id: true;
  name: true;
  description: true;
  type: true;
  imageUrl: true;
  capacity: true;
  pricePerHour: true;
  isActive: true;
  createdAt: true;
  updatedAt: true;
};

export const adminSpaceSelect: AdminSpaceSelect = {
  id: true,
  name: true,
  description: true,
  type: true,
  imageUrl: true,
  capacity: true,
  pricePerHour: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.SpaceSelect;

export type AdminSpace = Prisma.SpaceGetPayload<{
  select: typeof adminSpaceSelect;
}>;

export type AdminSpaceList = AdminSpace[];

export interface AdminSpaceRouteContext {
  params: Promise<{ id: string }>;
}

export interface SpaceAdminErrorDetails {
  message: string;
  status: number;
}

export type ExistingSpaceForUpdate = Pick<AdminSpace, "id">;

export type SpaceActivationState = Prisma.SpaceGetPayload<{
  select: {
    id: true;
    isActive: true;
  };
}>;