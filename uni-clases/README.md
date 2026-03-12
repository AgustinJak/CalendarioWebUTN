Portal de Clases (prototipo) - Next.js + Tailwind

## Que incluye

- Calendario mensual con materias y horarios (ejemplo semanal)
- Alertas dentro del sitio: "hoy hay clases", "en menos de 1 hora" y "en vivo"
- Apuntes: subida de archivos (guardado en tu navegador con IndexedDB)
- Muro: mensajes sin login (nombre y apellido, guardado local)

## Correr en local

En PowerShell en Windows a veces falla `npm` por politica de ejecucion (error con `npm.ps1`). En ese caso usa `npm.cmd`.

Comandos:

```bash
cd uni-clases
npm.cmd run dev
```

Abrir `http://localhost:3000`.

## Editar horarios

El cronograma de ejemplo esta en `src/lib/schedule.ts`. Mas adelante se puede reemplazar por una API/DB.

## Deploy en Vercel

Funciona como proyecto Next.js comun. Subi el repo a GitHub y conectalo en Vercel.
