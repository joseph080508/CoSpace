import type { Prisma } from "../../../../generated/prisma/client";

export interface CreateSpaceInput {
  name: string;
  description: string;
  type: "DESK" | "MEETING_ROOM" | "BOOTH";
  imageUrl?: string | null;
  capacity: number;
  pricePerHour: number;
}

export interface UpdateSpaceInput {
  name?: string;
  description?: string;
  type?: "DESK" | "MEETING_ROOM" | "BOOTH";
  imageUrl?: string | null;
  capacity?: number;
  pricePerHour?: number;
}

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
