import "~/styles/globals.css";

import { Inter } from "next/font/google";
import { Sidebar } from "./_components/Sidebar";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata = {
  title: "MadKudu MCP Demo",
  description: "Interactive demo of MadKudu's Model-Context Provider",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`font-sans ${inter.variable}`}>
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1 overflow-y-auto bg-gray-50">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
