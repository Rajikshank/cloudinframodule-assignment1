// Load all data on page load
document.addEventListener('DOMContentLoaded', () => {
  loadHealth();
  loadAwsInfo();
  loadS3Buckets();
});

async function loadHealth() {
  const content = document.getElementById('health-content');
  content.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Loading...</div>';
  
  try {
    const response = await fetch('/api/health');
    const data = await response.json();
    
    content.innerHTML = `
      <div class="status-badge">
        <i class="fas fa-check-circle"></i> ${data.status.toUpperCase()}
      </div>
      
      <div class="stat-grid" style="margin-top: 20px;">
        <div class="stat-item">
          <div class="stat-label">Uptime</div>
          <div class="stat-value">${data.uptime.formatted}</div>
        </div>
        
        <div class="stat-item">
          <div class="stat-label">Platform</div>
          <div class="stat-value">${data.system.platform}</div>
        </div>
        
        <div class="stat-item">
          <div class="stat-label">Architecture</div>
          <div class="stat-value">${data.system.arch}</div>
        </div>
        
        <div class="stat-item">
          <div class="stat-label">Node Version</div>
          <div class="stat-value">${data.system.nodeVersion}</div>
        </div>
        
        <div class="stat-item">
          <div class="stat-label">CPU Cores</div>
          <div class="stat-value">${data.system.cpu.cores}</div>
        </div>
        
        <div class="stat-item">
          <div class="stat-label">Total Memory</div>
          <div class="stat-value">${data.system.memory.total}</div>
        </div>
        
        <div class="stat-item">
          <div class="stat-label">Free Memory</div>
          <div class="stat-value">${data.system.memory.free}</div>
        </div>
        
        <div class="stat-item">
          <div class="stat-label">Used Memory</div>
          <div class="stat-value">${data.system.memory.used}</div>
        </div>
      </div>
      
      <div style="margin-top: 20px; padding: 12px; background: rgba(100, 116, 139, 0.1); border-radius: 8px;">
        <div class="stat-label">CPU Model</div>
        <div style="color: #e2e8f0; font-size: 14px; margin-top: 4px;">${data.system.cpu.model}</div>
      </div>
      
      <div style="margin-top: 12px; font-size: 12px; color: #94a3b8;">
        <i class="fas fa-clock"></i> Last updated: ${new Date(data.timestamp).toLocaleString()}
      </div>
    `;
  } catch (error) {
    content.innerHTML = `
      <div class="error-message">
        <i class="fas fa-exclamation-triangle"></i>
        Failed to load health status: ${error.message}
      </div>
    `;
  }
}

async function loadAwsInfo() {
  const content = document.getElementById('aws-info-content');
  content.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Loading...</div>';
  
  try {
    const response = await fetch('/api/aws-info');
    const data = await response.json();
    
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
    content.innerHTML = `
      <div class="error-message">
        <i class="fas fa-exclamation-triangle"></i>
        Failed to load AWS info: ${error.message}
      </div>
    `;
  }
}

async function loadS3Buckets() {
  const content = document.getElementById('s3-content');
  content.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Loading S3 Buckets...</div>';
  
  try {
    const response = await fetch('/api/s3-buckets');
    const data = await response.json();
    
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
    content.innerHTML = `
      <div class="error-message">
        <i class="fas fa-exclamation-triangle"></i>
        Failed to load S3 buckets: ${error.message}
      </div>
    `;
  }
}