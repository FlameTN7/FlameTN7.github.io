import { S3Client, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3'
import crypto from 'node:crypto'

let _client: S3Client | null = null

function client(): S3Client {
  if (_client) return _client
  const { R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY } = process.env
  if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
    throw new Error('R2 credentials not configured (set R2_ACCOUNT_ID/R2_ACCESS_KEY_ID/R2_SECRET_ACCESS_KEY in editor-server/.env)')
  }
  _client = new S3Client({
    region: 'auto',
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: R2_ACCESS_KEY_ID,
      secretAccessKey: R2_SECRET_ACCESS_KEY,
    },
  })
  return _client
}

function bucket(): string {
  const b = process.env.R2_BUCKET
  if (!b) throw new Error('R2_BUCKET is not set')
  return b
}

export function publicBase(): string {
  const b = process.env.R2_PUBLIC_BASE
  if (!b) throw new Error('R2_PUBLIC_BASE is not set')
  return b.replace(/\/$/, '')
}

export function buildObjectKey(buffer: Buffer, ext: string): string {
  const hash = crypto.createHash('sha256').update(buffer).digest('hex')
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  const safeExt = ext.startsWith('.') ? ext : '.' + ext
  return `${y}/${m}/${d}/${hash}${safeExt}`
}

export async function objectExists(key: string): Promise<boolean> {
  try {
    await client().send(new HeadObjectCommand({ Bucket: bucket(), Key: key }))
    return true
  } catch (err) {
    const e = err as { $metadata?: { httpStatusCode?: number }; name?: string }
    if (e.$metadata?.httpStatusCode === 404 || e.name === 'NotFound') return false
    throw err
  }
}

export async function putObject(
  key: string,
  body: Buffer,
  contentType: string,
): Promise<void> {
  await client().send(
    new PutObjectCommand({
      Bucket: bucket(),
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  )
}

export function publicUrl(key: string): string {
  return `${publicBase()}/${key}`
}
