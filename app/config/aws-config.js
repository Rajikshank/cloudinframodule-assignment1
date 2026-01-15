const AWS = require('aws-sdk');

// Configure AWS SDK
AWS.config.update({ region: process.env.AWS_REGION || 'us-east-1' });

const s3 = new AWS.S3();
const dynamodb = new AWS.DynamoDB.DocumentClient();
const ec2 = new AWS.EC2();

module.exports = {
  s3,
  dynamodb,
  ec2,
  region: process.env.AWS_REGION || 'us-east-1'
};