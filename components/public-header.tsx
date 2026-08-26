"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ArrowRightIcon, ListIcon } from "@phosphor-icons/react"

import { ReflectifyMark } from "@/components/reflectify-mark"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"

const publicLinks = [
  { label: "Home", href: "/" },
  { label: "About us", href: "/about-us" },
  { label: "Docs", href: "/docs" },
  { label: "Contact", href: "/contact" },
]

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === href : pathname.startsWith(href)
}

function PublicLink({
  href,
  label,
  mobile = false,
}: {
  href: string
  label: string
  mobile?: boolean
}) {
  const pathname = usePathname()
  const active = isActive(pathname, href)
  return (
    <Link
      href={href}
      className={cn(
        "rounded-lg text-sm font-medium transition-colors",
        mobile ? "block px-3 py-2.5" : "px-2.5 py-2",
        active
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      {label}
    </Link>
  )
}

export function PublicHeader() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur supports-backdrop-filter:bg-background/80">
      <div className="mx-auto flex h-16 w-full  items-center gap-4 px-4 sm:px-6">
        <Link href="/" aria-label="Reflectify home" className="shrink-0">
          <ReflectifyMark />
        </Link>
        <nav
          className="hidden min-w-0 flex-1 items-center gap-1 md:flex"
          aria-label="Public navigation"
        >
          {publicLinks.map((link) => (
            <PublicLink key={link.href} {...link} />
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <Button size="sm" render={<Link href="/login" />}>
            Sign in
            <ArrowRightIcon weight="bold" />
          </Button>
          <Sheet>
            <SheetTrigger
              render={
                <Button
                  variant="outline"
                  size="icon"
                  className="md:hidden"
                  aria-label="Open public navigation"
                  title="Open navigation"
                />
              }
            >
              <ListIcon />
            </SheetTrigger>
            <SheetContent side="right" className="w-[min(22rem,88vw)] p-0">
              <SheetHeader className="border-b px-5 py-5">
                <SheetTitle>
                  <ReflectifyMark />
                </SheetTitle>
                <SheetDescription>
                  Learn about Reflectify and its academic feedback workflow.
                </SheetDescription>
              </SheetHeader>
              <nav
                className="flex flex-col gap-1 p-3"
                aria-label="Public navigation"
              >
                {publicLinks.map((link) => (
                  <SheetClose
                    key={link.href}
                    render={<PublicLink {...link} mobile />}
                  />
                ))}
                <div className="mt-3 border-t pt-3">
                  <SheetClose
                    render={
                      <Button
                        className="w-full"
                        render={<Link href="/login" />}
                      >
                        Sign in to workspace
                        <ArrowRightIcon weight="bold" />
                      </Button>
                    }
                  />
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
