// Load all data on page load
document.addEventListener('DOMContentLoaded', () => {
  console.log('Page loaded, starting data fetch...');
  loadHealth();
  loadAwsInfo();
  loadS3Buckets();
});

async function loadHealth() {
  const content = document.getElementById('health-content');
  content.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Loading...</div>';
  
  console.log('Fetching health data...');
  
  try {
    const response = await fetch('/api/health');
    console.log('Health response status:', response.status);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Health data received:', data);
    
    content.innerHTML = `
      <div class="status-badge">
        <i class="fas fa-check-circle"></i> ${data.status.toUpperCase()}
      </div>
      
      <div class="stat-grid" style="margin-top: 20px;">
        <div class="stat-item">
          <div class="stat-label"><i class="fas fa-hourglass-half"></i> Uptime</div>
          <div class="stat-value">${data.uptime.formatted}</div>
        </div>
        
        <div class="stat-item">
          <div class="stat-label"><i class="fas fa-desktop"></i> Platform</div>
          <div class="stat-value">${data.system.platform}</div>
        </div>
        
        <div class="stat-item">
          <div class="stat-label"><i class="fas fa-microchip"></i> Architecture</div>
          <div class="stat-value">${data.system.arch}</div>
        </div>
        
        <div class="stat-item">
          <div class="stat-label"><i class="fab fa-node-js"></i> Node Version</div>
          <div class="stat-value">${data.system.nodeVersion}</div>
        </div>
        
        <div class="stat-item">
          <div class="stat-label"><i class="fas fa-microchip"></i> CPU Cores</div>
          <div class="stat-value">${data.system.cpu.cores}</div>
        </div>
        
        <div class="stat-item">
          <div class="stat-label"><i class="fas fa-tachometer-alt"></i> CPU Speed</div>
          <div class="stat-value">${data.system.cpu.speed}</div>
        </div>
        
        <div class="stat-item">
          <div class="stat-label"><i class="fas fa-memory"></i> Total Memory</div>
          <div class="stat-value">${data.system.memory.total}</div>
        </div>
        
        <div class="stat-item">
          <div class="stat-label"><i class="fas fa-chart-line"></i> Memory Usage</div>
          <div class="stat-value">${data.system.memory.usagePercent}</div>
        </div>
        
        <div class="stat-item">
          <div class="stat-label"><i class="fas fa-server"></i> Hostname</div>
          <div class="stat-value">${data.system.hostname}</div>
        </div>
        
        <div class="stat-item">
          <div class="stat-label"><i class="fas fa-hashtag"></i> Process ID</div>
          <div class="stat-value">${data.process.pid}</div>
        </div>
        
        <div class="stat-item">
          <div class="stat-label"><i class="fas fa-arrow-up"></i> Load (1min)</div>
          <div class="stat-value">${data.system.loadAverage['1min']}</div>
        </div>
        
        <div class="stat-item">
          <div class="stat-label"><i class="fas fa-arrow-up"></i> Load (5min)</div>
          <div class="stat-value">${data.system.loadAverage['5min']}</div>
        </div>
      </div>
      
      <div style="margin-top: 20px; padding: 16px; background: rgba(0, 210, 255, 0.1); border-radius: 12px; border: 1px solid rgba(0, 210, 255, 0.3);">
        <div class="stat-label" style="color: #00d2ff;"><i class="fas fa-microchip"></i> CPU Model</div>
        <div style="color: #e2e8f0; font-size: 14px; margin-top: 6px; font-weight: 600;">${data.system.cpu.model}</div>
      </div>
      
      <div style="margin-top: 16px; padding: 16px; background: rgba(0, 210, 255, 0.1); border-radius: 12px; border: 1px solid rgba(0, 210, 255, 0.3);">
        <div class="stat-label" style="color: #00d2ff;"><i class="fas fa-memory"></i> Process Memory Usage</div>
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-top: 10px;">
          <div>
            <div style="font-size: 11px; color: #94a3b8;">RSS</div>
            <div style="color: #e2e8f0; font-weight: 600;">${data.process.memoryUsage.rss}</div>
          </div>
          <div>
            <div style="font-size: 11px; color: #94a3b8;">Heap Total</div>
            <div style="color: #e2e8f0; font-weight: 600;">${data.process.memoryUsage.heapTotal}</div>
          </div>
          <div>
            <div style="font-size: 11px; color: #94a3b8;">Heap Used</div>
            <div style="color: #e2e8f0; font-weight: 600;">${data.process.memoryUsage.heapUsed}</div>
          </div>
        </div>
      </div>
      
      <div style="margin-top: 16px; font-size: 12px; color: #94a3b8; text-align: center;">
        <i class="fas fa-clock"></i> Last updated: ${new Date(data.timestamp).toLocaleString()}
      </div>
    `;
  } catch (error) {
    console.error('Health fetch error:', error);
    content.innerHTML = `
      <div class="error-message">
        <i class="fas fa-exclamation-triangle"></i>
        Failed to load health status: ${error.message}
        <p style="margin-top: 8px; font-size: 12px;">Check browser console for details</p>
      </div>
    `;
  }
}

