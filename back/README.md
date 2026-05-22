# Conexa Penca – Backend (Supabase)

## Configuración de Supabase

### 1. Crear proyecto en Supabase
1. Ir a [supabase.com](https://supabase.com) y crear cuenta
2. Click en **New Project**
3. Elegir nombre: `conexa-penca`
4. Elegir región más cercana (ej: São Paulo para Argentina)
5. Guardar la contraseña de la base de datos

### 2. Ejecutar la migración SQL
1. En el dashboard de Supabase ir a **SQL Editor**
2. Copiar y pegar el contenido de `supabase/migrations/001_create_participantes.sql`
3. Click en **Run**

### 3. Obtener las credenciales
En **Settings → API**:
- `NEXT_PUBLIC_SUPABASE_URL` → "Project URL"
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` → "anon / public"
- `SUPABASE_SERVICE_ROLE_KEY` → "service_role" (¡mantener secreto!)

### 4. Crear el usuario administrador
1. Ir a **Authentication → Users**
2. Click en **Add user**
3. Ingresar email y contraseña del administrador
4. Este usuario podrá acceder a `/admin`

### 5. Variables de entorno en Vercel
Al hacer deploy en Vercel, agregar las 3 variables de entorno del paso 3.

---

## Estructura de carpetas

```
back/
└── supabase/
    └── migrations/
        └── 001_create_participantes.sql
```

## Esquema de la tabla `participantes`

| Campo            | Tipo        | Descripción                        |
|------------------|-------------|------------------------------------|
| id               | uuid        | Clave primaria auto-generada       |
| created_at       | timestamptz | Timestamp de registro              |
| nombre_completo  | text        | Nombre y apellido                  |
| telefono         | text        | Número de teléfono                 |
| procedencia      | text        | País / ciudad de origen            |
| correo           | text        | Email (único, case-insensitive)    |
| evento           | text        | Nombre del evento (default: mundial_2026) |
