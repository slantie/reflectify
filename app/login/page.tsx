import Link from "next/link"
import { ArrowLeftIcon } from "@phosphor-icons/react/dist/ssr"

import { LoginForm } from "@/components/ui/alphine-login-form"
import { ReflectifyMark } from "@/components/reflectify-mark"
import { Button } from "@/components/ui/button"

export default function LoginPage() {
  return (
    <main className="grid min-h-svh bg-muted/35 lg:grid-cols-2">
      <section className="flex flex-col p-5 md:p-8">
        <div className="flex items-center justify-between"><ReflectifyMark /><Button variant="ghost" render={<Link href="/" />}><ArrowLeftIcon /> Back home</Button></div>
        <div className="mx-auto flex w-full max-w-md flex-1 items-center py-12"><LoginForm className="w-full" /></div>
      </section>
      <section className="relative hidden overflow-hidden bg-primary p-12 text-primary-foreground lg:flex lg:flex-col lg:justify-end">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,white/.28,transparent_27rem)]" />
        <div className="relative max-w-lg"><p className="text-sm font-medium text-primary-foreground/75">Reflectify workspace</p><h1 className="mt-4 text-5xl font-semibold tracking-[-0.04em] text-balance">Focus the conversation. Improve the experience.</h1><p className="mt-6 max-w-md text-lg leading-8 text-primary-foreground/80">Your academic feedback data is ready in the new unified workspace.</p></div>
      </section>
    </main>
  )
}
