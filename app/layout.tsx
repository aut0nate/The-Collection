import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "The Collection",
  description: "A public scrapbook of recommended apps and command line tools.",
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png"
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-GB" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
