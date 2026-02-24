import type { Metadata } from "next"
import { Outfit, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { NuqsAdapter } from "nuqs/adapters/next/app"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Providers } from "@/components/providers"
import { Toaster } from "sonner"
import "./globals.css"

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
})
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Leaderboard Dashboard",
  description: "Track team performance, daily progress, and resource utilization",
  generator: "v0.app",
  icons: {
    icon: [{ url: "/ctx-ico.svg", type: "image/svg+xml" }],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={outfit.variable} suppressHydrationWarning>
      <body className="font-sans antialiased">
        <Providers>
          <NuqsAdapter>
            <TooltipProvider>
              {children}
            </TooltipProvider>
          </NuqsAdapter>
        </Providers>
        <Toaster richColors position="bottom-right" />
        <Analytics />
      </body>
    </html>
  )
}
