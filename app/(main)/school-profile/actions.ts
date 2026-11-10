"use server"

import { and, eq, isNull, or } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { headers } from "next/headers"

import { db } from "@/db"
import { schoolProfile, teacher, user } from "@/db/schema"
import { auth } from "@/lib/auth"

export type SchoolProfileFormState = {
  error?: string
  success?: string
}

const educationLevels = [
  "early-childhood",
  "elementary",
  "junior-high",
  "senior-high",
  "vocational",
  "special-school",
]

function optionalText(formData: FormData, name: string) {
  return String(formData.get(name) ?? "").trim() || null
}

export async function saveSchoolProfile(
  _state: SchoolProfileFormState,
  formData: FormData
): Promise<SchoolProfileFormState> {
  const session = await auth.api.getSession({ headers: await headers() })

  if (!session || session.user.role !== "admin") {
    return { error: "Only an admin can update the school profile." }
  }

  const name = String(formData.get("name") ?? "").trim()
  const educationLevel = String(formData.get("educationLevel") ?? "")
  const nss = optionalText(formData, "nss")
  const npsn = optionalText(formData, "npsn")
  const street = optionalText(formData, "street")
  const village = optionalText(formData, "village")
  const district = optionalText(formData, "district")
  const regency = optionalText(formData, "regency")
  const province = optionalText(formData, "province")
  const postalCode = optionalText(formData, "postalCode")
  const phoneFax = optionalText(formData, "phoneFax")
  const email = optionalText(formData, "email")
  const website = optionalText(formData, "website")
  const principalUserId = optionalText(formData, "principalUserId")

  if (!name) return { error: "School name is required." }
  if (!educationLevels.includes(educationLevel)) {
    return { error: "Select a valid education level." }
  }
  if (name.length > 200) return { error: "School name is too long." }

  const boundedValues = [nss, npsn, postalCode, phoneFax, email, website]
  if (boundedValues.some((value) => (value?.length ?? 0) > 200)) {
    return { error: "One or more fields exceed the character limit." }
  }
  if (
    [street, village, district, regency, province].some(
      (value) => (value?.length ?? 0) > 250
    )
  ) {
    return { error: "One or more address fields exceed the character limit." }
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "Enter a valid email address." }
  }
  if (website) {
    try {
      const url = new URL(website)
      if (url.protocol !== "http:" && url.protocol !== "https:") throw null
    } catch {
      return { error: "Website must be a valid HTTP or HTTPS URL." }
    }
  }

  if (principalUserId) {
    const [principal] = await db
      .select({ id: user.id })
      .from(user)
      .leftJoin(teacher, eq(user.id, teacher.userId))
      .where(
        and(
          eq(user.id, principalUserId),
          or(eq(user.role, "teacher"), eq(user.role, "admin")),
          or(eq(teacher.active, true), isNull(teacher.active))
        )
      )
      .limit(1)

    if (!principal) return { error: "Select a valid active teacher." }
  }

  try {
    await db
      .insert(schoolProfile)
      .values({
        id: "main",
        name,
        educationLevel,
        nss,
        npsn,
        street,
        village,
        district,
        regency,
        province,
        postalCode,
        phoneFax,
        email,
        website,
        principalUserId,
      })
      .onConflictDoUpdate({
        target: schoolProfile.id,
        set: {
          name,
          educationLevel,
          nss,
          npsn,
          street,
          village,
          district,
          regency,
          province,
          postalCode,
          phoneFax,
          email,
          website,
          principalUserId,
          updatedAt: new Date(),
        },
      })
  } catch (error) {
    console.error("Failed to save school profile", error)
    return { error: "Could not save the school profile." }
  }

  revalidatePath("/")
  revalidatePath("/school-profile")
  return { success: "School profile saved." }
}
