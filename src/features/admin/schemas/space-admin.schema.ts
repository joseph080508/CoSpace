import { z } from "zod";

const spaceFields = {
  name: z.string().trim().min(2).max(100),
  description: z.string().trim().min(10).max(2000),
  type: z.enum(["DESK", "MEETING_ROOM", "BOOTH"]),
  imageUrl: z.string().url().max(2048).refine((value) => new URL(value).hostname === "images.unsplash.com", "Usa una URL de images.unsplash.com.").nullable().optional(),
  capacity: z.number().int().min(1).max(1000),
  pricePerHour: z.number().positive().max(10000000),
} satisfies z.ZodRawShape;

export const createSpaceSchema = z.object(spaceFields).strict();

export const updateSpaceSchema = z
  .object(spaceFields)
  .partial()
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: "Debes proporcionar al menos un campo para actualizar.",
  });
