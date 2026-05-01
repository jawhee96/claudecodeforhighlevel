import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Integration Hub",
  description: "Mindbody · Trainerize · Oncehub → HighLevel",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
