"use client"

import { useActionState, useEffect, useState } from "react"
import { TrashIcon } from "@phosphor-icons/react"
import { useRouter } from "next/navigation"

import {
  deleteFeedbackForm,
  type FeedbackManagementState,
} from "@/app/actions/feedback-management"
import { useActionToast } from "@/components/feedback/use-action-toast"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

const initialState: FeedbackManagementState = {}

export function DeleteFeedbackFormDialog({
  formId,
  returnToList = false,
}: {
  formId: string
  returnToList?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [state, formAction, pending] = useActionState(
    deleteFeedbackForm,
    initialState
  )
  const router = useRouter()
  useActionToast(state)

  useEffect(() => {
    if (!state.success) return
    if (returnToList) {
      router.replace("/feedback-forms")
      return
    }
    router.refresh()
  }, [returnToList, router, state.success])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            size="sm"
            variant="outline"
            className="border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
          />
        }
      >
        <TrashIcon />
        Delete
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete this feedback form?</DialogTitle>
          <DialogDescription>
            This removes the form, its questions, issued access links, and any
            imported student list from the workspace. Forms with submitted
            feedback are protected and must be closed instead.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="formId" value={formId} />
          {state.error && (
            <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {state.error}
            </p>
          )}
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>
              Cancel
            </DialogClose>
            <Button type="submit" variant="destructive" disabled={pending}>
              <TrashIcon />
              {pending ? "Deleting…" : "Delete form"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
