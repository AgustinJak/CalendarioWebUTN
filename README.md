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
- Apuntes: subida de archivos (guardado local en tu navegador con IndexedDB).
- Muro: mensajes sin login (guardado local en tu navegador).
- Sincronizacion con Google Calendar (OAuth + Calendar API) para cargar **todas las clases del mes actual**.

> Nota: **Apuntes** y **Muro** son **locales por dispositivo/navegador**. No hay backend ni base de datos compartida.

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

## Deploy en Vercel

1. Importa el repo en Vercel.
2. En el proyecto, setea **Root Directory** a:
   - `uni-clases`
3. (Opcional) Configura `NEXT_PUBLIC_GOOGLE_CLIENT_ID` en Environment Variables.
4. Deploy.

## Datos / privacidad (prototipo)

- No se guardan datos en un servidor.
- Apuntes y muro quedan guardados localmente en el navegador.
- Google Calendar solo se usa si el usuario autoriza el acceso (OAuth).

