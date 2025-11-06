import type { Metadata } from "next";
import "./globals.css";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Propnet",
  description: "Property Network Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <TooltipProvider>
            <div className="app-container">
              {children}
              <Toaster />
            </div>
          </TooltipProvider>
        </Providers>
      </body>
    </html>
  );
}
