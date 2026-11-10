"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import type { LucideIcon } from "lucide-react"
import {
  CalendarIcon,
  ContactIcon,
  GraduationCapIcon,
  HouseIcon,
  IdCardIcon,
  UsersIcon,
} from "lucide-react"
import { toast } from "sonner"

import { saveStudent } from "@/app/(main)/students/actions"
import { SchoolAddressFields } from "@/components/school-address-fields"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

export type StudentFormData = {
  id: string
  name: string
  nisn: string
  nis: string
  admissionDate: string
  birthPlace: string
  birthDate: string
  gender: string
  religion: string
  street: string
  village: string
  district: string
  regency: string
  province: string
  postalCode: string
  familyStatus: string
  childOrder: string
  previousSchool: string
  admittedClass: string
  guardianName: string
  studentPhone: string
}

export function StudentForm({ student }: { student?: StudentFormData }) {
  const router = useRouter()
  const formRef = React.useRef<HTMLFormElement>(null)
  const initialValues = React.useRef("")
  const [state, action, pending] = React.useActionState(saveStudent, {})
  const [dirty, setDirty] = React.useState(false)

  React.useEffect(() => {
    const form = formRef.current
    if (form) initialValues.current = serializeForm(form)
  }, [])

  React.useEffect(() => {
    if (state.error) toast.error(state.error)
    if (state.success && state.studentId) {
      toast.success(state.success)
      router.push(`/students/${state.studentId}`)
    }
  }, [router, state])

  function updateDirty() {
    const form = formRef.current
    if (form) setDirty(serializeForm(form) !== initialValues.current)
  }

  function updateControlledField() {
    requestAnimationFrame(updateDirty)
  }

  return (
    <form
      ref={formRef}
      action={action}
      onChange={updateDirty}
      className="space-y-6"
    >
      {student?.id && <input type="hidden" name="id" value={student.id} />}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            {student ? "Edit Student" : "Add Student"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {student
              ? `Update ${student.name}'s student record.`
              : "Add student identity, address, family, enrollment, and contact data."}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={pending}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={pending || !dirty}>
            {pending ? "Saving..." : "Save student"}
          </Button>
        </div>
      </div>

      <FormCard
        icon={IdCardIcon}
        title="Student Identity"
        description="Official identity and personal information."
      >
        <FieldGroup className="grid gap-5 sm:grid-cols-2">
          <TextField
            id="name"
            label="Student name"
            value={student?.name}
            required
            className="sm:col-span-2"
          />
          <TextField
            id="nisn"
            label="NISN"
            value={student?.nisn}
            inputMode="numeric"
            maxLength={20}
          />
          <TextField
            id="nis"
            label="NIS"
            value={student?.nis}
            required
            inputMode="numeric"
            maxLength={30}
          />
          <DateField
            id="admissionDate"
            label="Admission date"
            value={student?.admissionDate}
            onChange={updateControlledField}
          />
          <TextField
            id="birthPlace"
            label="Birth place"
            value={student?.birthPlace}
          />
          <DateField
            id="birthDate"
            label="Birth date"
            value={student?.birthDate}
            defaultMonth={new Date(new Date().getFullYear() - 10, 0)}
            onChange={updateControlledField}
          />
          <SelectField
            id="gender"
            label="Gender"
            value={student?.gender}
            placeholder="Select gender"
            options={[
              ["male", "Male"],
              ["female", "Female"],
            ]}
            onChange={updateControlledField}
          />
          <SelectField
            id="religion"
            label="Religion"
            value={student?.religion}
            placeholder="Select religion"
            options={[
              ["islam", "Islam"],
              ["christian", "Christian"],
              ["catholic", "Catholic"],
              ["hindu", "Hindu"],
              ["buddhist", "Buddhist"],
              ["confucian", "Confucian"],
              ["other", "Other"],
            ]}
            onChange={updateControlledField}
          />
        </FieldGroup>
      </FormCard>

      <FormCard
        icon={HouseIcon}
        title="Student Address"
        description="Student residential address."
      >
        <FieldGroup className="grid gap-5 sm:grid-cols-2">
          <TextField
            id="street"
            label="Street"
            value={student?.street}
            className="sm:col-span-2"
            maxLength={250}
          />
          <SchoolAddressFields
            initialProvince={student?.province ?? ""}
            initialRegency={student?.regency ?? ""}
            initialDistrict={student?.district ?? ""}
            initialVillage={student?.village ?? ""}
            initialPostalCode={student?.postalCode ?? ""}
            onChange={updateControlledField}
          />
        </FieldGroup>
      </FormCard>

      <FormCard
        icon={UsersIcon}
        title="Family Information"
        description="Student position and status in family."
      >
        <FieldGroup className="grid gap-5 sm:grid-cols-2">
          <SelectField
            id="familyStatus"
            label="Family status"
            value={student?.familyStatus}
            placeholder="Select family status"
            options={[
              ["biological-child", "Biological child"],
              ["adopted-child", "Adopted child"],
            ]}
            onChange={updateControlledField}
          />
          <TextField
            id="childOrder"
            label="Child order"
            value={student?.childOrder}
            type="number"
            min={1}
            max={50}
          />
        </FieldGroup>
      </FormCard>

      <FormCard
        icon={GraduationCapIcon}
        title="Enrollment"
        description="Previous school and admission details."
      >
        <FieldGroup className="grid gap-5 sm:grid-cols-2">
          <TextField
            id="previousSchool"
            label="Previous school"
            value={student?.previousSchool}
          />
          <TextField
            id="admittedClass"
            label="Admitted to class"
            value={student?.admittedClass}
          />
        </FieldGroup>
      </FormCard>

      <FormCard
        icon={ContactIcon}
        title="Contact"
        description="Guardian and student contact details."
      >
        <FieldGroup className="grid gap-5 sm:grid-cols-2">
          <TextField
            id="guardianName"
            label="Guardian name"
            value={student?.guardianName}
          />
          <TextField
            id="studentPhone"
            label="Student phone number"
            value={student?.studentPhone}
            type="tel"
            maxLength={30}
          />
        </FieldGroup>
      </FormCard>
    </form>
  )
}

function FormCard({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: LucideIcon
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

function TextField({
  id,
  label,
  value = "",
  className,
  ...props
}: {
  id: string
  label: string
  value?: string
  className?: string
} & Omit<React.ComponentProps<typeof Input>, "id" | "name" | "defaultValue">) {
  return (
    <Field className={className}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Input
        id={id}
        name={id}
        defaultValue={value}
        maxLength={200}
        {...props}
      />
    </Field>
  )
}

function SelectField({
  id,
  label,
  value,
  placeholder,
  options,
  onChange,
}: {
  id: string
  label: string
  value?: string
  placeholder: string
  options: [string, string][]
  onChange?: () => void
}) {
  return (
    <Field>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Select name={id} defaultValue={value || null} onValueChange={onChange}>
        <SelectTrigger id={id} className="w-full">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map(([optionValue, optionLabel]) => (
            <SelectItem key={optionValue} value={optionValue}>
              {optionLabel}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  )
}

function DateField({
  id,
  label,
  value,
  required,
  defaultMonth,
  onChange,
}: {
  id: string
  label: string
  value?: string
  required?: boolean
  defaultMonth?: Date
  onChange?: () => void
}) {
  const initialDate = parseDate(value)
  const [date, setDate] = React.useState<Date | undefined>(initialDate)
  const [open, setOpen] = React.useState(false)
  const today = new Date()

  return (
    <Field>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <input type="hidden" name={id} value={date ? toDateValue(date) : ""} />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <Button
              id={id}
              type="button"
              variant="outline"
              aria-required={required}
              className={cn(
                "w-full justify-between font-normal",
                !date && "text-muted-foreground"
              )}
            />
          }
        >
          {date ? formatDisplayDate(date) : "Select date"}
          <CalendarIcon />
        </PopoverTrigger>
        <PopoverContent align="start" className="w-auto p-0">
          <Calendar
            mode="single"
            selected={date}
            defaultMonth={date ?? defaultMonth ?? today}
            onSelect={(selectedDate) => {
              setDate(selectedDate)
              onChange?.()
              if (selectedDate) setOpen(false)
            }}
            captionLayout="dropdown"
            startMonth={new Date(1900, 0)}
            endMonth={today}
            disabled={{ after: today }}
          />
        </PopoverContent>
      </Popover>
    </Field>
  )
}

function serializeForm(form: HTMLFormElement) {
  return JSON.stringify([...new FormData(form).entries()])
}

function parseDate(value?: string) {
  if (!value) return undefined

  const [year, month, day] = value.split("-").map(Number)
  if (!year || !month || !day) return undefined

  const date = new Date(year, month - 1, day)
  return Number.isNaN(date.getTime()) ? undefined : date
}

function toDateValue(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function formatDisplayDate(date: Date) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "long",
  }).format(date)
}
