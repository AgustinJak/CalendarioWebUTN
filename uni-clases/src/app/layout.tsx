import type { Metadata } from "next";
import "@fontsource/space-grotesk/400.css";
import "@fontsource/space-grotesk/600.css";
import "@fontsource/fraunces/400.css";
import "@fontsource/jetbrains-mono/400.css";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: "Clases en vivo | Universidad",
  description:
    "Calendario de materias, alertas de clases en vivo, apuntes y mensajes.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="min-h-screen antialiased">
        {children}
      </body>
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
      />
    </html>
  );
}
