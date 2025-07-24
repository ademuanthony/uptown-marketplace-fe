import type { Metadata } from "next";
import { Toaster } from "react-hot-toast";
import Navbar from "@/components/common/Navbar";
import Footer from "@/components/common/Footer";
import "./globals.css";

export const metadata: Metadata = {
  title: "Uptown Marketplace",
  description: "Your trusted marketplace platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <Navbar />
        {children}
        <Footer />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              style: {
                background: '#10b981',
              },
            },
            error: {
              style: {
                background: '#ef4444',
              },
            },
          }}
        />
      </body>
    </html>
  );
}
