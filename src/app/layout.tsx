import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";
import { Navbar } from "@/components/Navbar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Tw1sT Official",
  description: "Tw1sT Official App",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-black text-white min-h-screen`}>
        <Header />
        <main className="pt-16 pb-16 md:pt-20 md:pb-20 min-h-screen flex flex-col">
          {children}
        </main>
        <Navbar />
      </body>
    </html>
  );
}
