const { S3Client, PutBucketLifecycleConfigurationCommand } = require("@aws-sdk/client-s3");

const s3 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

const BUCKET = process.argv[2] || process.env.R2_BUCKET_NAME;

async function applyLifecycle() {
  console.log(`Applying lifecycle rule to: ${BUCKET}`);

  const params = {
    Bucket: BUCKET,
    LifecycleConfiguration: {
      Rules: [
        {
          ID: "AbortIncompleteMultipartUploads",
          Status: "Enabled",
          Filter: { Prefix: "" },
          AbortIncompleteMultipartUpload: {
            DaysAfterInitiation: 1,
          },
        },
      ],
    },
  };

  try {
    await s3.send(new PutBucketLifecycleConfigurationCommand(params));
    console.log("Success: Lifecycle rule applied. Incomplete multipart uploads will now be automatically aborted after 1 day.");
  } catch (err) {
    console.error("Failed to apply lifecycle rule:", err);
  }
}

applyLifecycle();
