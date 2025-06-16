import "~/styles/globals.css";

import { type Metadata } from "next";
import { Inter } from "next/font/google";
import { TRPCReactProvider } from "~/trpc/react";
import SidebarNav from "./_components/SidebarNav";

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
          <div className="flex h-screen bg-madkudu-gradient">
            <SidebarNav />
            <main className="flex-1 overflow-y-auto">{children}</main>
          </div>
        </TRPCReactProvider>
      </body>
    </html>
  );
}
