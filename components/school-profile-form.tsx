"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import type { LucideIcon } from "lucide-react"
import {
  ContactIcon,
  IdCardIcon,
  MapPinIcon,
  UserRoundIcon,
} from "lucide-react"
import { toast } from "sonner"

import { saveSchoolProfile } from "@/app/(main)/school-profile/actions"
import { SchoolAddressFields } from "@/components/school-address-fields"
import { Button } from "@/components/ui/button"
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type SchoolProfile = {
  name: string
  educationLevel: string
  nss: string
  npsn: string
  street: string
  village: string
  district: string
  regency: string
  province: string
  postalCode: string
  phoneFax: string
  email: string
  website: string
  principalUserId: string
}

type TeacherOption = {
  id: string
  name: string
  nip: string | null
}

export function SchoolProfileForm({
  profile,
  teachers,
  canEdit,
}: {
  profile: SchoolProfile
  teachers: TeacherOption[]
  canEdit: boolean
}) {
  const router = useRouter()
  const formRef = React.useRef<HTMLFormElement>(null)
  const initialValues = React.useRef("")
  const [state, action, pending] = React.useActionState(saveSchoolProfile, {})
  const [dirty, setDirty] = React.useState(false)
  const [leaveOpen, setLeaveOpen] = React.useState(false)
  const [nextUrl, setNextUrl] = React.useState("")
  const [educationLevel, setEducationLevel] = React.useState<string | null>(
    profile.educationLevel || null
  )
  const [principalId, setPrincipalId] = React.useState(
    profile.principalUserId || null
  )
  const controlledValues = React.useRef({ educationLevel, principalId })
  const principal = teachers.find((teacher) => teacher.id === principalId)

  React.useEffect(() => {
    const form = formRef.current
    if (!form) return
    initialValues.current = serializeForm(
      form,
      controlledValues.current.educationLevel,
      controlledValues.current.principalId
    )
  }, [])

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
    if (!state.success) return
    const form = formRef.current
    if (form) {
      initialValues.current = serializeForm(
        form,
        controlledValues.current.educationLevel,
        controlledValues.current.principalId
      )
    }
    const frame = requestAnimationFrame(() => setDirty(false))
    return () => cancelAnimationFrame(frame)
  }, [state.success])

  React.useEffect(() => {
    if (state.error) toast.error(state.error)
    if (state.success) toast.success(state.success)
  }, [state])

  function updateDirty(
    nextEducationLevel = educationLevel,
    nextPrincipalId = principalId
  ) {
    const form = formRef.current
    if (form) {
      setDirty(
        serializeForm(form, nextEducationLevel, nextPrincipalId) !==
          initialValues.current
      )
    }
  }

  return (
    <form
      ref={formRef}
      action={action}
      onChange={() => updateDirty()}
      className="space-y-8"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            School Profile
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage school identity, address, contact details, and principal
            data.
          </p>
        </div>
        {canEdit && (
          <Button type="submit" disabled={pending || !dirty}>
            {pending ? "Saving..." : "Save school profile"}
          </Button>
        )}
      </div>
      <fieldset disabled={!canEdit || pending} className="space-y-8">
        <Card>
          <SectionHeading
            icon={IdCardIcon}
            title="Identity"
            description="Official school identity numbers."
          />
          <CardContent>
            <FieldGroup className="grid gap-5 sm:grid-cols-2">
              <Field className="sm:col-span-2">
                <FieldLabel htmlFor="name">School name</FieldLabel>
                <Input
                  id="name"
                  name="name"
                  defaultValue={profile.name}
                  maxLength={200}
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="educationLevel">
                  Education level
                </FieldLabel>
                <Select
                  name="educationLevel"
                  value={educationLevel}
                  onValueChange={(value) => {
                    controlledValues.current.educationLevel = value
                    setEducationLevel(value)
                    updateDirty(value, principalId)
                  }}
                  required
                >
                  <SelectTrigger id="educationLevel" className="w-full">
                    <SelectValue placeholder="Select education level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="early-childhood">
                      Early Childhood / Kindergarten
                    </SelectItem>
                    <SelectItem value="elementary">
                      Elementary School
                    </SelectItem>
                    <SelectItem value="junior-high">
                      Junior High School
                    </SelectItem>
                    <SelectItem value="senior-high">
                      Senior High School
                    </SelectItem>
                    <SelectItem value="vocational">
                      Vocational High School
                    </SelectItem>
                    <SelectItem value="special-school">
                      Special School
                    </SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel htmlFor="nss">NSS</FieldLabel>
                <Input
                  id="nss"
                  name="nss"
                  defaultValue={profile.nss}
                  maxLength={30}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="npsn">NPSN</FieldLabel>
                <Input
                  id="npsn"
                  name="npsn"
                  defaultValue={profile.npsn}
                  maxLength={30}
                />
              </Field>
            </FieldGroup>
          </CardContent>
        </Card>

        <Card>
          <SectionHeading
            icon={MapPinIcon}
            title="Address"
            description="School mailing and administrative address."
          />
          <CardContent>
            <FieldGroup className="grid gap-5 sm:grid-cols-2">
              <Field className="sm:col-span-2">
                <FieldLabel htmlFor="street">Street</FieldLabel>
                <Input
                  id="street"
                  name="street"
                  defaultValue={profile.street}
                  maxLength={250}
                />
              </Field>
              <SchoolAddressFields
                initialProvince={profile.province}
                initialRegency={profile.regency}
                initialDistrict={profile.district}
                initialVillage={profile.village}
                initialPostalCode={profile.postalCode}
                onChange={() => requestAnimationFrame(() => updateDirty())}
              />
            </FieldGroup>
          </CardContent>
        </Card>

        <Card>
          <SectionHeading
            icon={ContactIcon}
            title="Contact"
            description="Public contact information for the school."
          />
          <CardContent>
            <FieldGroup className="grid gap-5 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="phoneFax">Phone / Fax</FieldLabel>
                <Input
                  id="phoneFax"
                  name="phoneFax"
                  type="tel"
                  defaultValue={profile.phoneFax}
                  maxLength={50}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  defaultValue={profile.email}
                  maxLength={200}
                />
              </Field>
              <Field className="sm:col-span-2">
                <FieldLabel htmlFor="website">Website</FieldLabel>
                <Input
                  id="website"
                  name="website"
                  type="url"
                  placeholder="https://school.example.com"
                  defaultValue={profile.website}
                  maxLength={200}
                />
              </Field>
            </FieldGroup>
          </CardContent>
        </Card>

        <Card>
          <SectionHeading
            icon={UserRoundIcon}
            title="Principal"
            description="Select an active teacher as school principal."
          />
          <CardContent>
            <FieldGroup className="grid gap-5 sm:grid-cols-2">
              <Field className="sm:col-span-2">
                <FieldLabel htmlFor="principalUserId">
                  School principal
                </FieldLabel>
                <Select
                  name="principalUserId"
                  value={principalId}
                  onValueChange={(value) => {
                    controlledValues.current.principalId = value
                    setPrincipalId(value)
                    updateDirty(educationLevel, value)
                  }}
                >
                  <SelectTrigger id="principalUserId" className="w-full">
                    <SelectValue placeholder="Select a teacher" />
                  </SelectTrigger>
                  <SelectContent>
                    {teachers.map((teacher) => (
                      <SelectItem key={teacher.id} value={teacher.id}>
                        {teacher.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {teachers.length === 0 && (
                  <FieldDescription>
                    No active teachers are available.
                  </FieldDescription>
                )}
              </Field>
              <Field>
                <FieldLabel htmlFor="principalName">Principal name</FieldLabel>
                <Input
                  id="principalName"
                  value={principal?.name ?? ""}
                  readOnly
                  disabled
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="principalNip">Principal NIP</FieldLabel>
                <Input
                  id="principalNip"
                  value={principal?.nip ?? ""}
                  readOnly
                  disabled
                />
              </Field>
            </FieldGroup>
          </CardContent>
        </Card>
      </fieldset>

      <AlertDialog open={leaveOpen} onOpenChange={setLeaveOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard unsaved changes?</AlertDialogTitle>
            <AlertDialogDescription>
              Changes to the school profile have not been saved. Leaving this
              page will discard them.
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

function serializeForm(
  form: HTMLFormElement,
  educationLevel: string | null,
  principalId: string | null
) {
  const controlledValues: Record<string, string> = {
    educationLevel: educationLevel ?? "",
    principalUserId: principalId ?? "",
  }
  const entries = [...new FormData(form).entries()].map(([name, value]) => [
    name,
    controlledValues[name] ?? value,
  ])
  for (const [name, value] of Object.entries(controlledValues)) {
    if (!entries.some(([entryName]) => entryName === name)) {
      entries.push([name, value])
    }
  }
  return JSON.stringify(entries)
}

function SectionHeading({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon
  title: string
  description: string
}) {
  return (
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
  )
}
