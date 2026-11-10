"use client"

import * as React from "react"
import { RotateCcwIcon, SlidersHorizontalIcon } from "lucide-react"

import { Button, buttonVariants } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

const settings = [
  {
    group: "Foundation Logo",
    key: "foundationLogoSize",
    label: "Size",
    property: "--report-foundation-logo-size",
    defaultValue: 16,
    min: 8,
    max: 60,
  },
  {
    group: "Foundation Logo",
    key: "foundationLogoX",
    label: "Horizontal position",
    property: "--report-foundation-logo-x",
    defaultValue: 0,
    min: -20,
    max: 20,
  },
  {
    group: "Foundation Logo",
    key: "foundationLogoY",
    label: "Vertical position",
    property: "--report-foundation-logo-y",
    defaultValue: 0,
    min: -12,
    max: 12,
  },
  {
    group: "School Logo",
    key: "schoolLogoSize",
    label: "Size",
    property: "--report-school-logo-size",
    defaultValue: 16,
    min: 8,
    max: 60,
  },
  {
    group: "School Logo",
    key: "schoolLogoX",
    label: "Horizontal position",
    property: "--report-school-logo-x",
    defaultValue: 0,
    min: -20,
    max: 20,
  },
  {
    group: "School Logo",
    key: "schoolLogoY",
    label: "Vertical position",
    property: "--report-school-logo-y",
    defaultValue: 0,
    min: -12,
    max: 12,
  },
  {
    group: "Footer",
    key: "footerTop",
    label: "Vertical position",
    property: "--report-footer-top",
    defaultValue: 4,
    min: 0,
    max: 35,
  },
  {
    group: "Footer",
    key: "footerInset",
    label: "Side inset",
    property: "--report-footer-inset",
    defaultValue: 0,
    min: 0,
    max: 30,
  },
  {
    group: "Footer",
    key: "footerGap",
    label: "Signature block gap",
    property: "--report-footer-gap",
    defaultValue: 25,
    min: 0,
    max: 60,
  },
  {
    group: "Homeroom Signature",
    key: "homeroomSignatureSize",
    label: "Size",
    property: "--report-homeroom-signature-size",
    defaultValue: 30,
    min: 10,
    max: 100,
  },
  {
    group: "Homeroom Signature",
    key: "homeroomSignatureX",
    label: "Horizontal position",
    property: "--report-homeroom-signature-x",
    defaultValue: 0,
    min: -50,
    max: 50,
  },
  {
    group: "Homeroom Signature",
    key: "homeroomSignatureY",
    label: "Vertical position",
    property: "--report-homeroom-signature-y",
    defaultValue: 0,
    min: -40,
    max: 40,
  },
  {
    group: "Principal Signature",
    key: "principalSignatureSize",
    label: "Size",
    property: "--report-principal-signature-size",
    defaultValue: 30,
    min: 10,
    max: 100,
  },
  {
    group: "Principal Signature",
    key: "principalSignatureX",
    label: "Horizontal position",
    property: "--report-principal-signature-x",
    defaultValue: 0,
    min: -50,
    max: 50,
  },
  {
    group: "Principal Signature",
    key: "principalSignatureY",
    label: "Vertical position",
    property: "--report-principal-signature-y",
    defaultValue: 0,
    min: -40,
    max: 40,
  },
  {
    group: "Stamp",
    key: "stampSize",
    label: "Size",
    property: "--report-stamp-size",
    defaultValue: 23,
    min: 10,
    max: 100,
  },
  {
    group: "Stamp",
    key: "stampX",
    label: "Horizontal position",
    property: "--report-stamp-x",
    defaultValue: -7,
    min: -35,
    max: 35,
  },
  {
    group: "Stamp",
    key: "stampY",
    label: "Vertical position",
    property: "--report-stamp-y",
    defaultValue: 0,
    min: -20,
    max: 20,
  },
] as const

type SettingKey = (typeof settings)[number]["key"]
type LayoutValues = Record<SettingKey, number>

const defaults = Object.fromEntries(
  settings.map((setting) => [setting.key, setting.defaultValue])
) as LayoutValues

export function ReportLayoutEditor({
  mode = "standard",
}: {
  mode?: "standard" | "tahsin"
}) {
  const editorRef = React.useRef<HTMLButtonElement>(null)
  const [values, setValues] = React.useState(defaults)

  function applySetting(property: string, value: number) {
    editorRef.current
      ?.closest<HTMLElement>(".monthly-report-export")
      ?.style.setProperty(property, `${value}mm`)
  }

  function updateSetting(setting: (typeof settings)[number], value: number) {
    setValues((current) => ({ ...current, [setting.key]: value }))
    applySetting(setting.property, value)
  }

  function resetLayout() {
    setValues(defaults)
    for (const setting of settings) {
      applySetting(setting.property, setting.defaultValue)
    }
  }

  return (
    <Sheet modal={false} disablePointerDismissal>
      <SheetTrigger
        ref={editorRef}
        className={buttonVariants({ variant: "outline" })}
      >
        <SlidersHorizontalIcon />
        Edit layout
      </SheetTrigger>
      <SheetContent
        side="right"
        showOverlay={false}
        className="w-full sm:max-w-md"
      >
        <SheetHeader className="border-b pr-14">
          <div className="flex items-start justify-between gap-3">
            <div>
              <SheetTitle>Report layout</SheetTitle>
              <SheetDescription>
                Changes apply to every report page in this export.
              </SheetDescription>
            </div>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={resetLayout}
            >
              <RotateCcwIcon />
              Reset
            </Button>
          </div>
        </SheetHeader>

        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          {(mode === "tahsin"
            ? ["Footer", "Homeroom Signature"]
            : [
                "Foundation Logo",
                "School Logo",
                "Footer",
                "Homeroom Signature",
                "Principal Signature",
                "Stamp",
              ]
          ).map((group) => (
            <fieldset key={group} className="space-y-3 border p-4">
              <legend className="px-1 text-xs font-medium">{group}</legend>
              {settings
                .filter((setting) => setting.group === group)
                .map((setting) => (
                  <label key={setting.key} className="block text-xs">
                    <span className="mb-1 flex justify-between gap-3">
                      <span>{setting.label}</span>
                      <output>{values[setting.key]} mm</output>
                    </span>
                    <input
                      type="range"
                      min={setting.min}
                      max={setting.max}
                      value={values[setting.key]}
                      onChange={(event) =>
                        updateSetting(setting, Number(event.target.value))
                      }
                      className="w-full accent-primary"
                    />
                  </label>
                ))}
            </fieldset>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  )
}
