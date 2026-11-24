import type { Metadata } from "next";
import { Cormorant_Garamond, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
  ),
  title: "TOPSTORE WOMAN | Ropa Elegante y Premium Para Ella",
  description:
    "Catálogo oficial de TOPSTORE WOMAN, la línea de moda elegante femenina de TOPSTORE Colombia. Blusas, abrigos, tejidos y siluetas atemporales con envíos a todo Colombia.",
  keywords: [
    "TOPSTORE WOMAN",
    "TOPSTORE Colombia",
    "ropa elegante mujer Colombia",
    "moda femenina premium",
    "catálogo ropa elegante",
  ],
  icons: {
    icon: "/media/logo.jpeg",
    apple: "/media/logo.jpeg",
  },
  openGraph: {
    title: "TOPSTORE WOMAN — Ropa Premium Para Ella",
    description:
      "La nueva línea de moda elegante femenina de TOPSTORE Colombia. Envíos a todo el país.",
    type: "website",
    locale: "es_CO",
    images: ["/media/logo.jpeg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${cormorant.variable} ${jakarta.variable}`}>
      <body className="min-h-screen bg-canvas text-ink antialiased">
        {children}
      </body>
    </html>
  );
}
