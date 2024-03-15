import * as cdk from "aws-cdk-lib";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import * as s3 from "aws-cdk-lib/aws-s3"
import * as ssm from 'aws-cdk-lib/aws-ssm';
import * as iam from "aws-cdk-lib/aws-iam"
import * as lambda from "aws-cdk-lib/aws-lambda"
import * as lambdaEventSource from "aws-cdk-lib/aws-lambda-event-sources"
import * as dynamoDB from "aws-cdk-lib/aws-dynamodb"
import { Construct } from "constructs";
import path = require("path");
import { LogGroup, RetentionDays } from "aws-cdk-lib/aws-logs";
import { CorsHttpMethod, HttpApi } from "aws-cdk-lib/aws-apigatewayv2";
import { HttpLambdaIntegration } from "aws-cdk-lib/aws-apigatewayv2-integrations";
import { HttpMethod } from "aws-cdk-lib/aws-events";

// const lambdaParameterStoreLayer = "arn:aws:lambda:eu-central-1:187925254637:layer:AWS-Parameters-and-Secrets-Lambda-Extension:11"

export class BackendStack extends cdk.Stack {
  constructor(scope?: Construct, id?: string, props?: cdk.StackProps) {
    super(scope, id, props);

    /**
     * Role for AWS Lambda
     */
    const role = new iam.Role(this, "lambda-role-write", {
      assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
      roleName: "lambda-role-write",
    })

    role.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
        ],
        resources: ["*"],
      })
    )

    // role.addToPolicy(
    //   new iam.PolicyStatement({
    //     effect: iam.Effect.ALLOW,
    //     actions: [
    //       "ssm:GetParameter",
    //     ],
    //     resources: ["*"],
    //   })
    // )

    /**
     * DynamoDB table for storing TODOs
     */
    const table = new dynamoDB.Table(this, "todos", {
      partitionKey: { name: "id", type: dynamoDB.AttributeType.BINARY },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      tableName: "table-todos",
    })
    new cdk.CfnOutput(this, "Table", { value: table.tableName })


    /**
     * DB parameters for an external database
     */



    // const commonLambdaLayers = [
    //   lambda.LayerVersion.fromLayerVersionArn(this, "Layer", lambdaParameterStoreLayer)
    // ]

    const databaseUrl = ssm.StringParameter.valueForStringParameter(
      this, '/todo-lambda-app/backend/database-url');
    const databaseReadAccessKey = ssm.StringParameter.valueForStringParameter(
        this, '/todo-lambda-app/backend/database-token-read-only');
    const databaseWriteAccessKey = ssm.StringParameter.valueForStringParameter(
        this, '/todo-lambda-app/backend/database-token-read-write');

    /**
     * Lambda function for saving TODOs
     */
    const saveTodoLambda = new NodejsFunction(this, "lambda-save-todo", {
      // code: lambda.AssetCode.fromAsset("lambda"),
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: path.join(__dirname, "../src/lambda/save-todo.lambda.ts"),
      functionName: "lambda-save-todo",
      handler: "handler",
      role: role,
      environment: {
        TABLE: table.tableName,
        DATABASE_URL: databaseUrl,
        DATABASE_WRITE_ACCESS_KEY: databaseWriteAccessKey,
      },
      // layers: [
      //   ...commonLambdaLayers
      // ]
    })

    /**
     * Lambda function for getting TODOs
     */
    const getTodoLambda = new NodejsFunction(this, "lambda-get-todo", {
      // code: lambda.AssetCode.fromAsset("lambda"),
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: path.join(__dirname, "../src/lambda/get-todo.lambda.ts"),
      functionName: "lambda-get-todo",
      handler: "handler",
      role: role,
      environment: {
        TABLE: table.tableName,
        DATABASE_URL: databaseUrl,
        DATABASE_READ_ACCESS_KEY: databaseReadAccessKey,
      },
      // layers: [
      //   ...commonLambdaLayers
      // ]
    })

    /**
     * Lambda function for updating todos
     */
    const updateTodoLambda = new NodejsFunction(this, "lambda-update-todo", {
      // code: lambda.AssetCode.fromAsset("lambda"),
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: path.join(__dirname, "../src/lambda/update-todo.lambda.ts"),
      functionName: "labmda-update-todo",
      handler: "handler",
      role: role,
      environment: {
        TABLE: table.tableName,
        DATABASE_URL: databaseUrl,
        DATABASE_WRITE_ACCESS_KEY: databaseWriteAccessKey,
      },
      // layers: [
      //   ...commonLambdaLayers
      // ]
    })

    /**
     * Lambda function for deleting todos
     */
    const deleteTodoLambda = new NodejsFunction(this, "lambda-delete-todo", {
      // code: lambda.AssetCode.fromAsset("lambda"),
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: path.join(__dirname, "../src/lambda/delete-todo.lambda.ts"),
      functionName: "labmda-delete-todo",
      handler: "handler",
      role: role,
      environment: {
        TABLE: table.tableName,
        DATABASE_URL: databaseUrl,
        DATABASE_WRITE_ACCESS_KEY: databaseWriteAccessKey,
      },
      // layers: [
      //   ...commonLambdaLayers
      // ]
    })

    table.grantFullAccess(saveTodoLambda)
    table.grantReadData(getTodoLambda)
    table.grantReadWriteData(updateTodoLambda)
    table.grantWriteData(deleteTodoLambda)

    const lambdaSaveTodoLogGroup = new LogGroup(this, '/aws/lambda/save-todo', {
      retention: RetentionDays.ONE_DAY,
    });
    lambdaSaveTodoLogGroup.addToResourcePolicy(new iam.PolicyStatement({
      actions: ['logs:CreateLogStream', 'logs:PutLogEvents'],
      principals: [new iam.ServicePrincipal('lambda.amazonaws.com')],
      resources: [lambdaSaveTodoLogGroup.logGroupArn],
    }));
    const lambdaGetTodoLogGroup = new LogGroup(this, '/aws/lambda/get-todo', {
      retention: RetentionDays.ONE_DAY,
    });
    lambdaGetTodoLogGroup.addToResourcePolicy(new iam.PolicyStatement({
      actions: ['logs:CreateLogStream', 'logs:PutLogEvents'],
      principals: [new iam.ServicePrincipal('lambda.amazonaws.com')],
      resources: [lambdaGetTodoLogGroup.logGroupArn],
    }));
    const lambdaUpdateTodoLogGroup = new LogGroup(this, '/aws/lambda/update-todo', {
      retention: RetentionDays.ONE_DAY,
    });
    lambdaUpdateTodoLogGroup.addToResourcePolicy(new iam.PolicyStatement({
      actions: ['logs:CreateLogStream', 'logs:PutLogEvents'],
      principals: [new iam.ServicePrincipal('lambda.amazonaws.com')],
      resources: [lambdaUpdateTodoLogGroup.logGroupArn],
    }));
    const lambdaDeleteTodoLogGroup = new LogGroup(this, '/aws/lambda/delete-todo', {
      retention: RetentionDays.ONE_DAY,
    });
    lambdaDeleteTodoLogGroup.addToResourcePolicy(new iam.PolicyStatement({
      actions: ['logs:CreateLogStream', 'logs:PutLogEvents'],
      principals: [new iam.ServicePrincipal('lambda.amazonaws.com')],
      resources: [lambdaDeleteTodoLogGroup.logGroupArn],
    }));


    // Create an API Gateway
    const httpApi = new HttpApi(this, "lambda-todo-api", {
      apiName: "Lambda TODO API",
      corsPreflight: {
        allowMethods: [
          CorsHttpMethod.POST,
          CorsHttpMethod.GET,
          CorsHttpMethod.PUT,
          CorsHttpMethod.DELETE,
        ],
        allowOrigins: ["*"],
      },
    });

    const saveTodoLambdaIntegration = new HttpLambdaIntegration('TemplateIntegration', saveTodoLambda);
    const getTodoLambdaIntegration = new HttpLambdaIntegration('TemplateIntegration', getTodoLambda);
    const updateTodoLambdaIntegration = new HttpLambdaIntegration('TemplateIntegration', updateTodoLambda);
    const deleteTodoLambdaIntegration = new HttpLambdaIntegration('TemplateIntegration', deleteTodoLambda);

    // Create a resource and method for the API
    httpApi.addRoutes({
      path: '/todo',
      methods: [HttpMethod.POST],
      integration: saveTodoLambdaIntegration,
    });

    httpApi.addRoutes({
      path: '/todo',
      methods: [HttpMethod.GET],
      integration: getTodoLambdaIntegration,
    });

    httpApi.addRoutes({
      path: '/todo',
      methods: [HttpMethod.PUT],
      integration: updateTodoLambdaIntegration,
    });

    httpApi.addRoutes({
      path: '/todo',
      methods: [HttpMethod.DELETE],
      integration: deleteTodoLambdaIntegration,
    });

    // Output the API endpoint URL
    new cdk.CfnOutput(this, "Lambda Todo API", {
      value: httpApi.apiEndpoint,
    });
  }
}
