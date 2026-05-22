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

## Setup local

```bash
# 1. Instalar dependencias
cd front
npm install

# 2. Configurar variables de entorno
cp .env.example .env.local   # y completar los valores

# 3. Ejecutar migraciones en Supabase SQL Editor
# (en orden: 001 → 006)

# 4. Levantar dev server
npm run dev
```

## Deploy en Vercel

1. Hacer push del repo a GitHub
2. En Vercel: **New Project** → Root Directory: `front`
3. Agregar las 5 variables de entorno
4. Deploy
5. En Supabase → Authentication → URL Configuration:
   - Site URL: `https://tu-proyecto.vercel.app`
   - Redirect URLs: `https://tu-proyecto.vercel.app/**`

## Configurar rol de admin

Ejecutar en el SQL Editor de Supabase:

```sql
update auth.users
set raw_app_meta_data = raw_app_meta_data || '{"role": "admin"}'::jsonb
where email = 'tu@email.com';
```

---

## Datos de partidos

Los partidos provienen de [football-data.org](https://www.football-data.org/) — competición `WC` (FIFA World Cup 2026). La API key gratuita permite hasta 10 requests/minuto. Los datos se normalizan en `front/lib/football-api.ts` y se cachean por Vercel Edge en la ruta `/api/partidos`.
