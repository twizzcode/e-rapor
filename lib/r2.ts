import "server-only"

import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"

function requireEnv(name: string) {
  const value = process.env[name]

  if (!value) throw new Error(`${name} is required for Cloudflare R2`)

  return value
}

let client: S3Client | undefined

export function getR2Client() {
  if (!client) {
    client = new S3Client({
      region: "auto",
      endpoint: `https://${requireEnv("R2_ACCOUNT_ID")}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: requireEnv("R2_ACCESS_KEY_ID"),
        secretAccessKey: requireEnv("R2_SECRET_ACCESS_KEY"),
      },
    })
  }

  return client
}

export function getR2BucketName() {
  return requireEnv("R2_BUCKET_NAME")
}

export async function uploadR2Object(
  key: string,
  body: Uint8Array | Buffer | string,
  contentType: string
) {
  await getR2Client().send(
    new PutObjectCommand({
      Bucket: getR2BucketName(),
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  )

  const publicUrl = process.env.R2_PUBLIC_URL?.replace(/\/$/, "")

  return publicUrl ? `${publicUrl}/${key}` : key
}

export async function deleteR2Object(key: string) {
  await getR2Client().send(
    new DeleteObjectCommand({ Bucket: getR2BucketName(), Key: key })
  )
}

export function createR2UploadUrl(
  key: string,
  contentType: string,
  expiresIn = 300
) {
  return getSignedUrl(
    getR2Client(),
    new PutObjectCommand({
      Bucket: getR2BucketName(),
      Key: key,
      ContentType: contentType,
    }),
    { expiresIn }
  )
}

export function createR2DownloadUrl(key: string, expiresIn = 300) {
  return getSignedUrl(
    getR2Client(),
    new GetObjectCommand({ Bucket: getR2BucketName(), Key: key }),
    { expiresIn }
  )
}

export async function createR2DataUrl(key: string) {
  const url = await createR2DownloadUrl(key, 300)
  const response = await fetch(url)
  if (!response.ok) return null

  const contentType =
    response.headers.get("content-type") ?? guessContentType(key)
  const bytes = Buffer.from(await response.arrayBuffer())

  return `data:${contentType};base64,${bytes.toString("base64")}`
}

function guessContentType(key: string) {
  const extension = key.split(".").pop()?.toLowerCase()

  switch (extension) {
    case "png":
      return "image/png"
    case "jpg":
    case "jpeg":
      return "image/jpeg"
    case "webp":
      return "image/webp"
    case "svg":
      return "image/svg+xml"
    default:
      return "application/octet-stream"
  }
}
