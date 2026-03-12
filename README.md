# Calendario Web UTN (Clases en Vivo)

[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-149eca)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38bdf8)](https://tailwindcss.com/)
[![Vercel](https://img.shields.io/badge/Deploy-Vercel-000000)](https://vercel.com/)

Prototipo front-end para visualizar **horarios de clases**, ver **proximas clases**, recibir **alertas dentro del sitio** y (opcionalmente) **sincronizar el mes actual a Google Calendar**.

Creado por **Agustin J. (Aguspium)**.

## Que incluye

- Calendario mensual con materias, horarios y detalle por dia.
- Panel de "acciones" para la proxima clase (unirse / copiar link).
- Alertas en la UI (toasts): hoy hay clases, en menos de 1h, etc.
- Apuntes compartidos: recursos por link (Drive, YouTube, PDF, etc).
- Muro compartido: mensajes sin login (nombre y apellido).
- Sistema anti-spam comunitario: reportes (a los 5 reportes se oculta del feed) y seccion de "Reportados" con "Ver contenido".
- Borrado por autor (sin cuentas): el creador puede eliminar su post desde el mismo navegador.
- Sincronizacion con Google Calendar (OAuth + Calendar API) para cargar **todas las clases del mes actual**.

Modo de datos:

- Con Supabase configurado: **Muro y Apuntes son globales** (los ve cualquiera).
- Sin Supabase: la app cae a modo prototipo **local** (por navegador).

## Proyecto

El codigo de la app Next.js esta dentro de:

- `uni-clases/`

## Correr en local

Requisitos: Node 20+.

En Windows PowerShell a veces falla `npm` por politicas de ejecucion (error con `npm.ps1`). En ese caso usa `npm.cmd`.

```bash
cd uni-clases
npm.cmd install
npm.cmd run dev
```

Abrir:

- `http://localhost:3000`

## Editar horarios/materias

El cronograma esta en:

- `uni-clases/src/lib/schedule.ts`

## Google Calendar (opcional)

Para habilitar el boton **"Cargar mes a Google Calendar"**:

1. Crea un **OAuth Client ID** (tipo: "Aplicacion web") en Google Cloud Console.
2. Configura **Authorized JavaScript origins**:
   - `http://localhost:3000`
   - tu dominio de Vercel (ej: `https://calendario-web-utn.vercel.app`)
3. Setea la variable de entorno:

```bash
NEXT_PUBLIC_GOOGLE_CLIENT_ID="TU_CLIENT_ID.apps.googleusercontent.com"
```

La app usa el scope `https://www.googleapis.com/auth/calendar.events` para crear eventos en tu calendario.

## Supabase (modo compartido)

Para habilitar Muro/Apuntes globales, configura Supabase y estas variables:

```bash
NEXT_PUBLIC_SUPABASE_URL="https://TU_REF.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="sb_publishable_..."
SUPABASE_SERVICE_ROLE_KEY="sb_secret_..."
REPORT_HASH_SALT="una_cadena_random_larga"
```

Notas importantes:

- `SUPABASE_SERVICE_ROLE_KEY` es privada (solo servidor). No la publiques ni la subas al repo.
- `NEXT_PUBLIC_*` se expone al cliente (URL + publishable key).

### SQL inicial

Ejecuta esto en Supabase (SQL Editor):

```sql
create extension if not exists pgcrypto;

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  type text not null check (type in ('note', 'file')),
  author_name text not null,

  content text,
  course_id text,
  title text,
  attachment_url text,
  attachment_name text,

  report_count int not null default 0,
  hidden boolean not null default false,
  hidden_at timestamptz,

  delete_token_hash text
);

create table if not exists public.reports (
  id bigserial primary key,
  created_at timestamptz not null default now(),
  post_id uuid not null references public.posts(id) on delete cascade,
  reporter_hash text not null,
  reason text,
  unique (post_id, reporter_hash)
);
```

## Deploy en Vercel

1. Importa el repo en Vercel.
2. En el proyecto, setea **Root Directory** a:
   - `uni-clases`
3. Configura Environment Variables (segun uses):
   - Google (opcional): `NEXT_PUBLIC_GOOGLE_CLIENT_ID`
   - Supabase (modo compartido): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `REPORT_HASH_SALT`
4. Deploy / Redeploy.

## Datos / privacidad (prototipo)

- Con Supabase: se guardan posts y reportes en la base de datos (contenido compartido).
- Sin Supabase: Muro y Apuntes se guardan localmente en el navegador.
- Google Calendar solo se usa si el usuario autoriza el acceso (OAuth).
