"use client"

import { useActionState, useEffect } from "react"
import { toast } from "sonner"

import { saveProfile } from "@/app/(main)/profile/actions"
import { ImageUploadField } from "@/components/image-upload-field"
import { SchoolAddressFields } from "@/components/school-address-fields"
import { Button } from "@/components/ui/button"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type Profile = {
  name: string
  email: string
  nip: string
  nuptk: string
  gender: string
  ptkType: string
  birthDate: string
  phone: string
  address: string
  village: string
  district: string
  regency: string
  province: string
  postalCode: string
}

export function ProfileForm({
  profile,
  signatureUrl,
}: {
  profile: Profile
  signatureUrl: string | null
}) {
  const [state, action, pending] = useActionState(saveProfile, {})

  useEffect(() => {
    if (state.error) toast.error(state.error)
    if (state.success) toast.success(state.success)
  }, [state])

  return (
    <form action={action}>
      <FieldGroup className="grid gap-5 sm:grid-cols-2">
        <Field>
          <FieldLabel htmlFor="name">Nama lengkap</FieldLabel>
          <Input
            id="name"
            name="name"
            defaultValue={profile.name}
            maxLength={200}
            required
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input id="email" value={profile.email} disabled />
          <p className="text-xs text-muted-foreground">
            Email mengikuti akun login dan tidak dapat diubah.
          </p>
        </Field>
        <Field>
          <FieldLabel htmlFor="nip">NIP</FieldLabel>
          <Input
            id="nip"
            name="nip"
            defaultValue={profile.nip}
            maxLength={50}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="nuptk">NUPTK</FieldLabel>
          <Input
            id="nuptk"
            name="nuptk"
            defaultValue={profile.nuptk}
            maxLength={50}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="gender">Jenis kelamin</FieldLabel>
          <Select name="gender" defaultValue={profile.gender || null}>
            <SelectTrigger id="gender" className="w-full">
              <SelectValue placeholder="Pilih jenis kelamin" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="male">Laki-laki</SelectItem>
              <SelectItem value="female">Perempuan</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field>
          <FieldLabel htmlFor="ptkType">Jenis PTK</FieldLabel>
          <Select name="ptkType" defaultValue={profile.ptkType || null}>
            <SelectTrigger id="ptkType" className="w-full">
              <SelectValue placeholder="Pilih jenis PTK" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="teacher">Guru</SelectItem>
              <SelectItem value="principal">Kepala Sekolah</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field>
          <FieldLabel htmlFor="birthDate">Tanggal lahir</FieldLabel>
          <Input
            id="birthDate"
            name="birthDate"
            type="date"
            defaultValue={profile.birthDate}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="phone">Nomor telepon</FieldLabel>
          <Input
            id="phone"
            name="phone"
            type="tel"
            defaultValue={profile.phone}
            maxLength={30}
          />
        </Field>
        <Field className="sm:col-span-2">
          <FieldLabel htmlFor="address">Street</FieldLabel>
          <Input
            id="address"
            name="address"
            defaultValue={profile.address}
            maxLength={250}
          />
        </Field>
        <SchoolAddressFields
          initialProvince={profile.province}
          initialRegency={profile.regency}
          initialDistrict={profile.district}
          initialVillage={profile.village}
          initialPostalCode={profile.postalCode}
        />
        <Field className="sm:col-span-2">
          <FieldLabel>Signature</FieldLabel>
          <ImageUploadField
            id="signature"
            name="signature"
            label="Signature"
            description="Upload a transparent PNG, JPG, or WebP image up to 2 MB. Existing signature remains unchanged when no file is selected."
            imageUrl={signatureUrl}
            className="h-32 w-56"
          />
        </Field>
        <Field className="sm:col-span-2">
          <Button type="submit" disabled={pending}>
            {pending ? "Menyimpan..." : "Simpan profil"}
          </Button>
        </Field>
      </FieldGroup>
    </form>
  )
}
