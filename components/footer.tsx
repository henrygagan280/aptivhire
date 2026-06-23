import Link from "next/link"
import { AptivHireLogo } from "@/components/aptivhire-logo"

export function Footer() {
  return (
    <footer className="bg-card border-t border-border py-6 px-8">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <AptivHireLogo size="sm" />

        <nav className="flex items-center gap-6 text-sm text-muted-foreground">
          <Link href="/help" className="hover:text-foreground transition-colors">
            Help Center
          </Link>
          <Link href="/privacy" className="hover:text-foreground transition-colors">
            Privacy Policy
          </Link>
          <Link href="/terms" className="hover:text-foreground transition-colors">
            Terms of Service
          </Link>
          <Link href="/contact" className="hover:text-foreground transition-colors">
            Contact
          </Link>
        </nav>

        <p className="text-sm text-muted-foreground">© 2026 Nuviq</p>
      </div>
    </footer>
  )
}
