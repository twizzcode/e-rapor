"use server"

import { randomUUID } from "node:crypto"

import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { headers } from "next/headers"

import { db } from "@/db"
import { teacher, user } from "@/db/schema"
import { auth } from "@/lib/auth"
import { deleteR2Object, uploadR2Object } from "@/lib/r2"

export type ProfileFormState = { error?: string; success?: string }

const genders = ["male", "female"]
const ptkTypes = ["teacher", "principal"]
const imageTypes: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
}

export async function saveProfile(
  _state: ProfileFormState,
  formData: FormData
): Promise<ProfileFormState> {
  const session = await auth.api.getSession({ headers: await headers() })

  if (
    !session ||
    (session.user.role !== "teacher" && session.user.role !== "admin")
  ) {
    return { error: "Tidak memiliki akses." }
  }

  const name = String(formData.get("name") ?? "").trim()
  const nip = String(formData.get("nip") ?? "").trim() || null
  const nuptk = String(formData.get("nuptk") ?? "").trim() || null
  const gender = String(formData.get("gender") ?? "")
  const ptkType = String(formData.get("ptkType") ?? "")
  const birthDate = String(formData.get("birthDate") ?? "") || null
  const phone = String(formData.get("phone") ?? "").trim() || null
  const address = String(formData.get("address") ?? "").trim() || null
  const village = String(formData.get("village") ?? "").trim() || null
  const district = String(formData.get("district") ?? "").trim() || null
  const regency = String(formData.get("regency") ?? "").trim() || null
  const province = String(formData.get("province") ?? "").trim() || null
  const postalCode = String(formData.get("postalCode") ?? "").trim() || null
  const signature = formData.get("signature")

  if (!name) return { error: "Nama wajib diisi." }
  if (
    name.length > 200 ||
    (nip?.length ?? 0) > 50 ||
    (nuptk?.length ?? 0) > 50 ||
    (phone?.length ?? 0) > 30 ||
    [address, village, district, regency, province].some(
      (value) => (value?.length ?? 0) > 250
    ) ||
    (postalCode?.length ?? 0) > 10
  ) {
    return { error: "Data melebihi batas karakter." }
  }
  if (gender && !genders.includes(gender)) {
    return { error: "Jenis kelamin tidak valid." }
  }
  if (ptkType && !ptkTypes.includes(ptkType)) {
    return { error: "Jenis PTK tidak valid." }
  }
  if (
    birthDate &&
    (!/^\d{4}-\d{2}-\d{2}$/.test(birthDate) ||
      Number.isNaN(new Date(`${birthDate}T00:00:00Z`).getTime()))
  ) {
    return { error: "Tanggal lahir tidak valid." }
  }

  if (signature instanceof File && signature.size > 0) {
    if (!imageTypes[signature.type]) {
      return { error: "Tanda tangan harus berupa gambar JPG, PNG, atau WebP." }
    }
    if (signature.size > 2 * 1024 * 1024) {
      return { error: "Ukuran tanda tangan maksimal 2 MB." }
    }
  }

  const existing = await db.query.teacher.findFirst({
    columns: { signatureKey: true },
    where: eq(teacher.userId, session.user.id),
  })
  let signatureKey = existing?.signatureKey ?? null
  let uploadedSignatureKey: string | null = null

  if (signature instanceof File && signature.size > 0) {
    uploadedSignatureKey = `teachers/${session.user.id}/signature-${randomUUID()}.${imageTypes[signature.type]}`
    try {
      await uploadR2Object(
        uploadedSignatureKey,
        new Uint8Array(await signature.arrayBuffer()),
        signature.type
      )
      signatureKey = uploadedSignatureKey
    } catch (error) {
      console.error("Failed to upload teacher signature", error)
      return { error: "Tanda tangan gagal diunggah." }
    }
  }

  try {
    await db.batch([
      db.update(user).set({ name }).where(eq(user.id, session.user.id)),
      db
        .insert(teacher)
        .values({
          userId: session.user.id,
          nip,
          nuptk,
          gender: gender || null,
          ptkType: ptkType || null,
          birthDate,
          phone,
          address,
          village,
          district,
          regency,
          province,
          postalCode,
          signatureKey,
        })
        .onConflictDoUpdate({
          target: teacher.userId,
          set: {
            nip,
            nuptk,
            gender: gender || null,
            ptkType: ptkType || null,
            birthDate,
            phone,
            address,
            village,
            district,
            regency,
            province,
            postalCode,
            signatureKey,
            updatedAt: new Date(),
          },
        }),
    ])
  } catch (error) {
    console.error("Failed to save teacher profile", error)
    if (uploadedSignatureKey) {
      await deleteR2Object(uploadedSignatureKey).catch(console.error)
    }
    return { error: "NIP atau NUPTK sudah digunakan akun lain." }
  }

  if (uploadedSignatureKey && existing?.signatureKey) {
    await deleteR2Object(existing.signatureKey).catch((error) =>
      console.error("Failed to delete previous teacher signature", error)
    )
  }

  revalidatePath("/profile")
  revalidatePath("/teachers")
  return { success: "Profil berhasil disimpan." }
}
