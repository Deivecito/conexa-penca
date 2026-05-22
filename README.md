# Conexa Penca — Mundial 2026

Aplicación web para gestionar una penca del Mundial de Fútbol 2026. Permite que participantes se registren, ingresen pronósticos de partidos y compitan en un ranking de puntos en tiempo real.

---

## Funcionalidades

### Para participantes
- **Registro público** con nombre completo, teléfono, procedencia y correo
- **Login con magic link** (link enviado al correo, sin contraseña)
- **Hub personal** con cuatro pestañas:
  - **Pronósticos** — ingresar o actualizar el marcador esperado para cada partido (bloqueado al iniciarse el partido)
  - **Resultados** — ver los marcadores reales de partidos en curso y finalizados
  - **Ranking** — tabla con posición, nombre visible y puntos de todos los participantes
  - **Ajustes** — cambiar nickname para el ranking, nombre, teléfono y ver avatar
- **Sistema de puntos**: 3 pts por resultado exacto, 1 pt por acertar el ganador/empate, 0 pts si falla

### Para administradores
- **Panel admin** en `/admin` (autenticación separada con email/contraseña)
- **Tabla de inscriptos** con búsqueda, filtro por procedencia y exportación a CSV
- **Vista de pronósticos** de partidos (modo lectura, sin poder participar)
- **Botón "Recalcular puntos"** para forzar el cálculo manual fuera del cron
- **Navegación de vuelta al Hub** desde el panel admin

---

## Stack técnico

