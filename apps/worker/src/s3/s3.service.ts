import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

export class S3Service {
  private client = new S3Client({
    region: process.env.AWS_REGION,
  });

  async uploadJson(
    bucket: string,
    key: string,
    payload: object,
  ): Promise<string> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: JSON.stringify(payload),
        ContentType: 'application/json',
      }),
    );

    return `s3://${bucket}/${key}`;
  }
}
