"use client"

import * as React from "react"
import { CheckIcon, ChevronsUpDownIcon, LoaderCircleIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

export type RegionOption = {
  id: string
  name: string
  postal_code?: string
}

export function RegionCombobox({
  id,
  name,
  value,
  options,
  placeholder,
  searchPlaceholder,
  disabled,
  loading,
  onChange,
}: {
  id: string
  name: string
  value: RegionOption | null
  options: RegionOption[]
  placeholder: string
  searchPlaceholder: string
  disabled?: boolean
  loading?: boolean
  onChange: (option: RegionOption) => void
}) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")
  const filtered = options.filter((option) =>
    option.name.toLocaleLowerCase("id").includes(search.toLocaleLowerCase("id"))
  )

  return (
    <>
      <input type="hidden" name={name} value={value?.name ?? ""} />
      <Popover
        open={open}
        onOpenChange={(nextOpen) => {
          setOpen(nextOpen)
          if (!nextOpen) setSearch("")
        }}
      >
        <PopoverTrigger
          render={
            <Button
              id={id}
              type="button"
              variant="outline"
              role="combobox"
              aria-expanded={open}
              disabled={disabled || loading}
              className={cn(
                "w-full justify-between font-normal",
                !value && "text-muted-foreground"
              )}
            />
          }
        >
          <span className="truncate">
            {loading ? "Loading..." : value?.name || placeholder}
          </span>
          {loading ? (
            <LoaderCircleIcon className="animate-spin" />
          ) : (
            <ChevronsUpDownIcon className="opacity-50" />
          )}
        </PopoverTrigger>
        <PopoverContent align="start" className="w-(--anchor-width) p-0">
          <div className="border-b p-2">
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={searchPlaceholder}
              autoFocus
            />
          </div>
          <div className="max-h-64 overflow-y-auto p-1">
            {filtered.map((option) => (
              <button
                key={option.id}
                type="button"
                className="flex w-full items-center gap-2 px-2 py-2 text-left text-xs hover:bg-accent hover:text-accent-foreground"
                onClick={() => {
                  onChange(option)
                  setOpen(false)
                  setSearch("")
                }}
              >
                <CheckIcon
                  className={cn(
                    "size-4 shrink-0",
                    value?.id === option.id ? "opacity-100" : "opacity-0"
                  )}
                />
                <span>{option.name}</span>
              </button>
            ))}
            {!loading && filtered.length === 0 && (
              <p className="px-3 py-6 text-center text-xs text-muted-foreground">
                No region found.
              </p>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </>
  )
}
