import { prisma } from "@/lib/prisma";
import {
  activeSpaceSelect,
  type ActiveSpace,
  type ActiveSpaceList,
} from "@/features/spaces/types/space.types";

export async function getActiveSpaces(): Promise<ActiveSpaceList> {
  return prisma.space.findMany({
    where: { isActive: true },
    select: activeSpaceSelect,
    orderBy: { createdAt: "desc" },
  });
}

export async function getActiveSpaceById(
  id: string,
): Promise<ActiveSpace | null> {
  return prisma.space.findFirst({
    where: {
      id,
      isActive: true,
    },
    select: activeSpaceSelect,
  });
}
