# CoSpace

CoSpace es una aplicación full stack para consultar y reservar espacios de coworking por horas. Los usuarios gestionan sus propias reservas; el personal administrador gestiona el catálogo y consulta las reservas del sistema.

## Tecnologías

- Next.js 16 App Router, React 19 y TypeScript estricto.
- PostgreSQL en Supabase y Prisma ORM 7 con el adaptador `pg`.
- Route handlers para el backend, Zod para validación y `jose` para JWT.
- Cookies `httpOnly`, contraseñas con bcrypt y Tailwind CSS 4.
- Vitest para pruebas unitarias de validación y reglas de reservas.
- Docker para construir y ejecutar la aplicación.

## Requisitos

- Node.js 20.19 o posterior y npm.
- Docker Engine si se desea usar contenedor.
- Proyecto de Supabase con PostgreSQL y sus cadenas de conexión.

## Instalación local

```bash
git clone <URL_DEL_REPOSITORIO>
cd cospace
npm ci
cp .env.example .env
```

Completa `.env` como se explica abajo. El comando `npm run dev` genera Prisma Client y luego inicia Next.js.

## Supabase y variables de entorno

1. Crea un proyecto en Supabase y abre **Project Settings → Database → Connection string**.
2. Copia la conexión de pooler (modo transaction) a `DATABASE_URL`; la aplicación la usa para sus consultas.
3. Copia la conexión directa IPv4/Direct a `DIRECT_URL`; Prisma la usa para migraciones y el seed.
4. Codifica los caracteres reservados de la contraseña de PostgreSQL dentro de la URL. No pegues estas credenciales en Git.
5. Crea dos secretos distintos con `openssl rand -hex 32` y asígnalos a `JWT_ACCESS_SECRET` y `JWT_REFRESH_SECRET`.
6. Define un correo y una contraseña de desarrollo para el administrador inicial. La contraseña debe tener 12 caracteres o más.

| Variable | Uso |
| --- | --- |
| `DATABASE_URL` | Conexión PostgreSQL de la app; puede ser la URL del pooler Supabase. |
| `DIRECT_URL` | Conexión directa PostgreSQL para migraciones y seed. |
| `JWT_ACCESS_SECRET` | Firma del access token; mínimo 32 caracteres. |
| `JWT_REFRESH_SECRET` | Firma independiente del refresh token; mínimo 32 caracteres. |
| `ACCESS_TOKEN_EXPIRES_IN` | Vigencia del access token: entero seguido de `s`, `m`, `h` o `d`; máximo 24 horas. Predeterminado: `15m`. |
| `REFRESH_TOKEN_EXPIRES_IN` | Vigencia del refresh token: mismo formato; máximo 90 días. Predeterminado: `7d`. |
| `ADMIN_NAME` | Nombre del administrador creado por el seed. Si se deja vacío se usa “Administrador CoSpace”. |
| `ADMIN_EMAIL` | Correo del administrador del seed; obligatorio. |
| `ADMIN_PASSWORD` | Contraseña del administrador del seed; obligatoria y de al menos 12 caracteres. |

`.env`, `.env.local` y las variantes por entorno están excluidos por `.gitignore`. `.env.example` solo contiene nombres y valores no secretos. El seed no trae una contraseña predeterminada: configura credenciales personales en `.env`.

## Base de datos

Para una base nueva o para aplicar migraciones pendientes:

```bash
npx prisma migrate deploy --config prisma.config.ts
npm run seed
```

Para desarrollar cambios de esquema en una base de desarrollo:

```bash
npx prisma migrate dev --config prisma.config.ts
```

El seed es repetible: crea o actualiza el administrador configurado y procesa tres espacios identificándolos por nombre. No borra registros. La migración `20261027003000_use_timestamptz` convierte fechas guardadas como UTC a columnas con zona horaria, preservando el instante.

## Ejecutar y compilar

```bash
npm run dev       # Prisma Client y servidor Next.js en http://localhost:3000
npm run lint      # ESLint
npm run typecheck # TypeScript sin emitir archivos
npm test          # Vitest
npm run build     # Genera Prisma Client y build de producción
npm start         # Sirve el build de producción
```

El build de Next.js no necesita una conexión a una base real. Para ejecutar funcionalidades que consultan datos sí se requiere `DATABASE_URL`; para migraciones y seed se necesita además `DIRECT_URL`.

## Docker

El Dockerfile usa etapas separadas para dependencias, compilación y ejecución. En la compilación genera Prisma Client con una URL local ficticia; no pasa secretos como argumentos de build. Las conexiones y secretos se entregan al iniciar el contenedor:

```bash
docker build -t cospace .
docker run --rm -p 3000:3000 \
  -e DATABASE_URL="$DATABASE_URL" \
  -e DIRECT_URL="$DIRECT_URL" \
  -e JWT_ACCESS_SECRET="$JWT_ACCESS_SECRET" \
  -e JWT_REFRESH_SECRET="$JWT_REFRESH_SECRET" \
  -e ACCESS_TOKEN_EXPIRES_IN=15m \
  -e REFRESH_TOKEN_EXPIRES_IN=7d \
  cospace
```

