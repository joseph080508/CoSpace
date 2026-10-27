import "dotenv/config";
import { hash } from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

const connectionString = process.env.DIRECT_URL;

if (!connectionString) {
  throw new Error("Falta configurar DIRECT_URL en el archivo .env");
}

const configuredAdminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
const configuredAdminPassword = process.env.ADMIN_PASSWORD;
const adminName =
  process.env.ADMIN_NAME?.trim() || "Administrador CoSpace";

if (!configuredAdminEmail || !configuredAdminPassword) {
  throw new Error(
    "Debes configurar ADMIN_EMAIL y ADMIN_PASSWORD en el archivo .env",
  );
}

if (configuredAdminPassword.length < 12) {
  throw new Error("ADMIN_PASSWORD debe tener al menos 12 caracteres");
}

const adminEmail: string = configuredAdminEmail;
const adminPassword: string = configuredAdminPassword;

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const spaces = [
  {
    name: "Escritorio Individual",
    description:
      "Espacio de trabajo individual, ideal para estudiar, concentrarse y trabajar de forma productiva.",
    type: "DESK" as const,
    capacity: 1,
    pricePerHour: "12000",
    imageUrl:
      "https://images.unsplash.com/photo-1497366754035-f200968a6e72",
  },
  {
    name: "Sala de Reuniones",
    description:
      "Sala equipada para reuniones de equipo, presentaciones y encuentros profesionales.",
    type: "MEETING_ROOM" as const,
    capacity: 8,
    pricePerHour: "45000",
    imageUrl:
      "https://images.unsplash.com/photo-1497366811353-6870744d04b2",
  },
  {
    name: "Cabina Privada",
    description:
      "Cabina individual para videollamadas, llamadas importantes y tareas que requieren privacidad.",
    type: "BOOTH" as const,
    capacity: 1,
    pricePerHour: "18000",
    imageUrl:
      "https://images.unsplash.com/photo-1497366216548-37526070297c",
  },
];

async function main(): Promise<void> {
  const passwordHash: string = await hash(adminPassword, 12);

  await prisma.user.upsert({
    where: {
      email: adminEmail,
    },
    update: {
      name: adminName,
      role: "ADMIN",
      passwordHash,
    },
    create: {
      name: adminName,
      email: adminEmail,
      passwordHash,
      role: "ADMIN",
    },
  });

  for (const space of spaces) {
    const existingSpace = await prisma.space.findFirst({
      where: {
        name: space.name,
      },
      select: {
        id: true,
      },
    });

    if (existingSpace) {
      await prisma.space.update({
        where: {
          id: existingSpace.id,
        },
        data: {
          ...space,
          isActive: true,
        },
      });
    } else {
      await prisma.space.create({
        data: {
          ...space,
          isActive: true,
        },
      });
    }
  }

  console.info("Seed completado correctamente.");
  console.info(`Administrador inicializado: ${adminEmail}`);
  console.info(`Espacios de ejemplo procesados: ${spaces.length}`);
}

main()
  .catch((error: unknown) => {
    console.error("Error al ejecutar el seed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });