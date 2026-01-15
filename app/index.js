const express = require('express');
const AWS = require('aws-sdk');

const app = express();
const port = 8080;

// Configure AWS SDK
AWS.config.update({ region: process.env.AWS_REGION || 'us-east-1' });

const s3 = new AWS.S3();
const dynamodb = new AWS.DynamoDB.DocumentClient();

app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>AWS ECS Demo App</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          max-width: 800px;
          margin: 50px auto;
          padding: 20px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
        }
        .container {
          background: white;
          padding: 40px;
          border-radius: 10px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        }
        h1 {
          color: #333;
          text-align: center;
          margin-bottom: 10px;
        }
        .developer {
          text-align: center;
          color: #666;
          font-style: italic;
          margin-bottom: 30px;
          font-size: 14px;
        }
        .status {
          background: #f0f9ff;
          padding: 20px;
          border-radius: 5px;
          margin: 20px 0;
          border-left: 4px solid #0ea5e9;
        }
        .button {
          display: inline-block;
          background: #667eea;
          color: white;
          padding: 10px 20px;
          text-decoration: none;
          border-radius: 5px;
          margin: 5px;
          transition: background 0.3s;
        }
        .button:hover {
          background: #764ba2;
        }
        .info {
          margin: 10px 0;
          padding: 10px;
          background: #f8fafc;
          border-radius: 5px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🚀 AWS ECS Fargate Demo Application</h1>
        <p class="developer">Developed by <strong>Rajikshan</strong></p>
        
        <div class="status">
          <h2>✅ Application Status</h2>
          <div class="info">
            <strong>Status:</strong> Running<br>
            <strong>Port:</strong> ${port}<br>
            <strong>Environment:</strong> AWS ECS Fargate<br>
            <strong>Region:</strong> ${process.env.AWS_REGION || 'us-east-1'}
          </div>
        </div>

        <div class="status">
          <h2>🔗 Available Endpoints</h2>
          <a href="/health" class="button">Health Check</a>
          <a href="/s3-buckets" class="button">List S3 Buckets</a>
          <a href="/aws-info" class="button">AWS Info</a>
        </div>

        <div class="status">
          <h2>📋 Project Details</h2>
          <p>This application demonstrates:</p>
          <ul>
            <li>Node.js application running on ECS Fargate</li>
            <li>Infrastructure provisioned with Terraform</li>
            <li>CI/CD with GitHub Actions</li>
            <li>Docker containerization</li>
            <li>AWS service integration (S3, IAM)</li>
          </ul>
        </div>
      </div>
    </body>
    </html>
  `);
});

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    developer: 'Rajikshan'
  });
});

app.get('/s3-buckets', async (req, res) => {
  try {
    const data = await s3.listBuckets().promise();
    res.json({
      success: true,
      buckets: data.Buckets,
      count: data.Buckets.length,
      developer: 'Rajikshan'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      note: 'Make sure the ECS task role has S3 permissions',
      developer: 'Rajikshan'
    });
  }
});

app.get('/aws-info', (req, res) => {
  res.json({
    region: process.env.AWS_REGION || 'us-east-1',
    service: 'ECS Fargate',
    container: process.env.HOSTNAME || 'local',
    developer: 'Rajikshan',
    timestamp: new Date().toISOString()
  });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${port}`);
  console.log(`👨‍💻 Developed by Rajikshan`);
});