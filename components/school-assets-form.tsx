"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { ImageIcon, ScanLineIcon, SchoolIcon } from "lucide-react"
import { toast } from "sonner"

import { saveSchoolAssets } from "@/app/(main)/school-assets/actions"
import { ImageUploadField } from "@/components/image-upload-field"
import {
  AlertDialog,
  AlertDialogActionButton,
  AlertDialogCancelButton,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export function SchoolAssetsForm({
  canEdit,
  assetUrls,
}: {
  canEdit: boolean
  assetUrls: {
    logo: string | null
    foundationLogo: string | null
    stamp: string | null
  }
}) {
  const router = useRouter()
  const formRef = React.useRef<HTMLFormElement>(null)
  const [state, action, pending] = React.useActionState(saveSchoolAssets, {})
  const [dirty, setDirty] = React.useState(false)
  const [leaveOpen, setLeaveOpen] = React.useState(false)
  const [nextUrl, setNextUrl] = React.useState("")

  React.useEffect(() => {
    if (!dirty) return
    const warn = (event: BeforeUnloadEvent) => event.preventDefault()
    window.addEventListener("beforeunload", warn)
    return () => window.removeEventListener("beforeunload", warn)
  }, [dirty])

  React.useEffect(() => {
    if (!dirty || pending) return

    function interceptNavigation(event: MouseEvent) {
      if (
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return
      }
      const link = (event.target as Element).closest(
        "a[href]"
      ) as HTMLAnchorElement | null
      if (
        !link ||
        link.target === "_blank" ||
        link.origin !== window.location.origin
      ) {
        return
      }
      const destination = `${link.pathname}${link.search}${link.hash}`
      if (
        destination === `${location.pathname}${location.search}${location.hash}`
      ) {
        return
      }
      event.preventDefault()
      event.stopPropagation()
      setNextUrl(destination)
      setLeaveOpen(true)
    }

    document.addEventListener("click", interceptNavigation, true)
    return () =>
      document.removeEventListener("click", interceptNavigation, true)
  }, [dirty, pending])

  React.useEffect(() => {
    if (state.error) toast.error(state.error)
    if (state.success) {
      toast.success(state.success)
      const frame = requestAnimationFrame(() => setDirty(false))
      return () => cancelAnimationFrame(frame)
    }
  }, [state])

  function updateDirty() {
    const form = formRef.current
    if (!form) return
    setDirty(
      [...form.querySelectorAll<HTMLInputElement>('input[type="file"]')].some(
        (input) => (input.files?.[0]?.size ?? 0) > 0
      )
    )
  }

  return (
    <form
      ref={formRef}
      action={action}
      onChange={updateDirty}
      className="space-y-6"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            School Assets
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage logos and stamp used in school reports.
          </p>
        </div>
        {canEdit && (
          <Button type="submit" disabled={pending || !dirty}>
            {pending ? "Saving..." : "Save school assets"}
          </Button>
        )}
      </div>
      <fieldset
        disabled={!canEdit || pending}
        className="grid gap-6 lg:grid-cols-3"
      >
        <AssetCard
          icon={SchoolIcon}
          title="School Logo"
          description="Official logo used in school reports."
        >
          <ImageUploadField
            id="logo"
            name="logo"
            label="School logo"
            description="Square JPG, PNG, or WebP up to 2 MB."
            imageUrl={assetUrls.logo}
          />
        </AssetCard>

        <AssetCard
          icon={ImageIcon}
          title="Foundation Logo"
          description="Official foundation or organization logo."
        >
          <ImageUploadField
            id="foundationLogo"
            name="foundationLogo"
            label="Foundation logo"
            description="Square JPG, PNG, or WebP up to 2 MB."
            imageUrl={assetUrls.foundationLogo}
          />
        </AssetCard>

        <AssetCard
          icon={ScanLineIcon}
          title="School Stamp"
          description="Stamp image used in generated reports."
        >
          <ImageUploadField
            id="stamp"
            name="stamp"
            label="School stamp"
            description="Transparent PNG gives the best result. Maximum 2 MB."
            imageUrl={assetUrls.stamp}
          />
        </AssetCard>
      </fieldset>

      <AlertDialog open={leaveOpen} onOpenChange={setLeaveOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard unsaved changes?</AlertDialogTitle>
            <AlertDialogDescription>
              Selected school assets have not been saved. Leaving this page will
              discard them.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancelButton>Stay on page</AlertDialogCancelButton>
            <AlertDialogActionButton
              onClick={() => {
                setDirty(false)
                router.push(nextUrl)
              }}
            >
              Discard and leave
            </AlertDialogActionButton>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </form>
  )
}

function AssetCard({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: typeof SchoolIcon
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <Card>
      <CardHeader className="border-b">
        <div className="flex items-start gap-3">
          <div className="flex size-8 shrink-0 items-center justify-center bg-primary/10 text-primary">
            <Icon className="size-4" />
          </div>
          <div className="space-y-1">
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}
