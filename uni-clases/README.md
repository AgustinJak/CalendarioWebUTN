Portal de Clases - Next.js + Tailwind + Supabase

## Que incluye

- Calendario mensual con materias y horarios (ejemplo semanal)
- Alertas dentro del sitio: "hoy hay clases", "en menos de 1 hora" y "en vivo"
- Apuntes compartidos (por link) y Muro compartido (sin login) con Supabase
- Reportes comunitarios: a los 5 reportes se oculta del feed y queda en "Reportados" con "Ver contenido"
- Borrado por autor (sin cuentas): el creador puede eliminar su post desde el mismo navegador

## Correr en local

En PowerShell en Windows a veces falla `npm` por politica de ejecucion (error con `npm.ps1`). En ese caso usa `npm.cmd`.

Comandos:

```bash
cd uni-clases
npm.cmd install
npm.cmd run dev
```

Abrir `http://localhost:3000`.

## Editar horarios

El cronograma esta en `src/lib/schedule.ts`.

## Supabase (modo compartido)

Configura estas env vars:

```bash
NEXT_PUBLIC_SUPABASE_URL="https://TU_REF.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="sb_publishable_..."
SUPABASE_SERVICE_ROLE_KEY="sb_secret_..."
REPORT_HASH_SALT="una_cadena_random_larga"
```

## Deploy en Vercel

Funciona como proyecto Next.js comun. En Vercel usa Root Directory: `uni-clases`.
