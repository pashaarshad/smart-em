import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { AuthProvider } from "@/context/AuthContext";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
});

export const metadata: Metadata = {
  title: "SHRESHTA 2026 | Seshadripuram Degree College, Mysuru",
  description: "SHRESHTA 2026 - The Inter-College Fest at Seshadripuram Degree College, Mysuru. Join us on 17th February 2026 for exciting events in IT, Management, Cultural, and Sports!",
  keywords: "SHRESHTA, Seshadripuram Degree College, SDC, Mysuru, College Fest, Inter-college, IT Events, Cultural Events, Sports",
  icons: {
    icon: "/sdc-logo.webp",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${playfair.variable} font-sans`}>
        <AuthProvider>
          <Navbar />
          <main>{children}</main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
