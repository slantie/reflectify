"use client"

import { useActionState } from "react"
import { EnvelopeSimpleIcon, LockKeyIcon, SignInIcon, WarningCircleIcon } from "@phosphor-icons/react"

import { login } from "@/app/actions/auth"
import { cn } from "@/lib/utils"
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="border-border/70 shadow-xl shadow-primary/5">
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl">Welcome back</CardTitle>
          <p className="text-sm text-muted-foreground">Sign in with your existing Reflectify administrator account.</p>
        </CardHeader>
        <CardContent>
          <LoginFields />
        </CardContent>
      </Card>
      <p className="text-balance text-center text-xs leading-relaxed text-muted-foreground">
        Your existing administrator credentials are securely verified against Reflectify.
      </p>
    </div>
  )
}

function LoginFields() {
  const [state, formAction, pending] = useActionState(login, {})

  return (
    <form action={formAction} noValidate>
      <div className="flex flex-col gap-5">
        {state.error && (
          <div role="alert" className="flex items-center gap-2 rounded-lg border border-destructive/25 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
            <WarningCircleIcon className="size-4 shrink-0" weight="fill" />
            {state.error}
          </div>
        )}
        <div className="flex flex-col gap-2">
          <Label htmlFor="email">Email address</Label>
          <div className="relative">
            <EnvelopeSimpleIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input id="email" name="email" type="email" autoComplete="email" placeholder="you@college.edu" required aria-describedby={state.fieldErrors?.email ? "email-error" : undefined} className="pl-9" />
          </div>
          {state.fieldErrors?.email && <p id="email-error" className="text-sm text-destructive">{state.fieldErrors.email[0]}</p>}
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <LockKeyIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input id="password" name="password" type="password" autoComplete="current-password" required aria-describedby={state.fieldErrors?.password ? "password-error" : undefined} className="pl-9" />
          </div>
          {state.fieldErrors?.password && <p id="password-error" className="text-sm text-destructive">{state.fieldErrors.password[0]}</p>}
        </div>
        <Button type="submit" size="lg" className="w-full" disabled={pending}>
          <SignInIcon className="size-4" weight="bold" />
          {pending ? "Signing in…" : "Sign in to workspace"}
        </Button>
      </div>
    </form>
  )
}
