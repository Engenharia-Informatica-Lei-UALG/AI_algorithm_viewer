import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ClientI18nProvider from "./ClientI18nProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Algorithm AI Lab",
  description: "Interactive AI Algorithm Visualizer",
  icons: {
    icon: '/icon.gif',
  },
};

/**
 * Root layout component for the application.
 * Manages global fonts, metadata, and initializes the i18n context.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ClientI18nProvider>
          {children}
        </ClientI18nProvider>
      </body>
    </html>
  );
}
