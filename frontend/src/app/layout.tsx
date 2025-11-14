import type { Metadata } from "next";
import { Urbanist } from "next/font/google";
import "./globals.css";
import PrivyProvider from "@/components/PrivyProvider";

const urbanist = Urbanist({
  variable: "--font-urbanist",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "lynq. - Simple way to manage your digital finances",
  description: "Get instant access to micro-stablecoin loans, manage your on-chain credit, and grow your portfolio — all in one decentralized platform.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${urbanist.variable} antialiased`}
      >
        <PrivyProvider>
          {children}
        </PrivyProvider>
      </body>
    </html>
  );
}
