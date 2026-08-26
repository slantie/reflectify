"use client"

import { Toaster } from "react-hot-toast"

export function ToastProvider() {
  return (
    <Toaster
      position="bottom-right"
      toastOptions={{
        duration: 4_000,
        style: {
          border: "1px solid var(--border)",
          borderRadius: "0.75rem",
          background: "var(--card)",
          color: "var(--card-foreground)",
          boxShadow: "0 10px 30px rgb(0 0 0 / 0.12)",
        },
      }}
    />
  )
}
