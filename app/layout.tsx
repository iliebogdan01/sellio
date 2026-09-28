import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sellio",
  description: "Buy. Sell. Discover.",
  icons: {
    icon: "/icon.png",
    shortcut: "/icon.png",
    apple: "/icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}