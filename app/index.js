const express = require('express');
const path = require('path');
const { S3Client, ListBucketsCommand, GetBucketLocationCommand, GetBucketVersioningCommand } = require('@aws-sdk/client-s3');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');

const app = express();
const port = 8080;

// Configure AWS SDK v3
const region = process.env.AWS_REGION || 'us-east-1';
const s3Client = new S3Client({ region });
const dynamoClient = new DynamoDBClient({ region });

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Health check endpoint
app.get('/api/health', (req, res) => {
  const os = require('os');
  const uptime = process.uptime();
  const hours = Math.floor(uptime / 3600);
  const minutes = Math.floor((uptime % 3600) / 60);
  const seconds = Math.floor(uptime % 60);

  // Calculate memory usage percentage
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;
  const memoryUsagePercent = ((usedMem / totalMem) * 100).toFixed(2);

  // Get load average (1, 5, 15 minutes)
  const loadAvg = os.loadavg();

  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: {
      raw: uptime,
      formatted: `${hours}h ${minutes}m ${seconds}s`,
      seconds: Math.floor(uptime)
    },
    system: {
      platform: os.platform(),
      arch: os.arch(),
      nodeVersion: process.version,
      hostname: os.hostname(),
      memory: {
        total: `${(os.totalmem() / 1024 / 1024 / 1024).toFixed(2)} GB`,
        free: `${(os.freemem() / 1024 / 1024 / 1024).toFixed(2)} GB`,
        used: `${((os.totalmem() - os.freemem()) / 1024 / 1024 / 1024).toFixed(2)} GB`,
        usagePercent: `${memoryUsagePercent}%`
      },
      cpu: {
        cores: os.cpus().length,
        model: os.cpus()[0]?.model || 'Unknown',
        speed: `${os.cpus()[0]?.speed || 0} MHz`
      },
      loadAverage: {
        '1min': loadAvg[0].toFixed(2),
        '5min': loadAvg[1].toFixed(2),
        '15min': loadAvg[2].toFixed(2)
      }
    },
    process: {
      pid: process.pid,
      memoryUsage: {
        rss: `${(process.memoryUsage().rss / 1024 / 1024).toFixed(2)} MB`,
        heapTotal: `${(process.memoryUsage().heapTotal / 1024 / 1024).toFixed(2)} MB`,
        heapUsed: `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB`
      }
    },
    developer: 'Rajikshan'
  });
});

// S3 buckets endpoint
app.get('/api/s3-buckets', async (req, res) => {
  try {
    // List all buckets
    const listCommand = new ListBucketsCommand({});
    const data = await s3Client.send(listCommand);
    
    // Get additional bucket details for first 10 buckets
    const bucketsWithDetails = await Promise.all(
      data.Buckets.slice(0, 10).map(async (bucket) => {
        try {
          // Get bucket location
          const locationCommand = new GetBucketLocationCommand({ Bucket: bucket.Name });
          const locationData = await s3Client.send(locationCommand);
          
          // Get bucket versioning
          const versioningCommand = new GetBucketVersioningCommand({ Bucket: bucket.Name });
          const versioningData = await s3Client.send(versioningCommand);
          
          return {
            name: bucket.Name,
            creationDate: bucket.CreationDate,
            region: locationData.LocationConstraint || 'us-east-1',
            versioning: versioningData.Status || 'Disabled',
            ageInDays: Math.floor((new Date() - new Date(bucket.CreationDate)) / (1000 * 60 * 60 * 24))
          };
        } catch (error) {
          return {
            name: bucket.Name,
            creationDate: bucket.CreationDate,
            region: 'Access Denied',
            versioning: 'Unknown',
            ageInDays: Math.floor((new Date() - new Date(bucket.CreationDate)) / (1000 * 60 * 60 * 24))
          };
        }
      })
    );

    res.json({
      success: true,
      buckets: bucketsWithDetails,
      totalCount: data.Buckets.length,
      displayedCount: bucketsWithDetails.length,
      developer: 'Rajikshan',
      timestamp: new Date().toISOString()
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

// AWS info endpoint
app.get('/api/aws-info', (req, res) => {
  res.json({
    region: region,
    service: 'ECS Fargate',
    container: {
      hostname: process.env.HOSTNAME || 'local',
      platform: process.platform,
      nodeVersion: process.version
    },
    environment: {
      awsRegion: region,
      nodeEnv: process.env.NODE_ENV || 'production'
    },
    developer: 'Rajikshan',
    timestamp: new Date().toISOString()
  });
});

// Main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${port}`);
  console.log(`👨‍💻 Developed by Rajikshan`);
  console.log(`📡 API Endpoints available at:`);
  console.log(`   - http://localhost:${port}/api/health`);
  console.log(`   - http://localhost:${port}/api/aws-info`);
  console.log(`   - http://localhost:${port}/api/s3-buckets`);
});