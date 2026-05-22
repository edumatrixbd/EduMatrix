const { S3Client, ListObjectsV2Command, ListMultipartUploadsCommand, AbortMultipartUploadCommand, DeleteObjectsCommand } = require("@aws-sdk/client-s3");

const s3 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

const BUCKET = process.argv[2] || process.env.R2_BUCKET_NAME;

if (!BUCKET) {
  console.error("Please provide a bucket name as an argument: node scripts/r2_cleanup.js <bucket-name>");
  process.exit(1);
}

async function cleanup() {
  console.log(`Checking bucket: ${BUCKET}`);

  try {
    // 1. List objects
    const listObjects = await s3.send(new ListObjectsV2Command({ Bucket: BUCKET }));
    const objects = listObjects.Contents || [];
    console.log(`Found ${objects.length} visible objects.`);
    
    if (objects.length > 0) {
      console.log("Deleting visible objects...");
      await s3.send(new DeleteObjectsCommand({
        Bucket: BUCKET,
        Delete: { Objects: objects.map(o => ({ Key: o.Key })) }
      }));
      console.log("Visible objects deleted.");
    }

    // 2. List and Abort Multipart Uploads (Hidden space consumers)
    const listMultiparts = await s3.send(new ListMultipartUploadsCommand({ Bucket: BUCKET }));
    const uploads = listMultiparts.Uploads || [];
    console.log(`Found ${uploads.length} incomplete multipart uploads.`);

    for (const upload of uploads) {
      console.log(`Aborting multipart upload: ${upload.Key} (ID: ${upload.UploadId})`);
      await s3.send(new AbortMultipartUploadCommand({
        Bucket: BUCKET,
        Key: upload.Key,
        UploadId: upload.UploadId
      }));
    }

    if (uploads.length > 0) {
      console.log("All incomplete multipart uploads aborted. Space should be reclaimed shortly.");
    } else {
      console.log("No incomplete multipart uploads found.");
    }

    console.log("\nNote: Cloudflare R2 usage metrics can take up to 24-48 hours to update in the dashboard.");
    console.log("If visible objects and multipart uploads are 0, your bucket is effectively empty.");

  } catch (err) {
    console.error("Cleanup failed:", err);
  }
}

cleanup();
