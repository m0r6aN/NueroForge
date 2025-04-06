// neuroforge/frontend/app/layout.tsx
// Purpose: Root layout for the entire application
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@/"
import { ThemeProvider } from "@/components/providers/theme-provider"; 
import { AuthProvider } from "components/providers/auth-provider"; 
import { Toaster } from "components/ui/sonner";
import { WebSocketProvider } from "@/components/providers/websocket-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "NeuroForge - Forge Your Mind",
  description: "The Area 51 of Education. Elite interactive learning.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <AuthProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          > <WebSocketProvider>
            {/* Add global layout elements like a SkipNav link here if needed */}
            {children}
            <Toaster />
            </WebSocketProvider>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}