import type { Prisma } from "../../../../generated/prisma/client";

export interface CreateReservationInput {
  spaceId: string;
  startAt: string;
  hours: number;
}

export interface ReservationRouteContext {
  params: Promise<{ id: string }>;
}

export interface CreateReservationParams {
  userId: string;
  input: CreateReservationInput;
}

export interface CancelReservationParams {
  reservationId: string;
  userId: string;
  isAdmin: boolean;
}

export interface GetUserReservationsParams {
  userId: string;
}

export interface ReservationErrorDetails {
  message: string;
  status: number;
}

export type CreatedReservation = Prisma.ReservationGetPayload<{
  select: {
    id: true;
    spaceId: true;
    startAt: true;
    endAt: true;
    hours: true;
    totalPrice: true;
    status: true;
  };
}>;

export type UserReservation = Prisma.ReservationGetPayload<{
  select: {
    id: true;
    startAt: true;
    endAt: true;
    hours: true;
    totalPrice: true;
    status: true;
    createdAt: true;
    space: {
      select: {
        id: true;
        name: true;
        type: true;
        imageUrl: true;
        pricePerHour: true;
      };
    };
  };
}>;

export type UserReservationList = UserReservation[];

export interface CancelledReservation {
  id: string;
  status: "CANCELLED";
}
