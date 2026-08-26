"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  BuildingsIcon,
  CalendarDotsIcon,
  CaretDownIcon,
  ChartLineUpIcon,
  ClipboardTextIcon,
  FileArrowUpIcon,
  GraduationCapIcon,
  HouseIcon,
  ListIcon,
  SignOutIcon,
  UserListIcon,
  UsersThreeIcon,
} from "@phosphor-icons/react"

import { logout } from "@/app/actions/auth"
import { ReflectifyMark } from "@/components/reflectify-mark"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import type { CurrentAdmin } from "@/lib/auth/dal"
import { cn } from "@/lib/utils"

type NavigationItem = {
  label: string
  href: string
  icon: React.ComponentType<{
    className?: string
    weight?: "regular" | "fill"
  }>
}

const academicLinks: NavigationItem[] = [
  { label: "Academic years", href: "/academic-years", icon: CalendarDotsIcon },
  { label: "Colleges", href: "/colleges", icon: BuildingsIcon },
  { label: "Departments", href: "/departments", icon: BuildingsIcon },
  { label: "Semesters", href: "/semesters", icon: CalendarDotsIcon },
  { label: "Divisions", href: "/divisions", icon: UsersThreeIcon },
  { label: "Subjects", href: "/subjects", icon: GraduationCapIcon },
  { label: "Faculty", href: "/faculty", icon: UsersThreeIcon },
  { label: "Allocations", href: "/allocations", icon: UserListIcon },
]

const primaryLinks: NavigationItem[] = [
  { label: "Overview", href: "/dashboard", icon: HouseIcon },
  { label: "Upload data", href: "/upload", icon: FileArrowUpIcon },
  { label: "Feedback", href: "/feedback-forms", icon: ClipboardTextIcon },
  { label: "Schedule", href: "/schedule", icon: CalendarDotsIcon },
  { label: "Analytics", href: "/analytics", icon: ChartLineUpIcon },
]

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()
}

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(href + "/")
}

function HeaderLink({
  item,
  mobile = false,
}: {
  item: NavigationItem
  mobile?: boolean
}) {
  const pathname = usePathname()
  const active = isActive(pathname, item.href)
  const Icon = item.icon

  return (
    <Link
      href={item.href}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg text-sm font-medium transition-colors",
        mobile ? "px-3 py-2.5" : "h-8 px-2.5",
        active
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      <Icon className="size-4" weight={active ? "fill" : "regular"} />
      {item.label}
    </Link>
  )
}

export function DashboardShell({
  admin,
  children,
}: {
  admin: CurrentAdmin
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const academicActive = academicLinks.some((item) =>
    isActive(pathname, item.href)
  )
  return (
    <div className="min-h-svh bg-muted/30">
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80">
        <div className="mx-auto flex h-16 w-full items-center gap-4 px-4 md:px-6">
          <Link
            href="/dashboard"
            aria-label="Reflectify dashboard"
            className="shrink-0"
          >
            <ReflectifyMark />
          </Link>

          <nav
            className="hidden min-w-0 flex-1 items-center gap-1 lg:flex"
            aria-label="Workspace navigation"
          >
            {primaryLinks.slice(0, 2).map((item) => (
              <HeaderLink key={item.href} item={item} />
            ))}
            <DropdownMenu>
              <DropdownMenuTrigger
                render={<Button variant="ghost" size="default" />}
              >
                <GraduationCapIcon
                  className="size-4"
                  weight={academicActive ? "fill" : "regular"}
                />
                Academic
                <CaretDownIcon className="size-3.5" />
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-52" align="start">
                <DropdownMenuGroup>
                  <DropdownMenuLabel>Academic setup</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {academicLinks.map((item) => {
                    const Icon = item.icon
                    const active = isActive(pathname, item.href)
                    return (
                      <DropdownMenuItem
                        key={item.href}
                        render={<Link href={item.href} />}
                      >
                        <Icon
                          className={cn("size-4", active && "text-primary")}
                          weight={active ? "fill" : "regular"}
                        />
                        {item.label}
                      </DropdownMenuItem>
                    )
                  })}
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
            <HeaderLink item={primaryLinks[2]} />
            <HeaderLink item={primaryLinks[3]} />
            <HeaderLink item={primaryLinks[4]} />
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <Badge variant="outline" className="hidden sm:inline-flex">
              {admin.isSuper
                ? "Super admin"
                : admin.designation.replace("_", " ")}
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Open account menu"
                    title="Account menu"
                  />
                }
              >
                <Avatar size="sm">
                  <AvatarFallback>{initials(admin.name)}</AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuGroup>
                  <DropdownMenuLabel>
                    <p className="truncate text-sm font-medium">{admin.name}</p>
                    <p className="truncate text-xs font-normal text-muted-foreground">
                      {admin.email}
                    </p>
                  </DropdownMenuLabel>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <form action={logout}>
                  <Button
                    type="submit"
                    variant="ghost"
                    className="w-full justify-start"
                  >
                    <SignOutIcon />
                    Log out
                  </Button>
                </form>
              </DropdownMenuContent>
            </DropdownMenu>
            <Sheet>
              <SheetTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon"
                    className="lg:hidden"
                    aria-label="Open navigation"
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
                    Navigate your academic feedback workspace.
                  </SheetDescription>
                </SheetHeader>
                <nav
                  className="flex flex-col gap-1 p-3"
                  aria-label="Workspace navigation"
                >
                  {primaryLinks.map((item) => (
                    <SheetClose
                      key={item.href}
                      render={<HeaderLink item={item} mobile />}
                    />
                  ))}
                  <p className="px-3 pt-5 pb-2 text-xs font-medium text-muted-foreground">
                    Academic setup
                  </p>
                  {academicLinks.map((item) => (
                    <SheetClose
                      key={item.href}
                      render={<HeaderLink item={item} mobile />}
                    />
                  ))}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full px-4 py-4 md:px-6 md:py-6">
        {children}
      </main>
    </div>
  )
}
