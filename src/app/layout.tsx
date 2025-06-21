import "~/styles/globals.css";
import { TRPCReactProvider } from "~/trpc/react";
import { type Metadata } from "next";
import { Inter } from "next/font/google";
import { Sidebar } from "./_components/Sidebar";

const inter = Inter({ 
  subsets: ["latin"],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: "MadKudu MCP Demo",
  description: "Demo app for MadKudu MCP",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans" style={{ backgroundColor: 'hsl(222.2 84% 4.9%)', color: 'hsl(210 40% 98%)' }}>
        <TRPCReactProvider>
          <div style={{ 
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: -20,
            pointerEvents: 'none',
            background: `
              radial-gradient(circle at 20% 20%, rgba(59, 130, 246, 0.05) 0%, transparent 30%),
              radial-gradient(circle at 80% 80%, rgba(37, 99, 235, 0.04) 0%, transparent 30%),
              radial-gradient(circle at 40% 60%, rgba(29, 78, 216, 0.03) 0%, transparent 25%)
            `,
            backgroundSize: '25% 25%, 30% 30%, 20% 20%'
          }} />
          <div style={{ position: 'relative', display: 'flex', minHeight: '100vh' }}>
            <Sidebar />
            <main style={{ flex: 1, overflowY: 'auto' }}>
              <div style={{ position: 'relative', zIndex: 10 }}>
                {children}
              </div>
            </main>
          </div>
        </TRPCReactProvider>
      </body>
    </html>
  );
}