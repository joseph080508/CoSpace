import type { Prisma, Role } from "../../../../generated/prisma/client";
import type {
  loginSchema,
  registerSchema,
} from "@/features/auth/schemas/auth.schema";

export type SessionUser = Prisma.UserGetPayload<{
  select: {
    id: true;
    name: true;
    email: true;
    role: true;
  };
}>;

export interface AccessTokenPayload {
  userId: string;
  role: Role;
}

export type RegisterInput = import("zod").z.infer<
  typeof registerSchema
>;

export type LoginInput = import("zod").z.infer<
  typeof loginSchema
>;

export interface AuthenticatedSession {
  user: SessionUser;
}

export interface AuthError {
  message: string;
  status: number;
}

export type StoredRefreshToken = Prisma.RefreshTokenGetPayload<{
  include: { user: true };
}>;

export type RefreshTokenRevocationResult = Prisma.BatchPayload;

export type ExistingUser = Prisma.UserGetPayload<{
  select: { id: true };
}>;

export type RegisteredUser = Prisma.UserGetPayload<{
  select: {
    id: true;
    name: true;
    email: true;
    role: true;
  };
}>;