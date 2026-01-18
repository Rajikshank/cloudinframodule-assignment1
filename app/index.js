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
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
          padding: 20px;
        }
        .container {
          max-width: 1200px;
          margin: 0 auto;
        }
        .header {
          text-align: center;
          color: white;
          margin-bottom: 30px;
        }
        .header h1 {
          font-size: 2.5em;
          margin-bottom: 10px;
          text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }
        .developer {
          font-style: italic;
          opacity: 0.9;
        }
        .grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
          gap: 20px;
          margin-bottom: 20px;
        }
        .card {
          background: white;
          border-radius: 15px;
          padding: 25px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.2);
          transition: transform 0.3s, box-shadow 0.3s;
        }
        .card:hover {
          transform: translateY(-5px);
          box-shadow: 0 15px 40px rgba(0,0,0,0.3);
        }
        .card-header {
          display: flex;
          align-items: center;
          margin-bottom: 20px;
          padding-bottom: 15px;
          border-bottom: 2px solid #f0f0f0;
        }
        .card-icon {
          font-size: 2em;
          margin-right: 15px;
        }
        .card-title {
          font-size: 1.5em;
          color: #333;
        }
        .info-row {
          display: flex;
          justify-content: space-between;
          padding: 12px;
          margin: 8px 0;
          background: #f8fafc;
          border-radius: 8px;
          transition: background 0.2s;
        }
        .info-row:hover {
          background: #e0f2fe;
        }
        .info-label {
          font-weight: 600;
          color: #64748b;
        }
        .info-value {
          color: #1e293b;
          font-weight: 500;
        }
        .status-badge {
          display: inline-block;
          padding: 5px 15px;
          border-radius: 20px;
          font-size: 0.9em;
          font-weight: 600;
        }
        .status-healthy {
          background: #dcfce7;
          color: #166534;
        }
        .loading {
          text-align: center;
          padding: 20px;
          color: #64748b;
        }
        .spinner {
          border: 3px solid #f3f3f3;
          border-top: 3px solid #667eea;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          animation: spin 1s linear infinite;
          margin: 20px auto;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .bucket-list {
          max-height: 400px;
          overflow-y: auto;
        }
        .bucket-item {
          padding: 15px;
          margin: 10px 0;
          background: linear-gradient(135deg, #667eea15 0%, #764ba215 100%);
          border-radius: 8px;
          border-left: 4px solid #667eea;
        }
        .bucket-name {
          font-weight: 600;
          color: #1e293b;
          margin-bottom: 5px;
        }
        .bucket-date {
          font-size: 0.85em;
          color: #64748b;
        }
        .error {
          background: #fee2e2;
          color: #991b1b;
          padding: 15px;
          border-radius: 8px;
          border-left: 4px solid #dc2626;
        }
        .refresh-btn {
          background: #667eea;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 1em;
          margin-top: 15px;
          transition: background 0.3s;
        }
        .refresh-btn:hover {
          background: #764ba2;
        }
        .count-badge {
          background: #667eea;
          color: white;
          padding: 3px 10px;
          border-radius: 12px;
          font-size: 0.85em;
          margin-left: 10px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🚀 AWS ECS Fargate Dashboard</h1>
          <p class="developer">Developed by <strong>AA1868-Rajikshan</strong></p>
        </div>

        <div class="grid">
          <!-- Health Check Card -->
          <div class="card">
            <div class="card-header">
              <span class="card-icon">💚</span>
              <h2 class="card-title">Health Status</h2>
            </div>
            <div id="health-content">
              <div class="loading">
                <div class="spinner"></div>
                <p>Loading health data...</p>
              </div>
            </div>
          </div>

          <!-- AWS Info Card -->
          <div class="card">
            <div class="card-header">
              <span class="card-icon">☁️</span>
              <h2 class="card-title">AWS Information</h2>
            </div>
            <div id="aws-content">
              <div class="loading">
                <div class="spinner"></div>
                <p>Loading AWS info...</p>
              </div>
            </div>
          </div>
        </div>

        <!-- S3 Buckets Card (Full Width) -->
        <div class="card">
          <div class="card-header">
            <span class="card-icon">🪣</span>
            <h2 class="card-title">S3 Buckets</h2>
            <span id="bucket-count" class="count-badge">0</span>
          </div>
          <div id="s3-content">
            <div class="loading">
              <div class="spinner"></div>
              <p>Loading S3 buckets...</p>
            </div>
          </div>
          <button class="refresh-btn" onclick="loadS3Buckets()">🔄 Refresh Buckets</button>
        </div>
      </div>

      <script>
        function formatUptime(seconds) {
          const hours = Math.floor(seconds / 3600);
          const minutes = Math.floor((seconds % 3600) / 60);
          const secs = Math.floor(seconds % 60);
          return \`\${hours}h \${minutes}m \${secs}s\`;
        }

        function formatDate(dateString) {
          const date = new Date(dateString);
          return date.toLocaleString();
        }

        async function loadHealth() {
          try {
            const response = await fetch('/health');
            const data = await response.json();
            
            document.getElementById('health-content').innerHTML = \`
              <div class="info-row">
                <span class="info-label">Status</span>
                <span class="status-badge status-healthy">✓ \${data.status.toUpperCase()}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Uptime</span>
                <span class="info-value">\${formatUptime(data.uptime)}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Last Check</span>
                <span class="info-value">\${formatDate(data.timestamp)}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Developer</span>
                <span class="info-value">\${data.developer}</span>
              </div>
            \`;
          } catch (error) {
            document.getElementById('health-content').innerHTML = \`
              <div class="error">Failed to load health data: \${error.message}</div>
            \`;
          }
        }

        async function loadAWSInfo() {
          try {
            const response = await fetch('/aws-info');
            const data = await response.json();
            
            document.getElementById('aws-content').innerHTML = \`
              <div class="info-row">
                <span class="info-label">Service</span>
                <span class="info-value">\${data.service}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Region</span>
                <span class="info-value">\${data.region}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Container</span>
                <span class="info-value">\${data.container}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Timestamp</span>
                <span class="info-value">\${formatDate(data.timestamp)}</span>
              </div>
            \`;
          } catch (error) {
            document.getElementById('aws-content').innerHTML = \`
              <div class="error">Failed to load AWS info: \${error.message}</div>
            \`;
          }
        }

        async function loadS3Buckets() {
          document.getElementById('s3-content').innerHTML = \`
            <div class="loading">
              <div class="spinner"></div>
              <p>Loading S3 buckets...</p>
            </div>
          \`;
          
          try {
            const response = await fetch('/s3-buckets');
            const data = await response.json();
            
            if (data.success) {
              document.getElementById('bucket-count').textContent = data.count;
              
              if (data.buckets.length === 0) {
                document.getElementById('s3-content').innerHTML = \`
                  <div class="info-row">
                    <span class="info-label">No S3 buckets found</span>
                  </div>
                \`;
              } else {
                const bucketsHtml = data.buckets.map(bucket => \`
                  <div class="bucket-item">
                    <div class="bucket-name">📦 \${bucket.Name}</div>
                    <div class="bucket-date">Created: \${formatDate(bucket.CreationDate)}</div>
                  </div>
                \`).join('');
                
                document.getElementById('s3-content').innerHTML = \`
                  <div class="bucket-list">\${bucketsHtml}</div>
                \`;
              }
            } else {
              document.getElementById('s3-content').innerHTML = \`
                <div class="error">
                  <strong>Error:</strong> \${data.error}<br>
                  <small>\${data.note}</small>
                </div>
              \`;
            }
          } catch (error) {
            document.getElementById('s3-content').innerHTML = \`
              <div class="error">Failed to load S3 buckets: \${error.message}</div>
            \`;
          }
        }

        // Load all data on page load
        window.onload = () => {
          loadHealth();
          loadAWSInfo();
          loadS3Buckets();
          
          // Auto-refresh health every 30 seconds
          setInterval(loadHealth, 30000);
        };
      </script>
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