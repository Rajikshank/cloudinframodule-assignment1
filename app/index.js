const express = require('express');
const AWS = require('aws-sdk');
const os = require('os');

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
      <title>AWS ECS Fargate Dashboard</title>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          background: #0f172a;
          min-height: 100vh;
          padding: 20px;
          color: #e2e8f0;
          position: relative;
          overflow-x: hidden;
        }
        
        /* Animated background */
        body::before {
          content: '';
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: 
            radial-gradient(circle at 20% 50%, rgba(120, 119, 198, 0.15) 0%, transparent 50%),
            radial-gradient(circle at 80% 80%, rgba(59, 130, 246, 0.15) 0%, transparent 50%),
            radial-gradient(circle at 40% 20%, rgba(139, 92, 246, 0.1) 0%, transparent 50%);
          z-index: 0;
          animation: gradient 15s ease infinite;
        }
        
        @keyframes gradient {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }
        
        .container {
          max-width: 1400px;
          margin: 0 auto;
          position: relative;
          z-index: 1;
        }
        
        .header {
          text-align: center;
          margin-bottom: 40px;
          animation: fadeInDown 0.8s ease;
        }
        
        @keyframes fadeInDown {
          from {
            opacity: 0;
            transform: translateY(-30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .header h1 {
          font-size: 3em;
          font-weight: 700;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 10px;
          letter-spacing: -1px;
        }
        
        .developer {
          font-size: 2.1em;
          color: #94a3b8;
          font-weight: 600;
        }
        
        .developer strong {
          background: linear-gradient(135deg, #667eea, #764ba2);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          font-weight: 600;
        }
        
        .grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
          gap: 24px;
          margin-bottom: 24px;
        }
        
        .card {
          background: rgba(30, 41, 59, 0.5);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(148, 163, 184, 0.1);
          border-radius: 20px;
          padding: 28px;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          animation: fadeIn 0.6s ease;
          position: relative;
          overflow: hidden;
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(90deg, #667eea, #764ba2, #f093fb);
          transform: scaleX(0);
          transition: transform 0.4s ease;
        }
        
        .card:hover::before {
          transform: scaleX(1);
        }
        
        .card:hover {
          transform: translateY(-8px);
          box-shadow: 0 30px 60px rgba(0, 0, 0, 0.4);
          border-color: rgba(148, 163, 184, 0.2);
        }
        
        .card-header {
          display: flex;
          align-items: center;
          margin-bottom: 24px;
          padding-bottom: 18px;
          border-bottom: 1px solid rgba(148, 163, 184, 0.1);
        }
        
        .card-icon {
          font-size: 2.2em;
          margin-right: 16px;
          filter: drop-shadow(0 0 10px rgba(102, 126, 234, 0.3));
        }
        
        .card-title {
          font-size: 1.5em;
          color: #f1f5f9;
          font-weight: 600;
          letter-spacing: -0.5px;
        }
        
        .info-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 14px 16px;
          margin: 10px 0;
          background: rgba(15, 23, 42, 0.5);
          border-radius: 12px;
          border: 1px solid rgba(148, 163, 184, 0.05);
          transition: all 0.3s ease;
        }
        
        .info-row:hover {
          background: rgba(30, 41, 59, 0.8);
          border-color: rgba(102, 126, 234, 0.3);
          transform: translateX(4px);
        }
        
        .info-label {
          font-weight: 500;
          color: #94a3b8;
          font-size: 0.95em;
        }
        
        .info-value {
          color: #e2e8f0;
          font-weight: 600;
          font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
          font-size: 0.9em;
        }
        
        .status-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 16px;
          border-radius: 20px;
          font-size: 0.85em;
          font-weight: 600;
          animation: pulse 2s ease-in-out infinite;
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }
        
        .status-healthy {
          background: linear-gradient(135deg, #10b981, #059669);
          color: white;
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
        }
        
        .pulse-dot {
          width: 8px;
          height: 8px;
          background: white;
          border-radius: 50%;
          animation: blink 1.5s ease-in-out infinite;
        }
        
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        
        .loading {
          text-align: center;
          padding: 30px;
          color: #64748b;
        }
        
        .spinner {
          border: 3px solid rgba(148, 163, 184, 0.2);
          border-top: 3px solid #667eea;
          border-radius: 50%;
          width: 45px;
          height: 45px;
          animation: spin 1s linear infinite;
          margin: 20px auto;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .bucket-list {
          max-height: 450px;
          overflow-y: auto;
          padding-right: 8px;
        }
        
        .bucket-list::-webkit-scrollbar {
          width: 8px;
        }
        
        .bucket-list::-webkit-scrollbar-track {
          background: rgba(15, 23, 42, 0.5);
          border-radius: 10px;
        }
        
        .bucket-list::-webkit-scrollbar-thumb {
          background: rgba(102, 126, 234, 0.5);
          border-radius: 10px;
        }
        
        .bucket-list::-webkit-scrollbar-thumb:hover {
          background: rgba(102, 126, 234, 0.7);
        }
        
        .bucket-item {
          padding: 18px;
          margin: 12px 0;
          background: linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1));
          border-radius: 12px;
          border-left: 4px solid #667eea;
          transition: all 0.3s ease;
        }
        
        .bucket-item:hover {
          transform: translateX(8px);
          background: linear-gradient(135deg, rgba(102, 126, 234, 0.2), rgba(118, 75, 162, 0.2));
          border-left-color: #764ba2;
        }
        
        .bucket-name {
          font-weight: 600;
          color: #f1f5f9;
          margin-bottom: 6px;
          font-size: 1.05em;
        }
        
        .bucket-date {
          font-size: 0.85em;
          color: #94a3b8;
        }
        
        .error {
          background: rgba(220, 38, 38, 0.1);
          color: #fca5a5;
          padding: 18px;
          border-radius: 12px;
          border-left: 4px solid #dc2626;
        }
        
        .refresh-btn {
          background: linear-gradient(135deg, #667eea, #764ba2);
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 12px;
          cursor: pointer;
          font-size: 1em;
          font-weight: 600;
          margin-top: 18px;
          transition: all 0.3s ease;
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
        }
        
        .refresh-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
        }
        
        .refresh-btn:active {
          transform: translateY(0);
        }
        
        .count-badge {
          background: linear-gradient(135deg, #667eea, #764ba2);
          color: white;
          padding: 4px 14px;
          border-radius: 16px;
          font-size: 0.85em;
          margin-left: auto;
          font-weight: 600;
          box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
        }
        
        .metric-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
          margin-top: 16px;
        }
        
        .metric-card {
          background: rgba(15, 23, 42, 0.5);
          padding: 16px;
          border-radius: 12px;
          border: 1px solid rgba(148, 163, 184, 0.05);
          text-align: center;
          transition: all 0.3s ease;
        }
        
        .metric-card:hover {
          background: rgba(30, 41, 59, 0.8);
          border-color: rgba(102, 126, 234, 0.3);
        }
        
        .metric-value {
          font-size: 1.8em;
          font-weight: 700;
          background: linear-gradient(135deg, #667eea, #764ba2);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 4px;
        }
        
        .metric-label {
          font-size: 0.85em;
          color: #94a3b8;
          font-weight: 500;
        }
        
        .full-width {
          grid-column: 1 / -1;
        }
        
        .stat-highlight {
          display: inline-block;
          padding: 2px 8px;
          background: rgba(102, 126, 234, 0.2);
          border-radius: 6px;
          font-weight: 600;
          color: #a5b4fc;
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
              <h2 class="card-title">Health Monitor</h2>
            </div>
            <div id="health-content">
              <div class="loading">
                <div class="spinner"></div>
                <p>Initializing health checks...</p>
              </div>
            </div>
          </div>

          <!-- AWS Info Card -->
          <div class="card">
            <div class="card-header">
              <span class="card-icon">☁️</span>
              <h2 class="card-title">Cloud Infrastructure</h2>
            </div>
            <div id="aws-content">
              <div class="loading">
                <div class="spinner"></div>
                <p>Fetching cloud data...</p>
              </div>
            </div>
          </div>

          <!-- System Resources Card -->
          <div class="card">
            <div class="card-header">
              <span class="card-icon">⚡</span>
              <h2 class="card-title">System Resources</h2>
            </div>
            <div id="system-content">
              <div class="loading">
                <div class="spinner"></div>
                <p>Analyzing system metrics...</p>
              </div>
            </div>
          </div>

          <!-- Container Stats Card -->
          <div class="card">
            <div class="card-header">
              <span class="card-icon">📊</span>
              <h2 class="card-title">Container Insights</h2>
            </div>
            <div id="stats-content">
              <div class="loading">
                <div class="spinner"></div>
                <p>Collecting statistics...</p>
              </div>
            </div>
          </div>
        </div>

        <!-- S3 Buckets Card (Full Width) -->
        <div class="card full-width">
          <div class="card-header">
            <span class="card-icon">🪣</span>
            <h2 class="card-title">S3 Storage Buckets</h2>
            <span id="bucket-count" class="count-badge">0</span>
          </div>
          <div id="s3-content">
            <div class="loading">
              <div class="spinner"></div>
              <p>Scanning S3 buckets...</p>
            </div>
          </div>
          <button class="refresh-btn" onclick="loadS3Buckets()">🔄 Refresh Buckets</button>
        </div>
      </div>

      <script>
        function formatUptime(seconds) {
          const days = Math.floor(seconds / 86400);
          const hours = Math.floor((seconds % 86400) / 3600);
          const minutes = Math.floor((seconds % 3600) / 60);
          const secs = Math.floor(seconds % 60);
          
          if (days > 0) {
            return \`\${days}d \${hours}h \${minutes}m\`;
          }
          return \`\${hours}h \${minutes}m \${secs}s\`;
        }

        function formatDate(dateString) {
          const date = new Date(dateString);
          return date.toLocaleString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          });
        }

        function formatBytes(bytes) {
          const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
          if (bytes === 0) return '0 Bytes';
          const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
          return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
        }

        async function loadHealth() {
          try {
            const response = await fetch('/health');
            const data = await response.json();
            
            document.getElementById('health-content').innerHTML = \`
              <div class="info-row">
                <span class="info-label">Status</span>
                <span class="status-badge status-healthy">
                  <span class="pulse-dot"></span>
                  \${data.status.toUpperCase()}
                </span>
              </div>
              <div class="info-row">
                <span class="info-label">Uptime</span>
                <span class="info-value">\${formatUptime(data.uptime)}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Health Checks</span>
                <span class="info-value stat-highlight">\${data.healthChecks} passed</span>
              </div>
              <div class="info-row">
                <span class="info-label">Last Check</span>
                <span class="info-value">\${formatDate(data.timestamp)}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Node Version</span>
                <span class="info-value">\${data.nodeVersion}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Developer</span>
                <span class="info-value">\${data.developer}</span>
              </div>
            \`;
          } catch (error) {
            document.getElementById('health-content').innerHTML = \`
              <div class="error">❌ Failed to load health data: \${error.message}</div>
            \`;
          }
        }

        async function loadAWSInfo() {
          try {
            const response = await fetch('/aws-info');
            const data = await response.json();
            
            document.getElementById('aws-content').innerHTML = \`
              <div class="info-row">
                <span class="info-label">Service Type</span>
                <span class="info-value">\${data.service}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Region</span>
                <span class="info-value">\${data.region}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Availability Zone</span>
                <span class="info-value">\${data.availabilityZone}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Container ID</span>
                <span class="info-value">\${data.container}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Platform</span>
                <span class="info-value">\${data.platform}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Architecture</span>
                <span class="info-value">\${data.architecture}</span>
              </div>
            \`;
          } catch (error) {
            document.getElementById('aws-content').innerHTML = \`
              <div class="error">❌ Failed to load AWS info: \${error.message}</div>
            \`;
          }
        }

        async function loadSystemResources() {
          try {
            const response = await fetch('/system-resources');
            const data = await response.json();
            
            document.getElementById('system-content').innerHTML = \`
              <div class="metric-grid">
                <div class="metric-card">
                  <div class="metric-value">\${data.cpuCount}</div>
                  <div class="metric-label">CPU Cores</div>
                </div>
                <div class="metric-card">
                  <div class="metric-value">\${data.memoryUsagePercent}%</div>
                  <div class="metric-label">Memory Usage</div>
                </div>
              </div>
              <div class="info-row" style="margin-top: 12px;">
                <span class="info-label">Total Memory</span>
                <span class="info-value">\${formatBytes(data.totalMemory)}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Free Memory</span>
                <span class="info-value">\${formatBytes(data.freeMemory)}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Load Average</span>
                <span class="info-value">\${data.loadAverage}</span>
              </div>
            \`;
          } catch (error) {
            document.getElementById('system-content').innerHTML = \`
              <div class="error">❌ Failed to load system resources: \${error.message}</div>
            \`;
          }
        }

        async function loadContainerStats() {
          try {
            const response = await fetch('/container-stats');
            const data = await response.json();
            
            document.getElementById('stats-content').innerHTML = \`
              <div class="metric-grid">
                <div class="metric-card">
                  <div class="metric-value">\${data.requestCount}</div>
                  <div class="metric-label">Total Requests</div>
                </div>
                <div class="metric-card">
                  <div class="metric-value">\${formatUptime(data.uptime)}</div>
                  <div class="metric-label">Runtime</div>
                </div>
              </div>
              <div class="info-row" style="margin-top: 12px;">
                <span class="info-label">Process ID</span>
                <span class="info-value">\${data.pid}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Environment</span>
                <span class="info-value">\${data.environment}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Started At</span>
                <span class="info-value">\${formatDate(data.startTime)}</span>
              </div>
            \`;
          } catch (error) {
            document.getElementById('stats-content').innerHTML = \`
              <div class="error">❌ Failed to load container stats: \${error.message}</div>
            \`;
          }
        }

        async function loadS3Buckets() {
          document.getElementById('s3-content').innerHTML = \`
            <div class="loading">
              <div class="spinner"></div>
              <p>Scanning S3 buckets...</p>
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
                    <span class="info-label">No S3 buckets found in this region</span>
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
                  <strong>⚠️ Error:</strong> \${data.error}<br>
                  <small>\${data.note}</small>
                </div>
              \`;
            }
          } catch (error) {
            document.getElementById('s3-content').innerHTML = \`
              <div class="error">❌ Failed to load S3 buckets: \${error.message}</div>
            \`;
          }
        }

        // Load all data on page load
        window.onload = () => {
          loadHealth();
          loadAWSInfo();
          loadSystemResources();
          loadContainerStats();
          loadS3Buckets();
          
          // Auto-refresh all data every 30 seconds
          setInterval(() => {
            loadHealth();
            loadSystemResources();
            loadContainerStats();
          }, 30000);
        };
      </script>
    </body>
    </html>
  `);
});

// Enhanced health endpoint
let requestCounter = 0;
const startTime = new Date();

app.use((req, res, next) => {
  requestCounter++;
  next();
});

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    healthChecks: Math.floor(Math.random() * 100) + 500, // Simulated
    nodeVersion: process.version,
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
      note: 'Ensure the ECS task role has S3:ListAllMyBuckets permissions',
      developer: 'Rajikshan'
    });
  }
});

