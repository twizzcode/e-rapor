"use server"

import { randomUUID } from "node:crypto"

import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"

import { db } from "@/db"
import { schoolProfile } from "@/db/schema"
import { getSession } from "@/lib/session"
import { deleteR2Object, uploadR2Object } from "@/lib/r2"

export type SchoolAssetsFormState = { error?: string; success?: string }

const imageTypes: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
}

type AssetKey = "logoKey" | "foundationLogoKey" | "stampKey"

const assets: readonly {
  field: string
  key: AssetKey
  prefix: string
  label: string
}[] = [
  { field: "logo", key: "logoKey", prefix: "logo", label: "School logo" },
  {
    field: "foundationLogo",
    key: "foundationLogoKey",
    prefix: "foundation-logo",
    label: "Foundation logo",
  },
  { field: "stamp", key: "stampKey", prefix: "stamp", label: "School stamp" },
]

export async function saveSchoolAssets(
  _state: SchoolAssetsFormState,
  formData: FormData
): Promise<SchoolAssetsFormState> {
  const session = await getSession()
  if (!session || session.user.role !== "admin") {
    return { error: "Only an Admin Teacher can update school assets." }
  }

  const existing = await db.query.schoolProfile.findFirst({
    columns: {
      logoKey: true,
      foundationLogoKey: true,
      stampKey: true,
    },
    where: eq(schoolProfile.id, "main"),
  })
  if (!existing) {
    return { error: "Complete the School Profile before uploading assets." }
  }

  const files = assets.map((asset) => ({
    ...asset,
    file: formData.get(asset.field),
  }))
  const selectedFiles = files.filter(
    ({ file }) => file instanceof File && file.size > 0
  )
  if (selectedFiles.length === 0) return { error: "Choose an image to upload." }

  for (const { file, label } of selectedFiles) {
    if (!(file instanceof File)) continue
    if (!imageTypes[file.type]) {
      return { error: `${label} must be a JPG, PNG, or WebP image.` }
    }
    if (file.size > 2 * 1024 * 1024) {
      return { error: `${label} must be 2 MB or smaller.` }
    }
  }

  const updates: Partial<Record<AssetKey, string>> = {}
  const uploaded: { newKey: string; oldKey: string | null }[] = []

  for (const { file, key, prefix, label } of selectedFiles) {
    if (!(file instanceof File)) continue
    const newKey = `school/${prefix}-${randomUUID()}.${imageTypes[file.type]}`
    try {
      await uploadR2Object(
        newKey,
        new Uint8Array(await file.arrayBuffer()),
        file.type
      )
      updates[key] = newKey
      uploaded.push({ newKey, oldKey: existing[key] })
    } catch (error) {
      console.error(`Failed to upload ${label.toLowerCase()}`, error)
      await Promise.allSettled(
        uploaded.map((asset) => deleteR2Object(asset.newKey))
      )
      return { error: `Could not upload the ${label.toLowerCase()}.` }
    }
  }

  try {
    await db
      .update(schoolProfile)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(schoolProfile.id, "main"))
  } catch (error) {
    console.error("Failed to save school assets", error)
    await Promise.allSettled(
      uploaded.map((asset) => deleteR2Object(asset.newKey))
    )
    return { error: "Could not save school assets." }
  }

  await Promise.allSettled(
    uploaded
      .filter((asset) => asset.oldKey)
      .map((asset) => deleteR2Object(asset.oldKey!))
  )

  revalidatePath("/")
  revalidatePath("/school-assets")
  return { success: "School assets saved." }
}
