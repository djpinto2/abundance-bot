import "./globals.css";

export const metadata = {
  title: "ABUNDANCE Bot",
  description: "Bot de WhatsApp que convierte chats en presupuestos de eventos.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
