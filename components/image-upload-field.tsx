"use client"

import * as React from "react"
import { ImageIcon, ImageUpIcon } from "lucide-react"

import { buttonVariants } from "@/components/ui/button"

export function ImageUploadField({
  id,
  name,
  label,
  description,
  imageUrl,
  className = "size-32",
}: {
  id: string
  name: string
  label: string
  description: string
  imageUrl: string | null
  className?: string
}) {
  const [previewUrl, setPreviewUrl] = React.useState(imageUrl)
  const objectUrl = React.useRef<string | null>(null)

  React.useEffect(
    () => () => {
      if (objectUrl.current) URL.revokeObjectURL(objectUrl.current)
    },
    []
  )

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    if (objectUrl.current) URL.revokeObjectURL(objectUrl.current)
    objectUrl.current = URL.createObjectURL(file)
    setPreviewUrl(objectUrl.current)
  }

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <div
        role="img"
        aria-label={`${label} preview`}
        className={`flex shrink-0 items-center justify-center border bg-muted bg-contain bg-center bg-no-repeat ${className}`}
        style={
          previewUrl ? { backgroundImage: `url(${previewUrl})` } : undefined
        }
      >
        {!previewUrl && <ImageIcon className="size-12 text-muted-foreground" />}
      </div>
      <div className="space-y-2">
        <label htmlFor={id} className={buttonVariants({ variant: "outline" })}>
          <ImageUpIcon />
          Choose image
        </label>
        <input
          id={id}
          name={name}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          onChange={handleChange}
        />
        <p className="max-w-md text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  )
}
