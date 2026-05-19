import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "TrustHire AI — Zero-Trust Recruitment Intelligence",
  description: "Real-time multi-agent AI defense against recruitment fraud.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
