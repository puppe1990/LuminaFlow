import Link from "next/link"
import { Video } from "lucide-react"
import { ThemeSwitcher } from "./theme-switcher"

export function Header() {
  return (
    <header className="border-b border-border bg-background">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2 text-primary">
              <Video className="h-6 w-6" />
              <span className="font-semibold">AI Video Creator</span>
            </Link>
            <nav className="flex items-center gap-6">
              <Link href="/" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                Create Video
              </Link>
              <Link href="/history" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                History
              </Link>
            </nav>
          </div>
          <ThemeSwitcher />
        </div>
      </div>
    </header>
  )
}

