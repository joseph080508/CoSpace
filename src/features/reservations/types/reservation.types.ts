import type { Prisma } from "../../../../generated/prisma/client";

export interface CreateReservationInput {
  spaceId: string;
  startAt: string;
  hours: number;
}

export interface ReservationRouteContext {
  params: Promise<{ id: string }>;
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