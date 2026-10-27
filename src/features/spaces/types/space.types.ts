import type { Prisma } from "../../../../generated/prisma/client";

type ActiveSpaceSelect = {
  id: true;
  name: true;
  description: true;
  type: true;
  imageUrl: true;
  capacity: true;
  pricePerHour: true;
};

export const activeSpaceSelect: ActiveSpaceSelect = {
  id: true,
  name: true,
  description: true,
  type: true,
  imageUrl: true,
  capacity: true,
  pricePerHour: true,
} satisfies Prisma.SpaceSelect;

export type ActiveSpace = Prisma.SpaceGetPayload<{
  select: typeof activeSpaceSelect;
}>;

export type ActiveSpaceList = ActiveSpace[];

export interface SpaceRouteContext {
  params: Promise<{ id: string }>;
}

export interface GetActiveSpaceByIdParams {
  id: string;
}
