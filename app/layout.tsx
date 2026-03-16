import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";

export const metadata: Metadata = {
  title: "First Stand 2026 — Tournament Picker",
  description: "Pick your prognosis for the First Stand 2026 League of Legends tournament",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-[#010A13]">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
