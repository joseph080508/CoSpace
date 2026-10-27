# CoSpace

CoSpace es una aplicación web para descubrir y reservar por horas espacios de coworking. Reúne en una plataforma el catálogo público de espacios, la gestión personal de reservas y las herramientas administrativas para mantener el catálogo y consultar las reservas.

Este repositorio contiene una aplicación full stack construida con Next.js App Router. La interfaz y las API viven en el mismo proyecto; PostgreSQL almacena usuarios, espacios, reservas y refresh tokens.

## Tabla de contenidos

- [Objetivo y alcance](#objetivo-y-alcance)
- [Funcionalidades por rol](#funcionalidades-por-rol)
- [Tecnologías y arquitectura](#tecnologías-y-arquitectura)
- [Requisitos](#requisitos)
- [Configuración e instalación local](#configuración-e-instalación-local)
- [Variables de entorno](#variables-de-entorno)
- [Cuentas de desarrollo](#cuentas-de-desarrollo)
- [Credenciales de prueba](#credenciales-de-prueba)
- [Reglas de negocio](#reglas-de-negocio)
- [API HTTP](#api-http)
- [Base de datos y Prisma](#base-de-datos-y-prisma)
- [Autenticación y seguridad](#autenticación-y-seguridad)
- [Internacionalización e interfaz](#internacionalización-e-interfaz)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Pruebas y calidad](#pruebas-y-calidad)
- [Docker](#docker)
- [Despliegue en Vercel y Supabase](#despliegue-en-vercel-y-supabase)
- [Solución de problemas](#solución-de-problemas)
- [Estado de verificación y limitaciones](#estado-de-verificación-y-limitaciones)

## Objetivo y alcance

El objetivo general es facilitar la búsqueda y reserva de espacios compartidos de trabajo, evitando conflictos de horario y ofreciendo herramientas diferenciadas para usuarios y administradores.

El flujo general es: una persona visitante revisa el catálogo y el detalle de un espacio; inicia sesión o se registra; selecciona una fecha, hora de inicio y duración; el servidor valida disponibilidad y reglas de negocio, calcula el importe y guarda la reserva; después, el usuario consulta o cancela sus reservas desde el dashboard. El administrador gestiona los espacios y consulta todas las reservas.

Los precios de los espacios de ejemplo están expresados en pesos colombianos (COP). El modelo de datos guarda el precio por hora y el total de cada reserva.

## Funcionalidades por rol

| Rol | Acceso y capacidades implementadas |
| --- | --- |
| Visitante | Página de inicio, catálogo y detalle de espacios activos, registro e inicio de sesión. |
| Usuario (`USER`) | Dashboard, consulta de reservas propias, creación de reservas y cancelación de sus reservas que cumplan la ventana permitida. |
| Administrador (`ADMIN`) | Panel administrativo, creación y edición de espacios, desactivación sujeta a las reglas de negocio y consulta de reservas del sistema. También puede usar las páginas públicas. |

El registro público siempre asigna el rol `USER`. Las cuentas `ADMIN` se preparan mediante el seed configurado por variables de entorno; el formulario público no permite elegir ese rol.

## Tecnologías y arquitectura

- **Aplicación web:** Next.js 16 App Router, React 19 y TypeScript en modo estricto.
- **Estilos e interfaz:** Tailwind CSS 4, CSS global y componentes compartidos.
- **API y validación:** Route Handlers de Next.js y esquemas Zod.
- **Persistencia:** PostgreSQL (configurable con Supabase), Prisma ORM 7 y adaptador `@prisma/adapter-pg`.
- **Autenticación:** contraseñas con bcryptjs y JWT HS256 mediante `jose`.
- **Pruebas:** Vitest.
- **Contenedor:** Dockerfile multi-stage; no hay archivo Docker Compose.

Las páginas de `src/app` componen la interfaz. Los Route Handlers reciben las solicitudes HTTP y delegan operaciones en servicios por dominio. Prisma conecta los servicios con PostgreSQL. Las reglas relevantes también se vuelven a validar en el servidor; la interfaz no es la autoridad de permisos ni de disponibilidad.

## Requisitos

- **Node.js:** el Dockerfile utiliza Node.js 20. El repositorio no fija `engines`, `.nvmrc` ni `.node-version`; usa Node.js 20 o una versión LTS compatible con Next.js 16. En el entorno de documentación se observó Node.js 22.23.2.
- **npm:** se requiere npm para `npm ci` y los scripts. El entorno de documentación usa npm 10.9.2; `package-lock.json` fija el árbol de dependencias.
- **PostgreSQL:** una instancia PostgreSQL accesible desde la aplicación. Supabase es la configuración documentada: una URL de pooler para el runtime y una URL directa para migraciones y seed.
- **OpenSSL:** necesario únicamente para generar secretos JWT con el comando sugerido.
- **Docker Engine:** opcional, solo para la ejecución en contenedor.

El repositorio no incluye PostgreSQL local ni Compose. Las funciones que consultan o escriben datos requieren una base configurada y migrada.

## Configuración e instalación local

### 1. Obtener el proyecto e instalar dependencias

Sustituye el marcador por la URL real del repositorio:

```bash
git clone <URL_DEL_REPOSITORIO>
cd cospace
npm ci
```

### 2. Crear y configurar el entorno

```bash
cp .env.example .env
```

Rellena `.env` con las variables de [Variables de entorno](#variables-de-entorno). Para Supabase, obtén las cadenas en la configuración de conexión de la base de datos. Usa la URL pooled en `DATABASE_URL` para las consultas de la aplicación y la URL directa en `DIRECT_URL` para migraciones y seed. Codifica los caracteres reservados de las contraseñas dentro de las URLs.

Genera dos secretos diferentes, uno para cada variable JWT:

```bash
openssl rand -hex 32
openssl rand -hex 32
```

No reutilices los valores generados entre entornos ni los guardes en Git.

### 3. Preparar la base de datos

Genera Prisma Client explícitamente si vas a ejecutar un comando Prisma aislado:

```bash
npx prisma generate --config prisma.config.ts
```

Aplica las migraciones versionadas, en orden cronológico:

```bash
npx prisma migrate deploy --config prisma.config.ts
```

Inicializa las dos cuentas de desarrollo y tres espacios de muestra:

```bash
npm run seed
```

`npm run dev` y `npm run build` también generan Prisma Client antes de ejecutar Next.js. No es necesario ejecutar `migrate dev` para una instalación normal; se usa durante el desarrollo de cambios de esquema. No uses `migrate reset` en una base con datos que quieras conservar.

### 4. Ejecutar en modo desarrollo

```bash
npm run dev
```

Abre <http://localhost:3000>. La página de inicio se puede mostrar sin sesión; el catálogo y las operaciones de datos requieren una base accesible.

### 5. Compilar y ejecutar la versión de producción

```bash
npm run build
npm start
```

`npm start` sirve el build anterior y usa por defecto el puerto 3000. La instancia requiere las variables de runtime, especialmente `DATABASE_URL` y los secretos JWT. Configura el entorno como producción en el proveedor para que las cookies se emitan con `Secure`.

## Variables de entorno

Los nombres de esta tabla corresponden a `.env.example` y al código del proyecto. No se deben añadir prefijos `NEXT_PUBLIC_` a las variables secretas.

| Variable | Obligatoria | Propósito y formato |
| --- | --- | --- |
| `DATABASE_URL` | Sí, para consultas de la aplicación | URL PostgreSQL usada por Prisma en runtime; se recomienda la conexión pooled de Supabase. Ejemplo ficticio: `postgresql://usuario:clave@host:6543/postgres?sslmode=require`. Sustituye todos los datos por los del proveedor. |
| `DIRECT_URL` | Sí, para seed; recomendada para migraciones | URL PostgreSQL directa. `prisma.config.ts` prefiere esta variable y usa `DATABASE_URL` como alternativa. El seed requiere explícitamente `DIRECT_URL`. Obtén la cadena desde el proveedor. |
| `JWT_ACCESS_SECRET` | Sí, al emitir/verificar sesiones | Secreto de firma del access token, al menos 32 caracteres. Genera uno con `openssl rand -hex 32`. |
| `JWT_REFRESH_SECRET` | Sí, al emitir/verificar sesiones | Secreto separado para refresh tokens, al menos 32 caracteres. Genera otro valor independiente con `openssl rand -hex 32`. |
| `ACCESS_TOKEN_EXPIRES_IN` | No | Duración con entero y unidad `s`, `m`, `h` o `d`; máximo 24 horas. Predeterminado en el código: `15m`. |
| `REFRESH_TOKEN_EXPIRES_IN` | No | Duración con entero y unidad `s`, `m`, `h` o `d`; máximo 90 días. Predeterminado en el código: `7d`. |
| `ADMIN_NAME` | No, para el seed | Nombre de la cuenta administrativa; valor predeterminado: `Administrador CoSpace`. |
| `ADMIN_EMAIL` | Sí, para el seed | Correo de desarrollo que recibirá el rol `ADMIN`. Configúralo tú; el repositorio no contiene una cuenta fija. |
| `ADMIN_PASSWORD` | Sí, para el seed | Contraseña de desarrollo de al menos 12 caracteres. No existe una contraseña predeterminada. |
| `USER_NAME` | No, para el seed | Nombre de la cuenta normal; valor predeterminado: `Usuario CoSpace`. |
| `USER_EMAIL` | Sí, para el seed | Correo de desarrollo para una cuenta `USER`, distinto de `ADMIN_EMAIL`. Configúralo tú; no hay una cuenta fija en el repositorio. |
| `USER_PASSWORD` | Sí, para el seed | Contraseña de desarrollo de al menos 12 caracteres. No existe una contraseña predeterminada. |

En `NODE_ENV=production`, las cookies de autenticación llevan `Secure`; Next.js y el proveedor suelen establecer este valor al ejecutar el build/servidor de producción. No configures `NODE_ENV` como variable pública.

Para producción, usa valores de alta entropía almacenados en el gestor de secretos del proveedor; separa credenciales de desarrollo, Preview y Production; usa cadenas SSL del proveedor; y no ejecutes el seed de cuentas de desarrollo en producción. Rota las claves de forma planificada: cambiar un secreto invalida los tokens firmados anteriormente con ese secreto.

## Cuentas de desarrollo

El seed original solo preparaba un administrador y espacios de ejemplo. Se amplió para incluir una cuenta `USER` configurable. Las dos cuentas se crean o actualizan mediante `upsert`, normalizando los correos a minúsculas y almacenando las contraseñas con bcrypt (factor de coste 12). Se requiere configurar credenciales distintas y contraseñas de al menos 12 caracteres.

| Rol | Correo electrónico | Contraseña | Acceso |
| --- | --- | --- | --- |
| Administrador | Valor configurado en `ADMIN_EMAIL` | Valor configurado en `ADMIN_PASSWORD` | `/admin` y páginas públicas |
| Usuario normal | Valor configurado en `USER_EMAIL` | Valor configurado en `USER_PASSWORD` | `/dashboard`, reservas y páginas públicas |

No se incluyen credenciales de ejemplo presentadas como existentes. Después de configurar `.env`, ejecuta `npm run seed`; inicia sesión con los valores que configuraste. Estas cuentas son únicamente para desarrollo: no configures ni ejecutes estas cuentas de seed en producción. La ejecución del seed en una base existente actualizará el nombre, rol y hash de contraseña de las cuentas con esos correos, además de crear/actualizar los espacios de muestra.

**Verificación de cuentas:** el código del seed fue inspeccionado y la idempotencia se verificó a nivel de implementación (`upsert` por correo). No se ejecutó contra la base conectada durante esta revisión, por lo que no se afirma que estas cuentas ya existan en una base concreta ni que sus credenciales hayan sido probadas allí. Después de ejecutar el seed en una base autorizada, verifica el acceso con el formulario de login.

## Credenciales de prueba

Estas credenciales corresponden a cuentas encontradas en la base configurada. La contraseña del administrador se contrastó con su hash almacenado mediante bcrypt, sin alterar la base. Son credenciales de prueba y no deben reutilizarse en producción.

| Rol | Correo electrónico | Contraseña | Verificación |
| --- | --- | --- | --- |
| Administrador | `admin@cospace.com` | `admin12345678` | Verificada: rol ADMIN y la contraseña coincide con el hash almacenado. |
| Usuario normal | `usuario.test@cospace.co` | No verificable | La cuenta existe con rol USER, pero no hay una contraseña configurada que pueda contrastarse. No se publica una contraseña inventada. |

Para probar la cuenta normal, registra un usuario nuevo desde `/registro` o ejecuta el seed con `USER_EMAIL` y `USER_PASSWORD` configurados.

## Reglas de negocio

Las reglas se aplican desde los servicios de backend en `src/features/reservations/services` y `src/features/admin/services`.

- Una reserva dura de **1 a 4 horas**, en horas completas.
- El inicio debe estar en el futuro y no puede superar **30 días** de anticipación.
- El horario permitido es de **07:00 a 21:00, hora de Bogotá** (`America/Bogota`). El intervalo debe empezar en una hora exacta y terminar a más tardar a las 21:00.
- El código aplica el desplazamiento fijo UTC−5 al validar el horario. Para la zona IANA de Bogotá esto coincide con la hora civil actual; la fecha de reserva se guarda como instante UTC en PostgreSQL (`TIMESTAMPTZ`).
- Los intervalos se tratan como `[inicio, fin)`: dos reservas contiguas pueden compartir el límite final/inicial, pero no solaparse.
- Una reserva confirmada no puede solaparse con otra confirmada del mismo espacio ni con otra del mismo usuario.
- Un usuario puede tener hasta **tres reservas futuras confirmadas** al crear otra.
- El precio total se calcula en el servidor como `precioPorHora × horas`, usando el precio almacenado para el espacio.
- El usuario solo puede cancelar sus propias reservas confirmadas y debe hacerlo con al menos **dos horas** antes del inicio. El administrador puede cancelar una reserva confirmada sin esa restricción temporal. Una reserva cancelada no se elimina y no puede cancelarse otra vez.
- No se puede reservar un espacio inactivo. Un administrador no puede desactivar un espacio que tenga reservas futuras confirmadas. La desactivación conserva el registro y sus reservas históricas.
- Los errores de concurrencia en la transacción serializable de creación se devuelven como conflicto para que el cliente pueda reintentar.

## API HTTP

Las respuestas exitosas son JSON. Las rutas protegidas validan la cookie y vuelven a consultar el usuario en la base de datos. Salvo que se indique, errores generales pueden responder `500`.

| Método y ruta | Acceso | Entrada relevante | Respuesta / errores principales |
| --- | --- | --- | --- |
| `POST /api/auth/registro` | Público | JSON: `name`, `email`, `password` (8–72 caracteres; nombre 2–80). El rol siempre es `USER`. | `201 { user }`; `400` datos inválidos; `409` correo ya registrado; `500` error interno. Emite cookies de sesión. |
| `POST /api/auth/login` | Público | JSON: `email`, `password` (hasta 72 caracteres). | `200 { user }`; `400` formato inválido; `401` credenciales incorrectas; `500` error interno. Emite cookies. |
| `POST /api/auth/refresh` | Cookie `refresh_token` | Sin cuerpo. | `200 { success: true }` y rota tokens; `401` sesión ausente, vencida, revocada o no válida. |
| `POST /api/auth/logout` | Sesión/cookie, si existe | Sin cuerpo. | `200 { message }`, revoca el refresh token recibido y limpia cookies; `500` si falla la operación. |
| `GET /api/auth/session` | Cookie de sesión | Sin parámetros. | `200 { authenticated: true, user }`; `401` no autenticado; `500` error interno. Envía `Cache-Control: no-store`. |
| `GET /api/spaces` | Público | Sin parámetros. | `200 { spaces }` con espacios activos; `500` error interno. |
| `GET /api/spaces/[id]` | Público | ID en la ruta. | `200 { space }`; `404` si no existe o no está activo; `500` error interno. |
| `GET /api/reservations` | Usuario autenticado | Sin parámetros. | `200 { reservations, currentTime }`, solo reservas propias; `401` sin sesión; `500` error interno. |
| `POST /api/reservations` | Usuario autenticado | JSON: `spaceId`, `startAt` ISO con offset, `hours` entero de 1 a 4. | `201 { reservation }`; `400` entrada/reglas de fecha; `401` sin sesión; `404` espacio inexistente/inactivo; `409` límite, solapamiento o conflicto concurrente; `500` error interno. |
| `PATCH /api/reservations/[id]/cancel` | Propietario o administrador | ID de reserva en la ruta; sin cuerpo. | `200 { reservation }`; `400` ventana de cancelación; `401` sin sesión; `403` no es propietario; `404` no existe; `409` ya cancelada o estado concurrente; `500` error interno. |
| `GET /api/admin/spaces` | Administrador | Sin parámetros. | `200 { data }`; `401` sin sesión; `403` rol insuficiente; `500` error interno. |
| `POST /api/admin/spaces` | Administrador | JSON: `name`, `description`, `type` (`DESK`, `MEETING_ROOM`, `BOOTH`), `capacity`, `pricePerHour`; opcionales `imageUrl` permitido. | `201 { data }`; `400` validación; `401`; `403`; `500`. |
| `PATCH /api/admin/spaces/[id]` | Administrador | Uno o más campos válidos del alta; no se acepta un objeto vacío. | `200 { data }`; `400` validación; `401`; `403`; `404` no existe; `500`. |
| `DELETE /api/admin/spaces/[id]` | Administrador | ID en la ruta. El borrado lógico establece `isActive=false`. | `200 { data }`; `401`; `403`; `404`; `409` reservas futuras o ya inactivo; `500`. |
| `GET /api/admin/reservations` | Administrador | Sin parámetros. | `200 { data }` con reservas y referencias de usuario/espacio; `401`; `403`; `500`. |

La API de administración acepta imágenes únicamente de URLs `https://images.unsplash.com`. Los campos de entrada se validan en el servidor con Zod. No se documentan endpoints adicionales a los Route Handlers presentes en el repositorio.

## Base de datos y Prisma

La base de datos es PostgreSQL. El cliente Prisma usa el generador `prisma-client` y se escribe en `generated/prisma`; la conexión runtime se adapta con `@prisma/adapter-pg`.

| Modelo | Responsabilidad |
| --- | --- |
| `User` | Nombre, correo único, hash de contraseña y rol `USER`/`ADMIN`. |
| `Space` | Catálogo, tipo, capacidad, precio por hora y estado activo. |
| `Reservation` | Usuario, espacio, inicio/fin, horas, precio total y estado `CONFIRMED`/`CANCELLED`. Las relaciones impiden borrar físicamente usuarios/espacios con reservas. |
| `RefreshToken` | Hash único del refresh token, usuario, caducidad y fecha de revocación. Se elimina en cascada al borrar el usuario. |

Las migraciones del repositorio están ordenadas así:

1. `20261027000000_init`: crea enums, tablas, índices y relaciones iniciales.
2. `20261027003000_use_timestamptz`: convierte fechas de `TIMESTAMP` a `TIMESTAMPTZ(3)`, interpretando los valores previos como UTC.

**Migración pendiente identificada:** una comprobación previa de estado en la base configurada informó que `20261027003000_use_timestamptz` todavía estaba pendiente. No se aplicó durante esta revisión. Antes de desplegar o probar con esa base, confirma que el proveedor y el entorno corresponden a la base correcta, revisa una copia de seguridad y luego aplica las migraciones con `npx prisma migrate deploy --config prisma.config.ts`. No ejecutes `migrate reset` sobre datos existentes. Comprueba el estado con:

```bash
npx prisma migrate status --config prisma.config.ts
```

El seed crea/actualiza las cuentas de desarrollo y tres espacios. Es repetible por correo para cuentas y por nombre para espacios; no elimina filas. Se conecta mediante `DIRECT_URL`. Las credenciales se guardan hasheadas, no en texto plano.

Comandos Prisma usados por este proyecto:

```bash
# Cliente generado desde el esquema actual
npx prisma generate --config prisma.config.ts

# Desarrollo de esquema en una base de desarrollo
npx prisma migrate dev --config prisma.config.ts

# Aplicar migraciones existentes (CI/producción)
npx prisma migrate deploy --config prisma.config.ts

# Ejecutar el seed configurado en prisma.config.ts
npm run seed
```

Usa `migrate dev` solo en una base de desarrollo; para un despliegue que aplica migraciones versionadas, usa `migrate deploy` en un paso controlado antes de atender tráfico.

## Autenticación y seguridad

- Las contraseñas de registro y seed se hashean con bcryptjs y coste 12.
- El login emite access y refresh JWT firmados con secretos distintos y algoritmo HS256. Los límites aceptados son 24 horas para access y 90 días para refresh; los valores por defecto son 15 minutos y 7 días.
- Los tokens viajan en cookies `httpOnly`, `sameSite=lax`, `path=/`; `Secure` se activa cuando `NODE_ENV=production`. No se guardan tokens en `localStorage`.
- Los refresh tokens se guardan en la base de datos como SHA-256, se rotan al renovar y se revocan en logout. La validación de sesión consulta al usuario y el refresh token activo.
- El proxy de Next.js redirige visitantes de rutas privadas y bloquea el acceso de usuarios normales a páginas `/admin`. Las API verifican autorización en backend independientemente de la navegación.
- `requireUser` y `requireAdmin` protegen servicios API. Las reservas se filtran por propietario y las operaciones administrativas requieren `ADMIN`.
- Las entradas se validan con Zod. Las reglas de reserva, autorización y cálculo del precio se ejecutan en el servidor.

Estas medidas no reemplazan la configuración operativa del proveedor. El repositorio no implementa rate limiting distribuido para login ni un mecanismo de restablecimiento de contraseñas.

## Internacionalización e interfaz

La interfaz dispone de traducciones en español e inglés en `src/i18n/translations.es.ts` y `src/i18n/translations.en.ts`. `LanguageProvider` y `LanguageSelector` permiten cambiar el idioma; la selección se almacena en `localStorage` bajo `cospace-language`, con español como valor inicial.

El layout público comparte encabezado y pie de página. Hay componentes UI reutilizables para botones, tarjetas, skeletons, badges y estados vacíos. Las páginas usan estilos adaptables y diseños en columnas que se ajustan en anchos menores; los componentes de imagen usan `next/image` y los dominios remotos se restringen en `next.config.ts` a `images.unsplash.com`.

## Estructura del proyecto

```text
src/
├── app/
│   ├── (public)/                 # Inicio, catálogo y detalle público
│   ├── (auth)/                   # Login y registro
│   ├── (private)/                # Dashboard protegido
│   └── api/                      # Route Handlers de auth, espacios y reservas
├── components/                   # Layout, logout, selector y componentes UI
├── features/
│   ├── admin/                    # Tipos, esquemas y servicio administrativo
│   ├── auth/                     # Contexto de sesión, tipos y validaciones
│   ├── reservations/             # Tipos, esquemas, reglas y servicio
│   └── spaces/                   # Tipos, catálogo, detalle y servicio
├── i18n/                         # Contexto, persistencia y traducciones
└── lib/                          # Prisma y utilidades de auth (cookies/JWT/sesión)
prisma/
├── migrations/                   # Migraciones SQL versionadas
├── schema.prisma                 # Modelos, relaciones y enums
└── seed.ts                       # Cuentas y espacios de desarrollo
tests/                            # Pruebas unitarias de reglas y esquemas
Dockerfile
next.config.ts
prisma.config.ts
package.json
```

Las rutas administrativas se encuentran directamente en `src/app/(admin)/admin`; el paréntesis del route group no aparece en la URL. Las validaciones de API están junto a cada dominio en `src/features/*/schemas`, y sus servicios de negocio en `src/features/*/services`.

## Pruebas y calidad

Scripts disponibles en `package.json`:

| Comando | Qué ejecuta |
| --- | --- |
| `npm run lint` | ESLint con la configuración del repositorio. |
| `npm run typecheck` | `tsc --noEmit`; revisa tipos sin emitir archivos. |
| `npm test` | `vitest run`; ejecuta las pruebas automatizadas. |
| `npm run build` | Genera Prisma Client y crea el build de Next.js. |

Las pruebas cubren validación de formularios y espacios, intervalos, horario de Bogotá, fechas pasadas y anticipación, límite de reservas, cálculo de total, cancelación y existencia de reservas que impiden desactivar un espacio.

Verificación ejecutada para esta revisión: `npm run lint`, `npm run typecheck`, `npx prisma validate --config prisma.config.ts`, `npm test` y `npm run build` finalizaron correctamente. Vitest reportó **23 pruebas aprobadas y 0 fallidas**. No hay pruebas de integración de base de datos en la suite actual.

## Docker

El Dockerfile define tres etapas (`dependencies`, `builder`, `runner`), usa Node.js 20 Alpine y expone el puerto 3000. No hay `docker-compose.yml`; la base se conecta externamente. `.dockerignore` excluye dependencias locales, builds, archivos `.env*`, credenciales y documentación.

Construcción:

```bash
docker build -t cospace .
```

Ejecución — exporta las variables en el shell desde tu gestor local de secretos o introdúcelas de forma segura:

```bash
docker run --rm --name cospace -p 3000:3000 \
  -e DATABASE_URL \
  -e JWT_ACCESS_SECRET \
  -e JWT_REFRESH_SECRET \
  cospace
```

`DIRECT_URL` no es necesaria para servir solicitudes normales; se necesita en el entorno controlado que aplica migraciones o ejecuta el seed. Para inspeccionar logs mientras el contenedor está activo:

```bash
docker logs -f cospace
```

Detención: pulsa `Ctrl+C` si corre en primer plano o ejecuta `docker stop cospace` desde otra terminal. Las migraciones no se aplican automáticamente al arrancar el contenedor; aplícalas en un job separado con `DIRECT_URL` antes del despliegue.

El Dockerfile no recibe secretos JWT como argumentos de build. La URL de build incluida en la etapa de compilación es ficticia y solo permite generar Prisma Client/build; no es una base de datos operativa. **La imagen Docker no se construyó ni ejecutó durante esta revisión**: aunque el cliente Docker está instalado, el entorno denegó acceso a `/var/run/docker.sock`. Estos pasos describen el Dockerfile y no constituyen una prueba del contenedor.

## Despliegue en Vercel y Supabase

El repositorio no contiene `vercel.json` ni una URL de producción configurada. La guía siguiente prepara un despliegue; no indica que la aplicación ya esté publicada.

1. Importa el repositorio en Vercel y selecciona el directorio raíz del proyecto.
2. Crea o selecciona una base PostgreSQL de Supabase. Configura `DATABASE_URL` con la conexión pooled y `DIRECT_URL` con la conexión directa; ambas deben usar TLS según la cadena indicada por Supabase.
3. Configura `JWT_ACCESS_SECRET` y `JWT_REFRESH_SECRET` como secretos diferentes para los entornos necesarios. Define también las duraciones si difieren de `15m` y `7d`.
4. No agregues las credenciales `ADMIN_*`/`USER_*` de desarrollo al entorno de producción. Configura las cuentas administrativas por un procedimiento operativo seguro; el registro público solo crea usuarios normales.
5. Ejecuta `npx prisma migrate deploy --config prisma.config.ts` una sola vez desde un job de release o entorno controlado con `DIRECT_URL`, antes de dirigir tráfico a una versión que espera el nuevo esquema. No ejecutes la migración pendiente a ciegas: primero confirma la base de destino y respaldo.
6. Vercel ejecuta el build con el script `npm run build`, que genera Prisma Client. El comando de arranque local es `npm start`; Vercel gestiona el runtime de Next.js.
7. Verifica el build, estado de migraciones, portada, catálogo, registro/login, persistencia tras recargar, refresh/logout, creación/cancelación de una reserva y rechazo de endpoints administrativos para un usuario normal.
8. Comprueba que el dominio use HTTPS. En producción, `NODE_ENV=production` hace que las cookies sean `Secure`; no fuerces tráfico HTTP en pruebas de sesión.

Antes de publicar esta revisión, la migración `20261027003000_use_timestamptz` figuraba pendiente en la base previamente comprobada. Debe aplicarse mediante el proceso descrito y luego comprobarse con `prisma migrate status`. No se dispone aquí de credenciales de despliegue para crear un deployment o verificar una URL productiva.

## Solución de problemas

| Síntoma | Comprobación y solución |
| --- | --- |
| No conecta con PostgreSQL | Revisa host, puerto, usuario, contraseña codificada en URL y `sslmode` provisto por el hosting. Usa la URL pooled en `DATABASE_URL`; confirma que la IP/red tenga acceso. No compartas la URL completa en logs o issues. |
| Faltan variables de entorno | Compara `.env` con `.env.example`. `DATABASE_URL` y ambos secretos JWT son necesarios para el runtime; el seed requiere `DIRECT_URL`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `USER_EMAIL` y `USER_PASSWORD`. |
| Prisma Client no refleja el esquema | Ejecuta `npx prisma generate --config prisma.config.ts`; `npm run dev` y `npm run build` ya lo ejecutan. |
| Prisma indica migraciones pendientes | Revisa `npx prisma migrate status --config prisma.config.ts`, verifica que la URL apunta a la base correcta y aplica migraciones versionadas con `npx prisma migrate deploy --config prisma.config.ts`. Haz respaldo antes de cambiar una base con datos. |
| El seed falla por credenciales | Comprueba que los dos correos y contraseñas estén configurados, que los correos sean distintos, que cada contraseña tenga al menos 12 caracteres y que `DIRECT_URL` sea válida. El seed no define contraseñas por defecto. |
| Login devuelve 401 | Revisa correo y contraseña configurados; los correos se guardan en minúsculas. Si cambiaste los secretos JWT, inicia una nueva sesión. El repositorio no incluye recuperación de contraseña. |
| La sesión no persiste | Confirma que el navegador acepta cookies, que el dominio y HTTPS coinciden con el entorno. En producción la cookie lleva `Secure`; no pruebes esa cookie sobre HTTP. Access/refresh cookies son `httpOnly` y no se ven desde JavaScript. |
| Un usuario no accede a `/admin` | El panel requiere rol `ADMIN`; el registro público asigna `USER`. Usa la cuenta administrativa creada por el seed solo en desarrollo y comprueba el rol almacenado. |
| Falla el build | Ejecuta `npm ci`, configura las variables que el build necesita para generar Prisma Client, y revisa `npm run lint`/`npm run typecheck`. La compilación del proyecto puede usar la URL ficticia configurada por Docker únicamente en su etapa de build; no uses esa URL para runtime. |
| Docker no inicia o no conecta a la base | Comprueba que Docker Engine esté activo, que el puerto 3000 esté libre y que las variables se hayan pasado al contenedor. La base debe ser accesible desde el contenedor; `localhost` dentro del contenedor apunta al propio contenedor. |

## Estado de verificación y limitaciones

- La suite automatizada tiene 23 pruebas unitarias de esquemas y reglas; no es una suite end-to-end ni valida operaciones contra una base de datos.
- La comprobación de estado de migraciones realizada previamente encontró `20261027003000_use_timestamptz` pendiente en la base configurada; esta revisión no la aplicó.
- El seed configura un administrador y un usuario normales con credenciales elegidas mediante `.env`; no se publican credenciales en el README. No se ejecutó contra la base conectada, por lo que su existencia y login deben verificarse después de ejecutarlo en la base elegida.
- Docker, Vercel y un deployment productivo no fueron probados ni se afirma que existan; el daemon Docker no estuvo accesible.
- No hay limitador de login compartido entre instancias, pruebas end-to-end, flujo de recuperación de contraseña ni configuración de despliegue versionada.

El repositorio no declara una licencia; este README no asigna una.



LINK DE VERCEL 

https://vercel.com/joseph080508-3318/co-space-xu9z/7yLD83Zz5n6HL6nmsqXtZ7D6B3bB