No se incluye Compose porque la base de datos vive en Supabase. Ejecuta las migraciones desde el host o desde un trabajo de despliegue con `DIRECT_URL`; no se aplican automáticamente al arrancar cada instancia web.

## Funcionalidades y reglas

- Página pública estática, catálogo y detalle de espacios obtenidos de PostgreSQL.
- Registro e inicio de sesión; los administradores se crean mediante el seed, nunca mediante el registro público.
- Dashboard con reservas reales del usuario autenticado y cancelación sujeta a permisos.
- Panel para crear, editar y desactivar espacios, y consultar reservas.
- Reservas de 1 a 4 horas completas, entre 07:00 y 21:00 de `America/Bogota`, desde ahora hasta 30 días.
- Sin solapamiento de reservas confirmadas por espacio o usuario, máximo tres futuras por usuario y precio calculado en el servidor.
- Una reserva cancelada conserva su fila y su historial. Solo propietario o administrador pueden cancelarla; el propietario debe hacerlo con al menos dos horas de antelación.
- Un espacio con reservas futuras confirmadas no se puede desactivar.
- Interfaz en español e inglés; el selector conserva la elección en el navegador.

La comprobación de concurrencia en creación usa transacciones serializables de PostgreSQL. El despliegue necesita una base Supabase que permita este aislamiento a través de la conexión configurada.

## Endpoints

| Método | Ruta | Acceso | Función |
| --- | --- | --- | --- |
| `POST` | `/api/auth/registro` | Público | Registrar usuario normal. |
| `POST` | `/api/auth/login` | Público | Iniciar sesión y emitir cookies. |
| `POST` | `/api/auth/refresh` | Refresh cookie | Rotar refresh token y renovar access token. |
| `POST` | `/api/auth/logout` | Sesión | Revocar refresh token y limpiar cookies. |
| `GET` | `/api/auth/session` | Sesión | Consultar usuario autenticado. |
| `GET` | `/api/spaces` | Público | Listar espacios activos. |
| `GET` | `/api/spaces/[id]` | Público | Consultar un espacio activo. |
| `GET` | `/api/reservations` | Usuario | Listar reservas propias. |
| `POST` | `/api/reservations` | Usuario | Crear una reserva válida. |
| `PATCH` | `/api/reservations/[id]/cancel` | Propietario o admin | Cancelar sin borrar. |
| `GET`, `POST` | `/api/admin/spaces` | Admin | Consultar y crear espacios. |
| `PATCH`, `DELETE` | `/api/admin/spaces/[id]` | Admin | Editar o desactivar un espacio. |
| `GET` | `/api/admin/reservations` | Admin | Consultar reservas del sistema. |

Los endpoints verifican autenticación, rol, propiedad, entrada y reglas en servidor; el proxy solo añade redirecciones para las páginas. Las cookies son `httpOnly`, `sameSite=lax` y `secure` en producción. Los access tokens son JWT breves; los refresh tokens se almacenan hasheados y se rotan al renovar.

## Pruebas y calidad

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

Las pruebas actuales cubren esquemas, horarios en Bogotá, reservas pasadas o fuera de anticipación, solapamientos con límites contiguos, máximo de reservas, cálculo del total y autorización/ventana de cancelación. Para probar consultas de integración y operaciones simultáneas se necesita una base PostgreSQL de prueba; no se usa automáticamente la base de producción.

## Estructura

```text
src/app/(public)/       Inicio, catálogo y detalle
src/app/(auth)/         Login y registro
src/app/(private)/      Dashboard de reservas
src/app/(admin)/        Administración
src/app/api/            Route handlers
src/features/           Esquemas, servicios y tipos por dominio
src/lib/auth/           JWT, cookies y sesión
src/i18n/               Traducciones español/inglés
prisma/                 Esquema, migraciones y seed
tests/                  Pruebas Vitest
```

## Despliegue en Vercel

1. Importa el repositorio en Vercel y configura las variables de la tabla como Production/Preview según el entorno.
2. Usa la URL pooled de Supabase en `DATABASE_URL` y la directa en `DIRECT_URL`.
3. Define secretos JWT independientes en Vercel y no los expongas como variables `NEXT_PUBLIC_*`.
4. Antes de servir la nueva versión, ejecuta `npx prisma migrate deploy --config prisma.config.ts` desde un job con acceso a `DIRECT_URL`.
5. Ejecuta el seed una vez con las credenciales administrativas iniciales; luego cambia la contraseña desde un proceso seguro de gestión de usuarios.
6. Confirma HTTPS y que el dominio de la app sea el previsto. No hay una URL de producción configurada en este repositorio.

## Pendientes y límites del entorno

- No se implementa rate limiting distribuido para login. En Vercel serverless, un limitador en memoria no sería suficiente; para producción hace falta integrar un almacén compartido (por ejemplo Redis/Upstash) y definir sus credenciales.
- Las migraciones, el seed y los flujos completos requieren credenciales reales de Supabase; no se incluyen en el repositorio.
- No se afirma un despliegue real ni una compilación/ejecución Docker hasta realizarlos en un entorno con permisos de proceso y acceso al daemon correspondiente.
# CoSpace
