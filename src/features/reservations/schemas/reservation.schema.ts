import { z } from "zod";
import type { CreateReservationInput } from "@/features/reservations/types/reservation.types";

export const createReservationSchema: z.ZodType<CreateReservationInput> = z.object({
  spaceId: z.string().trim().min(1),
  startAt: z.iso.datetime({ offset: true }),
  hours: z.number().int().min(1).max(4),
}).strict();
