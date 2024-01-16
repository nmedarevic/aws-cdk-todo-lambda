import * as cdk from "aws-cdk-lib";
import {NodejsFunction} from "aws-cdk-lib/aws-lambda-nodejs";
import * as s3 from "aws-cdk-lib/aws-s3"
import * as iam from "aws-cdk-lib/aws-iam"
import * as lambda from "aws-cdk-lib/aws-lambda"
import * as lambdaEventSource from "aws-cdk-lib/aws-lambda-event-sources"
import * as dynamoDB from "aws-cdk-lib/aws-dynamodb"
import { Construct } from "constructs";
import path = require("path");

const imageBucket = "nikola-aws-tutorial-cdk-image-bucket"

export class CdkTypescriptStack extends cdk.Stack {
  constructor(scope?: Construct, id?: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const bucket = new s3.Bucket(this, imageBucket, {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      bucketName: imageBucket,
    })
    new cdk.CfnOutput(this, "Bucket", { value: bucket.bucketName })

    /**
     * Role for AWS Lambda
     */
    const role = new iam.Role(this, "cdk-nikola-lambda-role", {
      assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
      roleName: "cdk-lambda-role",
    })

    role.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          "rekognition:*",
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
        ],
        resources: ["*"],
      })
    )

    /**
     * DynamoDB table for storing image labels
     */

    const table = new dynamoDB.Table(this, "cdk-nikola-imagetable", {
      partitionKey: { name: "image", type: dynamoDB.AttributeType.STRING },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      tableName: "cdk-table-labels",
    })
    new cdk.CfnOutput(this, "Table", { value: table.tableName })


    /**
     * Lambda function
     */

    const lambdaFunction = new NodejsFunction(this, "cdk-nikola-function", {
      // code: lambda.AssetCode.fromAsset("lambda"),
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: path.join(__dirname, "../lambda/image-lambda.ts"),
      functionName: "s3-image-lambel-recognition-fn",
      handler: "handler",
      role: role,
      environment: {
        TABLE: table.tableName,
        BUCKET: bucket.bucketName,
      }
    })

    lambdaFunction.addEventSource(
      new lambdaEventSource.S3EventSource(
        bucket,
        {
          events: [s3.EventType.OBJECT_CREATED],
        }
      )
    )

    bucket.grantReadWrite(lambdaFunction)
    table.grantFullAccess(lambdaFunction)
  }
}
