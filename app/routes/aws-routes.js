const express = require('express');
const router = express.Router();
const { s3, region } = require('../config/aws-config');

router.get('/s3-buckets', async (req, res) => {
  try {
    const data = await s3.listBuckets().promise();
    
    // Get additional bucket details
    const bucketsWithDetails = await Promise.all(
      data.Buckets.slice(0, 10).map(async (bucket) => {
        try {
          const location = await s3.getBucketLocation({ Bucket: bucket.Name }).promise();
          const versioning = await s3.getBucketVersioning({ Bucket: bucket.Name }).promise();
          
          return {
            name: bucket.Name,
            creationDate: bucket.CreationDate,
            region: location.LocationConstraint || 'us-east-1',
            versioning: versioning.Status || 'Disabled',
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

router.get('/aws-info', (req, res) => {
  res.json({
    region: region,
    service: 'ECS Fargate',
    container: {
      hostname: process.env.HOSTNAME || 'local',
      platform: process.platform,
      nodeVersion: process.version
    },
    environment: {
      awsRegion: process.env.AWS_REGION || 'us-east-1',
      nodeEnv: process.env.NODE_ENV || 'production'
    },
    developer: 'Rajikshan',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;