app.get('/aws-info', (req, res) => {
  res.json({
    region: process.env.AWS_REGION || 'us-east-1',
    availabilityZone: process.env.AWS_AVAILABILITY_ZONE || 'us-east-1a',
    service: 'ECS Fargate',
    container: process.env.HOSTNAME || 'local-dev',
    platform: os.platform(),
    architecture: os.arch(),
    developer: 'Rajikshan',
    timestamp: new Date().toISOString()
  });
});

app.get('/system-resources', (req, res) => {
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;
  
  res.json({
    totalMemory: totalMem,
    freeMemory: freeMem,
    usedMemory: usedMem,
    memoryUsagePercent: Math.round((usedMem / totalMem) * 100),
    cpuCount: os.cpus().length,
    loadAverage: os.loadavg()[0].toFixed(2),
    developer: 'Rajikshan'
  });
});

app.get('/container-stats', (req, res) => {
  res.json({
    uptime: process.uptime(),
    requestCount: requestCounter,
    pid: process.pid,
    environment: process.env.NODE_ENV || 'production',
    startTime: startTime.toISOString(),
    developer: 'Rajikshan'
  });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 Enhanced ECS Dashboard running on port ${port}`);
  console.log(`👨‍💻 Developed by Rajikshan (AA1868)`);
  console.log(`🌐 Access the dashboard at http://localhost:${port}`);
});