import { S3Client } from "bun";

import { env } from "./env";

function getS3Config() {
  const {
    AWS_ACCESS_KEY_ID,
    AWS_REGION,
    AWS_S3_BUCKET,
    AWS_S3_ENDPOINT,
    AWS_SECRET_ACCESS_KEY,
    FORCE_PATH_STYLE,
  } = env;

  if (
    !AWS_ACCESS_KEY_ID ||
    !AWS_SECRET_ACCESS_KEY ||
    !AWS_REGION ||
    !AWS_S3_ENDPOINT ||
    !AWS_S3_BUCKET
  ) {
    return null;
  }

  return {
    accessKeyId: AWS_ACCESS_KEY_ID,
    bucket: AWS_S3_BUCKET,
    endpoint: AWS_S3_ENDPOINT,
    region: AWS_REGION,
    secretAccessKey: AWS_SECRET_ACCESS_KEY,
    virtualHostedStyle: !FORCE_PATH_STYLE,
  };
}

const s3Config = getS3Config();

export const s3Client = s3Config ? new S3Client(s3Config) : null;
