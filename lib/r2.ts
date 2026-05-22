import { S3Client, GetObjectCommand, PutObjectCommand, type PutObjectCommandInput } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { assertR2Config } from "./env";

export function createR2Client(config = assertR2Config()) {
  return new S3Client({
    region: "auto",
    endpoint: config.endpoint,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  })
}

/**
 * Generates a signed URL for a file in Cloudflare R2.
 * @param key The file key (path) in the bucket.
 * @param expiresIn Time in seconds until the URL expires (default 1 hour).
 */
export async function getSignedR2Url(key: string, expiresIn: number = 3600) {
  let config;
  try {
    config = assertR2Config();
  } catch (error) {
    console.warn(error instanceof Error ? error.message : "R2 environment variables are not fully configured.");
    return null;
  }

  try {
    const command = new GetObjectCommand({
      Bucket: config.bucketName,
      Key: key,
    });

    const url = await getSignedUrl(createR2Client(config), command, { expiresIn });
    return url;
  } catch (error) {
    console.error("Error generating signed R2 URL:", error)
    return null
  }
}

/**
 * Generates a signed upload URL for Cloudflare R2.
 * @param key The file key (path) in the bucket.
 * @param contentType The MIME type of the file.
 * @param expiresIn Time in seconds until the URL expires.
 */
export async function getSignedUploadUrl(key: string, contentType: string, expiresIn: number = 3600) {
  let config;
  try {
    config = assertR2Config();
  } catch (error) {
    console.warn(error instanceof Error ? error.message : "R2 environment variables are not fully configured.")
    return null
  }

  try {
    const command = new PutObjectCommand({
      Bucket: config.bucketName,
      Key: key,
      ContentType: contentType,
    })

    const url = await getSignedUrl(createR2Client(config), command, { expiresIn })
    return url
  } catch (error) {
    console.error("Error generating signed upload R2 URL:", error)
    return null
  }
}

export async function uploadR2Object(key: string, body: PutObjectCommandInput["Body"], contentType: string) {
  let config;
  try {
    config = assertR2Config();
  } catch (error) {
    const message = error instanceof Error ? error.message : "R2 environment variables are not fully configured."
    console.warn(message)
    return { ok: false, error: message }
  }

  try {
    const command = new PutObjectCommand({
      Bucket: config.bucketName,
      Key: key,
      Body: body,
      ContentType: contentType,
    })

    await createR2Client(config).send(command)
    return { ok: true }
  } catch (error) {
    console.error("Error uploading object to R2:", error)
    const message = error instanceof Error ? error.message : "Failed to upload object to R2."
    return { ok: false, error: message }
  }
}
