import type { Metadata } from "next"
import "@fontsource/inter/400.css"
import "@fontsource/inter/500.css"
import "@fontsource/inter/600.css"
import "@fontsource/inter/700.css"
import "@fontsource/inter/800.css"
import "@fontsource/inter/900.css"

import "./globals.css"

export const metadata: Metadata = {
  title: "Nuviq",
  description: "AI-powered candidate ranking platform",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
  <body
    suppressHydrationWarning
    className="font-[Inter] antialiased bg-[#f5f7fb] text-[#0f172a]"
  >
        {children}
      </body>
    </html>
  )
}