| Capa | Tecnología |
|------|-----------|
| Frontend | Next.js 16 (App Router), TypeScript, Tailwind CSS v4 |
| Auth | Supabase Auth (magic link + email/contraseña para admin) |
| Base de datos | Supabase (PostgreSQL) con Row Level Security |
| API de partidos | [football-data.org](https://www.football-data.org/) v4 |
| Cron jobs | Vercel Cron (4× por día) |
| Deploy | Vercel |

---

## Estructura del proyecto

```
Conexa-Penca/
├── front/                        # Aplicación Next.js
│   ├── app/
│   │   ├── page.tsx              # Landing page + formulario de registro
│   │   ├── hub/page.tsx          # Hub personal (requiere auth)
│   │   ├── admin/
│   │   │   ├── page.tsx          # Panel admin
│   │   │   └── login/page.tsx    # Login admin
│   │   ├── auth/callback/        # Callback OAuth/magic link
│   │   └── api/
│   │       ├── registro/         # POST — registro de participante
│   │       ├── partidos/         # GET — partidos del Mundial (proxy football-data.org)
│   │       ├── grupos/           # GET — tabla de grupos
│   │       ├── nickname/         # POST — actualizar nickname del ranking
│   │       └── cron/
│   │           └── calcular-puntos/  # GET — calcula y guarda puntos
│   ├── components/
│   │   ├── HubClient.tsx         # Shell del hub con tabs
│   │   ├── AdminClient.tsx       # Shell del panel admin
│   │   ├── AdminHeader.tsx       # Header admin con navegación
│   │   ├── AdminTable.tsx        # Tabla de participantes
│   │   ├── RegistroForm.tsx      # Formulario público de registro
│   │   ├── LoginForm.tsx         # Login para admin
│   │   ├── AuthOptions.tsx       # Magic link / selección de auth
│   │   ├── PhoneInput.tsx        # Input de teléfono
│   │   └── hub/
│   │       ├── TabPronosticos.tsx
│   │       ├── TabResultados.tsx
│   │       ├── TabRanking.tsx
│   │       └── TabAjustes.tsx
│   ├── lib/
│   │   ├── supabase.ts           # Cliente browser
│   │   ├── supabase-server.ts    # Clientes server (anon + service_role)
│   │   ├── football-api.ts       # Normalización de datos de partidos
│   │   ├── validations.ts        # Schemas Zod
│   │   ├── profanity.ts          # Filtro de palabras inapropiadas
│   │   └── rate-limit.ts        # Rate limiting por IP
│   ├── types/index.ts
│   ├── middleware.ts             # Protección de rutas /hub y /admin
│   └── vercel.json               # Configuración de cron jobs
│
└── back/
    └── supabase/
        └── migrations/
            ├── 001_create_participantes.sql
            ├── 002_hub_features.sql
            ├── 003_partidos_pronosticos.sql
            ├── 004_participantes_update_policy.sql
            ├── 005_nombre_visible_ranking.sql
            └── 006_puntos_total.sql
```

---

## Base de datos

### Tablas principales

**`participantes`** — Un registro por persona inscripta
- `correo` (unique) — clave natural de cada participante
- `nombre_completo`, `telefono`, `procedencia`
- `nombre_visible` — nickname para el ranking (opcional)
- `avatar_url` — foto de perfil (Supabase Auth)
- `puntos_total` — suma de puntos, actualizada por el cron
- `evento` — `'mundial_2026'` (soporte multi-evento futuro)

**`pronosticos`** — Un pronóstico por participante por partido
- `correo` + `match_id` (unique) — evita duplicados
- `goles_local`, `goles_visitante` — marcador pronosticado
- `puntos` — `null` hasta que se calcule; 0, 1 o 3 al finalizar

**`ranking_view`** — Vista materializada del ranking
- Lee `puntos_total` directamente de `participantes` (sin join a `pronosticos`)
- Filtra por `evento = 'mundial_2026'`

### Row Level Security
- Los participantes solo pueden ver y modificar sus propios pronósticos
- Los participantes pueden actualizar su propio registro en `participantes`
- El cron y el panel admin usan la `service_role` (bypassa RLS)

---

## Cron job — Cálculo de puntos

Corre automáticamente 4 veces por día: `0 2,8,14,20 * * *` (UTC).

**Flujo:**
1. Consulta football-data.org y filtra los partidos con estado `finalizado`
2. Busca pronósticos en `pronosticos` donde `puntos IS NULL` para esos partidos
3. Calcula puntos (3 / 1 / 0) y los guarda en cada pronóstico
4. Recalcula `puntos_total` en `participantes` para cada correo afectado

**Autenticación del endpoint:**
- Vercel envía `Authorization: Bearer {CRON_SECRET}` automáticamente
- También acepta una sesión de admin activa (para el botón "Recalcular" del panel)

---

## Seguridad

- **Rate limiting** en endpoints sensibles (`/api/registro`, `/api/nickname`): por IP, con soporte para `CF-Connecting-IP` (Cloudflare)
- **Filtro de profanity** en nicknames: validación client-side inmediata + server-side en `/api/nickname`
- **RLS estricto** en Supabase: cada usuario solo accede a sus datos
- **Middleware de rutas**: `/hub` y `/admin` redirigen a login si no hay sesión
- **Admin por `app_metadata.role`**: el rol no es modificable desde el cliente
- **Validación con Zod** en todos los endpoints de API
- **Queries parametrizadas** vía PostgREST (sin SQL injection posible desde el cliente)

---

## Variables de entorno

Crear `front/.env.local` con:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
FOOTBALL_DATA_API_KEY=tu_api_key
CRON_SECRET=un_secreto_aleatorio
```

En Vercel, agregar estas mismas variables en el panel de configuración del proyecto.

---

## Cómo usar este repositorio

El repo es público. Para levantarlo en tu propia cuenta necesitás crear los servicios externos y conectarlos. Seguí estos pasos en orden.

---

### Paso 1 — Crear el proyecto en Supabase

1. Entrá a [supabase.com](https://supabase.com) y creá una cuenta gratuita
2. Creá un nuevo proyecto (anotá la contraseña de la base de datos, la vas a necesitar si conectás directamente)
3. Una vez creado el proyecto, andá a **Project Settings → API** y copiá:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon / public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY` (nunca la expongas en el frontend)

---

### Paso 2 — Ejecutar las migraciones SQL

Las migraciones crean todas las tablas, índices, políticas RLS y vistas que necesita la app.

1. En Supabase, andá a **SQL Editor**
2. Abrí y ejecutá cada archivo de `back/supabase/migrations/` **en orden**, uno por uno:

   | Archivo | Qué hace |
   |---------|---------|
   | `001_create_participantes.sql` | Tabla de inscriptos + RLS |
   | `002_hub_features.sql` | Columnas de avatar y campos del hub |
   | `003_partidos_pronosticos.sql` | Tabla de pronósticos + RLS |
   | `004_participantes_update_policy.sql` | Política para que cada usuario edite su propio perfil |
   | `005_nombre_visible_ranking.sql` | Nickname para el ranking + vista inicial |
   | `006_puntos_total.sql` | Columna `puntos_total` en participantes + vista de ranking final |

   > **Importante:** ejecutalos en orden. Cada migración puede depender de la anterior.

---

### Paso 3 — Obtener API key de football-data.org

1. Registrate gratis en [football-data.org](https://www.football-data.org/)
2. Copiá tu API key → `FOOTBALL_DATA_API_KEY`

El plan gratuito permite hasta 10 requests/minuto, más que suficiente para esta app.

---

### Paso 4 — Configurar variables de entorno

Creá el archivo `front/.env.local` con tus valores:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
FOOTBALL_DATA_API_KEY=tu_api_key
CRON_SECRET=un_string_aleatorio_largo
```

Para `CRON_SECRET` podés generar uno con:
```bash
openssl rand -hex 32
```

---

### Paso 5 — Levantar en local

```bash
cd front
npm install
npm run dev
```

La app queda en `http://localhost:3000`.

---

### Paso 6 — Deploy en Vercel

1. Hacé fork o push del repo a tu GitHub
2. En [vercel.com](https://vercel.com): **New Project** → seleccioná el repo → **Root Directory: `front`**
3. Agregá las 5 variables de entorno del paso 4
4. Deploy

---

### Paso 7 — Configurar URLs de autenticación en Supabase

Una vez que Vercel te dé la URL de producción (ej. `https://mi-penca.vercel.app`):

1. En Supabase → **Authentication → URL Configuration**
2. **Site URL**: `https://mi-penca.vercel.app`
3. **Redirect URLs**: `https://mi-penca.vercel.app/**`

Sin esto, los magic links redirigen a `localhost` y no funcionan en producción.

---

### Paso 8 — Asignar rol de administrador

Para acceder al panel admin (`/admin`) necesitás un usuario con rol `admin`. Después de que ese usuario se haya registrado al menos una vez, ejecutá en el **SQL Editor** de Supabase:

```sql
update auth.users
set raw_app_meta_data = raw_app_meta_data || '{"role": "admin"}'::jsonb
where email = 'tu@email.com';
```

El admin puede ver todos los inscriptos, ver los pronósticos en modo lectura y forzar el recálculo de puntos, pero **no puede participar** en la penca.

---

## Datos de partidos

Los partidos provienen de [football-data.org](https://www.football-data.org/) — competición `WC` (FIFA World Cup 2026). La API key gratuita permite hasta 10 requests/minuto. Los datos se normalizan en `front/lib/football-api.ts` y se cachean por Vercel Edge en la ruta `/api/partidos`.
