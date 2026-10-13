import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sellio | Professional Website Design",
  description:
    "Professional websites, online stores and digital solutions for growing businesses.",
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