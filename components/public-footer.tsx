import Link from "next/link"
import { ArrowRightIcon, MapPinIcon } from "@phosphor-icons/react/dist/ssr"

import { ReflectifyMark } from "@/components/reflectify-mark"

const columns = [
  {
    title: "Product",
    links: [
      { label: "Home", href: "/" },
      { label: "Docs", href: "/docs" },
      { label: "Open workspace", href: "/login" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About us", href: "/about-us" },
      { label: "Contact", href: "/contact" },
    ],
  },
]

export function PublicFooter() {
  return (
    <footer className="border-t bg-background">
      <div className="mx-auto grid w-full gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.2fr_1fr_1fr]">
        <div>
          <ReflectifyMark />
          <p className="mt-4 max-w-xs text-sm leading-6 text-muted-foreground">
            Academic feedback, made clear. One calm workspace for collecting
            student voice and turning responses into useful insight.
          </p>
          <p className="mt-4 flex items-center gap-2 text-xs leading-5 text-muted-foreground">
            <MapPinIcon
              className="size-4 shrink-0 text-primary"
              weight="fill"
            />
            Built at LDRP Institute of Technology and Research, Gandhinagar
          </p>
        </div>

        {columns.map((column) => (
          <nav key={column.title} aria-label={column.title}>
            <p className="font-mono text-xs font-medium tracking-widest text-muted-foreground uppercase">
              {"// "}
              {column.title}
            </p>
            <ul className="mt-4 space-y-2.5">
              {column.links.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
                    {link.href === "/login" && (
                      <ArrowRightIcon className="size-3.5" weight="bold" />
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>

      <div className="border-t">
        <div className="text-muted-foreground mx-auto w-full px-4 py-5 text-xs sm:px-6">
          <p>© {new Date().getFullYear()} Reflectify. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
