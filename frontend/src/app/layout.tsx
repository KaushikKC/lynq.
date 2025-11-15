import type { Metadata } from "next";
import { Urbanist } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import PrivyProvider from "@/components/PrivyProvider";
import FontLoader from "@/components/FontLoader";

const urbanist = Urbanist({
  variable: "--font-urbanist",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "lynq. - Simple way to manage your digital finances",
  description:
    "Get instant access to micro-stablecoin loans, manage your on-chain credit, and grow your portfolio — all in one decentralized platform.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Stack+Sans+Notch:wght@200..700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={`${urbanist.variable} antialiased`}>
        <FontLoader />
        <PrivyProvider>{children}</PrivyProvider>
      </body>
    </html>
  );
}