async function loadAwsInfo() {
  const content = document.getElementById('aws-info-content');
  content.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Loading...</div>';
  
  console.log('Fetching AWS info...');
  
  try {
    const response = await fetch('/api/aws-info');
    console.log('AWS info response status:', response.status);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('AWS info data received:', data);
    
    content.innerHTML = `
      <div class="stat-grid">
        <div class="stat-item">
          <div class="stat-label"><i class="fas fa-globe"></i> Region</div>
          <div class="stat-value">${data.region}</div>
        </div>
        
        <div class="stat-item">
          <div class="stat-label"><i class="fas fa-server"></i> Service</div>
          <div class="stat-value">${data.service}</div>
        </div>
        
        <div class="stat-item">
          <div class="stat-label"><i class="fas fa-box"></i> Container</div>
          <div class="stat-value">${data.container.hostname}</div>
        </div>
        
        <div class="stat-item">
          <div class="stat-label"><i class="fab fa-node-js"></i> Node Version</div>
          <div class="stat-value">${data.container.nodeVersion}</div>
        </div>
        
        <div class="stat-item">
          <div class="stat-label"><i class="fas fa-cog"></i> Platform</div>
          <div class="stat-value">${data.container.platform}</div>
        </div>
        
        <div class="stat-item">
          <div class="stat-label"><i class="fas fa-leaf"></i> Environment</div>
          <div class="stat-value">${data.environment.nodeEnv}</div>
        </div>
      </div>
      
      <div style="margin-top: 16px; padding: 12px; background: rgba(102, 126, 234, 0.1); border-radius: 8px; border: 1px solid rgba(102, 126, 234, 0.3);">
        <div style="color: #94a3b8; font-size: 12px; margin-bottom: 4px;">AWS REGION CONFIG</div>
        <div style="color: #667eea; font-size: 16px; font-weight: 600;">${data.environment.awsRegion}</div>
      </div>
      
      <div style="margin-top: 12px; font-size: 12px; color: #94a3b8;">
        <i class="fas fa-clock"></i> Last updated: ${new Date(data.timestamp).toLocaleString()}
      </div>
    `;
  } catch (error) {
    console.error('AWS info fetch error:', error);
    content.innerHTML = `
      <div class="error-message">
        <i class="fas fa-exclamation-triangle"></i>
        Failed to load AWS info: ${error.message}
        <p style="margin-top: 8px; font-size: 12px;">Check browser console for details</p>
      </div>
    `;
  }
}

async function loadS3Buckets() {
  const content = document.getElementById('s3-content');
  content.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Loading S3 Buckets...</div>';
  
  console.log('Fetching S3 buckets...');
  
  try {
    const response = await fetch('/api/s3-buckets');
    console.log('S3 buckets response status:', response.status);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('S3 buckets data received:', data);
    
    if (data.success) {
      const summaryHtml = `
        <div class="summary-stats">
          <div class="summary-card">
            <div class="number">${data.totalCount}</div>
            <div class="label">Total Buckets</div>
          </div>
          <div class="summary-card">
            <div class="number">${data.displayedCount}</div>
            <div class="label">Displayed</div>
          </div>
        </div>
      `;
      
      if (data.buckets.length === 0) {
        content.innerHTML = summaryHtml + `
          <div style="text-align: center; padding: 40px; color: #94a3b8;">
            <i class="fas fa-inbox" style="font-size: 48px; margin-bottom: 16px;"></i>
            <p>No S3 buckets found</p>
          </div>
        `;
        return;
      }
      
      const tableHtml = `
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th><i class="fas fa-database"></i> Bucket Name</th>
                <th><i class="fas fa-globe"></i> Region</th>
                <th><i class="fas fa-calendar"></i> Created</th>
                <th><i class="fas fa-clock"></i> Age</th>
                <th><i class="fas fa-history"></i> Versioning</th>
              </tr>
            </thead>
            <tbody>
              ${data.buckets.map(bucket => `
                <tr>
                  <td class="bucket-name">
                    <i class="fas fa-folder"></i> ${bucket.name}
                  </td>
                  <td>
                    <span class="badge">${bucket.region}</span>
                  </td>
                  <td>${new Date(bucket.creationDate).toLocaleDateString()}</td>
                  <td>${bucket.ageInDays} days</td>
                  <td>
                    <span class="badge ${bucket.versioning === 'Enabled' ? 'success' : 'warning'}">
                      ${bucket.versioning}
                    </span>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        
        <div style="margin-top: 16px; font-size: 12px; color: #94a3b8; text-align: center;">
          <i class="fas fa-info-circle"></i> Showing first 10 buckets | Last updated: ${new Date(data.timestamp).toLocaleString()}
        </div>
      `;
      
      content.innerHTML = summaryHtml + tableHtml;
    } else {
      content.innerHTML = `
        <div class="error-message">
          <i class="fas fa-exclamation-triangle"></i>
          <strong>Error:</strong> ${data.error}
          <p style="margin-top: 8px; font-size: 14px;">${data.note}</p>
        </div>
      `;
    }
  } catch (error) {
    console.error('S3 buckets fetch error:', error);
    content.innerHTML = `
      <div class="error-message">
        <i class="fas fa-exclamation-triangle"></i>
        Failed to load S3 buckets: ${error.message}
        <p style="margin-top: 8px; font-size: 12px;">Check browser console for details</p>
      </div>
    `;
  }
}