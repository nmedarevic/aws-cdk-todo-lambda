import { S3Event } from 'aws-lambda'
import { Rekognition, DynamoDB } from 'aws-sdk'

const rekognition = new Rekognition()

// const db = new DynamoDB()
const dbClient = new DynamoDB.DocumentClient()

const minConfidence = 60

export async function handler(event: S3Event, context: any) {
  for (let record of event.Records) {
    const bucket = record.s3.bucket.name
    const key = record.s3.object.key

    console.log('\n\n', 'Event:', bucket, key, context, '\n\n')

    const labels = await recognitionFunction(bucket, key)

    console.log('\n\n', 'LABELS', labels, '\n\n')

    const imageLabelsTable = process.env.TABLE || ''

    await dbClient
      .put({
        TableName: imageLabelsTable,
        Item: {
          image: key,
          labels: labels,
        },
      } as DynamoDB.Types.PutItemInput)
      .promise()
  }
}

async function recognitionFunction(bucket: string, key: string) {
  console.log(`Detected image in bucket: ${bucket} Key: ${key}`)

  const { Labels } = await rekognition
    .detectLabels({
      Image: {
        S3Object: {
          Bucket: bucket,
          Name: key,
        },
      },
      MinConfidence: minConfidence,
    })
    .promise()

  return Labels
}
