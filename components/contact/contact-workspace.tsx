"use client"

import { useActionState, useEffect, useRef } from "react"
import { PaperPlaneTiltIcon } from "@phosphor-icons/react"

import { submitContactMessage, type ContactState } from "@/app/actions/contact"
import { useActionToast } from "@/components/feedback/use-action-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

const initialState: ContactState = {}

function errors(messages?: string[]) {
  return messages?.map((message) => ({ message }))
}

export function ContactWorkspace() {
  const formRef = useRef<HTMLFormElement>(null)
  const [state, formAction, pending] = useActionState(
    submitContactMessage,
    initialState
  )
  useActionToast(state)

  useEffect(() => {
    if (state.success) formRef.current?.reset()
  }, [state.success])

  return (
    <form ref={formRef} action={formAction} className="space-y-5">
      <div className="sr-only" aria-hidden="true">
        <Field>
          <FieldLabel htmlFor="website">Website</FieldLabel>
          <Input id="website" name="website" autoComplete="off" tabIndex={-1} />
        </Field>
      </div>
      {state.error ? (
        <Alert variant="destructive">
          <AlertTitle>Message could not be sent</AlertTitle>
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}
      <FieldGroup className="gap-4 sm:grid sm:grid-cols-2">
        <Field data-invalid={Boolean(state.fieldErrors?.name)}>
          <FieldLabel htmlFor="contact-name">Name</FieldLabel>
          <Input
            id="contact-name"
            name="name"
            autoComplete="name"
            placeholder="Your name"
            aria-invalid={Boolean(state.fieldErrors?.name)}
            required
          />
          <FieldError errors={errors(state.fieldErrors?.name)} />
        </Field>
        <Field data-invalid={Boolean(state.fieldErrors?.email)}>
          <FieldLabel htmlFor="contact-email">Email</FieldLabel>
          <Input
            id="contact-email"
            type="email"
            name="email"
            autoComplete="email"
            placeholder="you@example.com"
            aria-invalid={Boolean(state.fieldErrors?.email)}
            required
          />
          <FieldError errors={errors(state.fieldErrors?.email)} />
        </Field>
      </FieldGroup>
      <Field data-invalid={Boolean(state.fieldErrors?.subject)}>
        <FieldLabel htmlFor="contact-subject">Subject</FieldLabel>
        <Input
          id="contact-subject"
          name="subject"
          placeholder="How can we help?"
          aria-invalid={Boolean(state.fieldErrors?.subject)}
          required
        />
        <FieldError errors={errors(state.fieldErrors?.subject)} />
      </Field>
      <Field data-invalid={Boolean(state.fieldErrors?.message)}>
        <FieldLabel htmlFor="contact-message">Message</FieldLabel>
        <Textarea
          id="contact-message"
          name="message"
          placeholder="Tell us what you need."
          className="min-h-36 resize-y"
          aria-invalid={Boolean(state.fieldErrors?.message)}
          required
        />
        <FieldError errors={errors(state.fieldErrors?.message)} />
      </Field>
      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        <PaperPlaneTiltIcon weight="fill" />
        {pending ? "Sending message…" : "Send message"}
      </Button>
    </form>
  )
}
