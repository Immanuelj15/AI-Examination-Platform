import type { Metadata, Viewport } from "next";
import "./globals.css";
import { LanguageProvider } from "@/context/LanguageContext";
import { AuthProvider } from "@/context/AuthContext";
import { PWARegistration } from "@/components/PWARegistration";

export const metadata: Metadata = {
  title: "Evalora | Enterprise Assessment Cloud & AI Proctoring",
  description: "Enterprise-grade online examination platform with AI proctoring, subjective evaluation, randomized question banks, and candidate analytics.",
  manifest: "/manifest.json",
  icons: {
    icon: "/evalora-icon.svg",
    apple: "/evalora-icon.svg",
  },
};

export const viewport: Viewport = {
  themeColor: "#123B7A",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/evalora-icon.svg" type="image/svg+xml" />
      </head>
      <body className="min-h-screen bg-[#F8FAFC] text-[#0F172A] font-sans text-base leading-relaxed antialiased selection:bg-[#2563EB] selection:text-white">
        <LanguageProvider>
          <AuthProvider>
            <PWARegistration />
            {children}
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
