"use client"

import { useEffect, useRef } from "react"
import toast from "react-hot-toast"

type ActionState = { error?: string; success?: string; warning?: string }

export function useActionToast(state: ActionState) {
  const previousState = useRef<ActionState | null>(null)

  useEffect(() => {
    if (previousState.current === state) return
    previousState.current = state

    if (state.error) {
      toast.error(state.error)
      return
    }
    if (state.success) toast.success(state.success)
    if (state.warning) toast(state.warning, { icon: "⚠️" })
  }, [state])
}
