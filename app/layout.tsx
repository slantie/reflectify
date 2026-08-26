import { Geist_Mono, DM_Sans } from "next/font/google"
import type { Metadata, Viewport } from "next"

import "./globals.css"
import { ToastProvider } from "@/components/toast-provider"
import { ThemeProvider } from "@/components/theme-provider"
import { TooltipProvider } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-sans" })

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

const siteUrl = new URL(process.env.APP_URL ?? "http://localhost:3000")

export const metadata: Metadata = {
  metadataBase: siteUrl,
  title: {
    default: "Reflectify | Academic feedback, made clear",
    template: "%s | Reflectify",
  },
  description:
    "A focused academic feedback workspace for collecting student voice, managing academic operations, and turning responses into useful insight.",
  applicationName: "Reflectify",
  keywords: [
    "academic feedback",
    "student feedback",
    "faculty feedback",
    "education analytics",
    "Reflectify",
  ],
  authors: [{ name: "Reflectify" }],
  creator: "Reflectify",
  publisher: "Reflectify",
  category: "Education",
  alternates: { canonical: "/" },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.png", type: "image/png", sizes: "512x512" },
    ],
    apple: [{ url: "/apple-icon.png", type: "image/png", sizes: "180x180" }],
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "/",
    siteName: "Reflectify",
    title: "Reflectify | Academic feedback, made clear",
    description:
      "A focused academic feedback workspace for collecting student voice and turning responses into useful insight.",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Reflectify — academic feedback, made clear",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Reflectify | Academic feedback, made clear",
    description:
      "A focused academic feedback workspace for collecting student voice and turning responses into useful insight.",
    images: ["/opengraph-image"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
}

export const viewport: Viewport = {
  colorScheme: "light dark",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f97316" },
    { media: "(prefers-color-scheme: dark)", color: "#fb923c" },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "antialiased",
        fontMono.variable,
        "font-sans",
        dmSans.variable
      )}
    >
      <body>
        <ThemeProvider>
          <TooltipProvider>
            {children}
            <ToastProvider />
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
