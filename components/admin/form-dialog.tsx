"use client"

import * as React from "react"
import { IconAlertTriangle } from "@tabler/icons-react"

import type { ActionResult } from "@/lib/editing"
import { Alert, AlertTitle } from "@/components/ui/alert"
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

function FormDialog({
  trigger,
  title,
  description,
  submitLabel = "Enregistrer",
  variant = "default",
  action,
  children,
}: {
  trigger: React.ReactElement
  title: string
  description?: string
  submitLabel?: string
  variant?: "default" | "destructive"
  action: (formData: FormData) => Promise<ActionResult>
  children?: React.ReactNode
}) {
  const [open, setOpen] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [pending, startTransition] = React.useTransition()

  // The action is awaited inside the transition rather than watched from an
  // effect, so the dialog can close on success and keep the form (and the
  // message) in place on failure.
  function submit(formData: FormData) {
    startTransition(async () => {
      const result = await action(formData)

      if (result.ok) {
        setError(null)
        setOpen(false)
      } else {
        setError(result.error)
      }
    })
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) setError(null)
      }}
    >
      <DialogTrigger render={trigger} />
      <DialogContent className="sm:max-w-lg">
        <form action={submit} className="grid gap-6">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            {description ? (
              <DialogDescription>{description}</DialogDescription>
            ) : null}
          </DialogHeader>

          {children ? <div className="grid gap-4">{children}</div> : null}

          {error ? (
            <Alert variant="destructive">
              <IconAlertTriangle />
              <AlertTitle>{error}</AlertTitle>
            </Alert>
          ) : null}

          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>
              Annuler
            </DialogClose>
            <Button type="submit" variant={variant} disabled={pending}>
              {pending ? "Enregistrement…" : submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function Field({
  label,
  hint,
  className,
  defaultValue,
  ...props
}: React.ComponentProps<"input"> & { label: string; hint?: string }) {
  const generated = React.useId()
  const id = props.id ?? generated

  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      {/* Normalized to a string: handing Base UI `undefined` makes it treat the
          field as initialized-then-changed and warn about it. */}
      <Input
        id={id}
        className={className}
        defaultValue={defaultValue ?? ""}
        {...props}
      />
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  )
}

export { FormDialog, Field }
