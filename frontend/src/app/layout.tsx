import { HeaderWrapper } from "@/components/layout/HeaderWrapper";
import { AuthProvider } from "@/context/AuthContext";
import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import { Toaster } from "react-hot-toast";
import "./globals.css";
import { Footer } from "@/components/layout/Footer";

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-dm-sans",
  display: "swap",
});

export const metadata: Metadata = {
  icons: {
    icon: "/icon.png",
  },
  title: "Reflectify - Faculty Schedule Management",
  description: "Efficiently manage and organize faculty schedules",
  keywords: ["schedule", "faculty", "management", "education"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className={dmSans.variable}>
      <body
        suppressHydrationWarning
        className="font-dm-sans antialiased flex flex-col bg-background"
      >
        <AuthProvider>
          <Toaster position="top-center" />
          <HeaderWrapper />
          <main className="m-0 p-0">{children}</main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
