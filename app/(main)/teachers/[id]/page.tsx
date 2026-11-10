import Image from "next/image"
import { eq } from "drizzle-orm"
import { notFound } from "next/navigation"
import type { Metadata } from "next"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { db } from "@/db"
import { teacher, user } from "@/db/schema"
import { createR2DownloadUrl } from "@/lib/r2"

export const metadata: Metadata = {
  title: "Teacher Details",
  description: "View teacher account and profile details.",
}

export default async function TeacherDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [row] = await db
    .select({
      name: user.name,
      email: user.email,
      role: user.role,
      nip: teacher.nip,
      nuptk: teacher.nuptk,
      gender: teacher.gender,
      ptkType: teacher.ptkType,
      birthDate: teacher.birthDate,
      phone: teacher.phone,
      address: teacher.address,
      village: teacher.village,
      district: teacher.district,
      regency: teacher.regency,
      province: teacher.province,
      postalCode: teacher.postalCode,
      signatureKey: teacher.signatureKey,
      active: teacher.active,
    })
    .from(teacher)
    .innerJoin(user, eq(user.id, teacher.userId))
    .where(eq(teacher.userId, id))
    .limit(1)

  if (!row) notFound()

  const signatureUrl = row.signatureKey
    ? await createR2DownloadUrl(row.signatureKey, 3600)
    : null

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          {row.name}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Teacher account and profile details.
        </p>
      </div>

      <Card>
        <CardHeader className="border-b">
          <CardTitle>Teacher Details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
          <Detail label="Full Name" value={row.name} />
          <Detail label="Email" value={row.email} />
          <Detail label="Status" value={row.active ? "Active" : "Inactive"} />
          <Detail
            label="Role"
            value={row.role === "admin" ? "Admin Teacher" : "Teacher"}
          />
          <Detail label="NIP" value={row.nip} />
          <Detail label="NUPTK" value={row.nuptk} />
          <Detail label="Gender" value={formatValue(row.gender)} />
          <Detail label="PTK Type" value={formatValue(row.ptkType)} />
          <Detail label="Birth Date" value={row.birthDate} />
          <Detail label="Phone" value={row.phone} />
          <Detail
            label="Address"
            value={[
              row.address,
              row.village,
              row.district,
              row.regency,
              row.province,
              row.postalCode,
            ]
              .filter(Boolean)
              .join(", ")}
            className="sm:col-span-2"
          />
          <div className="sm:col-span-2 lg:col-span-3">
            <dt className="text-xs text-muted-foreground">Signature</dt>
            <dd className="mt-2 flex h-32 w-56 items-center justify-center border bg-muted">
              {signatureUrl ? (
                <Image
                  src={signatureUrl}
                  alt={`${row.name} signature`}
                  width={224}
                  height={128}
                  className="h-full w-full object-contain"
                  unoptimized
                />
              ) : (
                <span className="text-xs text-muted-foreground">—</span>
              )}
            </dd>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function formatValue(value: string | null) {
  if (!value) return null
  return value
    .split("-")
    .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
    .join(" ")
}

function Detail({
  label,
  value,
  className,
}: {
  label: string
  value?: string | null
  className?: string
}) {
  return (
    <div className={className}>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-sm whitespace-pre-wrap">{value || "—"}</dd>
    </div>
  )
}
