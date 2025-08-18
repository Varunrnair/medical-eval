import type React from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import LayoutWithSidebar from "@/components/layout/LayoutWithSidebar";
import { ModelProvider } from "@/contexts/ModelContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Medical QA Dashboard",
  description: "Medical QA evaluation results dashboard",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-neutral-950 text-neutral-100`}>
        <ModelProvider>
          <LayoutWithSidebar>{children}</LayoutWithSidebar>
        </ModelProvider>
      </body>
    </html>
  );
}
