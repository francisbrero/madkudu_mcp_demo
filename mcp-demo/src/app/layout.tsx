import "~/styles/globals.css";

import { type Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";

import { TRPCReactProvider } from "~/trpc/react";

export const metadata: Metadata = {
  title: "MadKudu MCP Demo",
  description: "An interactive demo of MadKudu's enhanced AI capabilities",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable}`}>
      <body>
        <TRPCReactProvider>
          <nav className="bg-zinc-900 text-white p-4 shadow-md">
            <div className="container mx-auto flex justify-between items-center">
              <div className="text-xl font-bold">MadKudu MCP</div>
              <div className="space-x-6">
                <Link href="/" className="hover:text-blue-300 transition-colors">
                  Home
                </Link>
                <Link href="/mcp-test" className="hover:text-blue-300 transition-colors">
                  API Test
                </Link>
              </div>
            </div>
          </nav>
          {children}
        </TRPCReactProvider>
      </body>
    </html>
  );
}
