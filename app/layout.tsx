import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Gastos Familiares",
  description: "Control de gastos familiares",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="bg-ivory">
      <body className="antialiased bg-ivory text-brown-dark font-body">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
