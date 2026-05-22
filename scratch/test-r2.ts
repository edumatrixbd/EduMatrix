import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";

async function testR2() {
  const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
  const R2_ENDPOINT = process.env.R2_ENDPOINT;
  const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
  const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
  const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME;

  console.log("Checking Environment Variables:");
  console.log("R2_ACCOUNT_ID:", R2_ACCOUNT_ID ? "✅ Set" : "❌ Missing");
  console.log("R2_ENDPOINT:", R2_ENDPOINT ? "✅ Set" : "❌ Missing");
  console.log("R2_ACCESS_KEY_ID:", R2_ACCESS_KEY_ID ? "✅ Set" : "❌ Missing");
  console.log("R2_SECRET_ACCESS_KEY:", R2_SECRET_ACCESS_KEY ? "✅ Set" : "❌ Missing");
  console.log("R2_BUCKET_NAME:", R2_BUCKET_NAME ? "✅ Set" : "❌ Missing");

  if (!R2_ACCOUNT_ID || !R2_ENDPOINT || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET_NAME) {
    console.error("Missing R2 configuration.");
    return;
  }

  const s3Client = new S3Client({
    region: "auto",
    endpoint: R2_ENDPOINT,
    credentials: {
      accessKeyId: R2_ACCESS_KEY_ID,
      secretAccessKey: R2_SECRET_ACCESS_KEY,
    },
  });

  try {
    console.log("\nAttempting to list objects in bucket:", R2_BUCKET_NAME);
    const command = new ListObjectsV2Command({ Bucket: R2_BUCKET_NAME, MaxKeys: 1 });
    await s3Client.send(command);
    console.log("R2 Connection Status: ✅ SUCCESS");
  } catch (error) {
    console.error("R2 Connection Status: ❌ FAILED");
    console.error("Error Detail:", error);
  }
}

testR2();
