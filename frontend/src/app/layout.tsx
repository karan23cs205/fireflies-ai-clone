import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Fireflies.ai - Pro Intelligence Workspace",
  description: "AI Meeting Assistant for automated notes, transcription, and action items.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} h-full bg-[#0B0F19] flex antialiased overflow-hidden`}>
        {/* Fixed Left Sidebar */}
        <Sidebar />

        {/* Scrollable Viewport Area */}
        <div className="flex-1 flex flex-col h-full min-w-0 bg-[#F8FAFC] overflow-y-auto overflow-x-hidden">
          {children}
        </div>
      </body>
    </html>
  );
}