// Mock Users
export const mockUsers = [
  {
    id: 1,
    email: 'admin@scaler.com',
    password: 'admin123',
    name: 'Admin User',
    role: 'admin'
  },
  {
    id: 2,
    email: 'user@scaler.com',
    password: 'user123',
    name: 'Regular User',
    role: 'user'
  }
]

// Mock Target Groups
export const mockTargetGroups = [
  {
    id: 1,
    name: 'Production Web Servers',
    description: 'Main production web servers running the customer-facing application',
    environment: 'production',
    region: 'us-east-1',
    lastUpdated: '2024-01-15T10:00:00Z',
    servers: [
      { name: 'web-prod-01', ip: '10.0.1.10' },
      { name: 'web-prod-02', ip: '10.0.1.11' },
      { name: 'web-prod-03', ip: '10.0.1.12' }
    ]
  },
  {
    id: 2,
    name: 'Staging Environment',
    description: 'Pre-production testing environment for staging deployments',
    environment: 'staging',
    region: 'us-west-2',
    lastUpdated: '2024-01-14T15:30:00Z',
    servers: [
      { name: 'staging-web-01', ip: '10.0.2.10' },
      { name: 'staging-api-01', ip: '10.0.2.11' }
    ]
  },
  {
    id: 3,
    name: 'Database Cluster',
    description: 'MongoDB replica set for application data storage',
    environment: 'production',
    region: 'us-east-1',
    lastUpdated: '2024-01-16T08:45:00Z',
    servers: [
      { name: 'db-primary', ip: '10.0.3.10' },
      { name: 'db-secondary-01', ip: '10.0.3.11' },
      { name: 'db-secondary-02', ip: '10.0.3.12' },
      { name: 'db-arbiter', ip: '10.0.3.13' }
    ]
  },
  {
    id: 4,
    name: 'Development Servers',
    description: 'Development environment for feature testing and debugging',
    environment: 'development',
    region: 'us-west-1',
    lastUpdated: '2024-01-13T12:20:00Z',
    servers: [
      { name: 'dev-app-01', ip: '10.0.4.10' },
      { name: 'dev-api-01', ip: '10.0.4.11' },
      { name: 'dev-db-01', ip: '10.0.4.12' }
    ]
  },
  {
    id: 5,
    name: 'Load Balancers',
    description: 'HAProxy load balancers for traffic distribution',
    environment: 'production',
    region: 'us-east-1',
    lastUpdated: '2024-01-16T14:10:00Z',
    servers: [
      { name: 'lb-primary', ip: '10.0.5.10' },
      { name: 'lb-backup', ip: '10.0.5.11' }
    ]
  }
]

// Mock Scripts
export const mockScripts = [
  {
    id: 1,
    name: 'System Health Check',
    description: 'Comprehensive system health monitoring script that checks CPU, memory, disk usage, and running services',
    content: `#!/bin/bash
# System Health Check Script

echo "=== System Health Check ==="
echo "Timestamp: $(date)"
echo

# CPU Usage
echo "CPU Usage:"
top -bn1 | grep "Cpu(s)" | awk '{print $2 + $4}'

# Memory Usage
echo "Memory Usage:"
free -h | awk 'NR==2{printf "%.2f%%", $3*100/$2 }'

# Disk Usage
echo "Disk Usage:"
df -h | awk '$NF=="/"{printf "%s", $5}'

echo
echo "Health check completed successfully!"`,
    tags: ['monitoring', 'health', 'system'],
    createdBy: 'admin@scaler.com',
    createdAt: '2024-01-10T09:00:00Z'
  },
  {
    id: 2,
    name: 'Deploy Application',
    description: 'Automated deployment script for application updates with rollback capability',
    content: `#!/bin/bash
# Application Deployment Script

APP_NAME="webapp"
VERSION=$1

if [ -z "$VERSION" ]; then
    echo "Usage: $0 <version>"
    exit 1
fi

echo "Deploying $APP_NAME version $VERSION..."

# Backup current version
sudo cp /opt/$APP_NAME/current /opt/$APP_NAME/backup_$(date +%Y%m%d_%H%M%S)

# Download new version
wget -q "https://releases.example.com/$APP_NAME-$VERSION.tar.gz"

# Extract and deploy
tar -xzf $APP_NAME-$VERSION.tar.gz
sudo cp -r $APP_NAME-$VERSION/* /opt/$APP_NAME/

# Restart service
sudo systemctl restart $APP_NAME

echo "Deployment completed successfully!"`,
    tags: ['deployment', 'automation', 'ci-cd'],
    createdBy: 'admin@scaler.com',
    createdAt: '2024-01-12T14:30:00Z'
  },
  {
    id: 3,
    name: 'Security Audit',
    description: 'Security compliance check including user permissions, open ports, and system configurations',
    content: `#!/bin/bash
# Security Audit Script

echo "=== Security Audit Report ==="
echo "Generated: $(date)"
echo

# Check for users with sudo access
echo "Users with sudo access:"
getent group sudo | cut -d: -f4

# Check open ports
echo "Open network ports:"
netstat -tuln | grep LISTEN

# Check failed login attempts
echo "Recent failed login attempts:"
grep "Failed password" /var/log/auth.log | tail -5

# Check file permissions on sensitive files
echo "Checking sensitive file permissions..."
ls -la /etc/passwd /etc/shadow /etc/sudo* 2>/dev/null

echo "Security audit completed."`,
    tags: ['security', 'audit', 'compliance'],
    createdBy: 'user@scaler.com',
    createdAt: '2024-01-08T11:15:00Z'
  },
  {
    id: 4,
    name: 'Database Backup',
    description: 'Automated database backup script with compression and remote storage upload',
    content: `#!/bin/bash
# Database Backup Script

DB_NAME="production_db"
BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/\${DB_NAME}_backup_$DATE.sql.gz"

echo "Starting database backup for $DB_NAME..."

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

# Perform database backup
mongodump --db $DB_NAME --archive | gzip > $BACKUP_FILE

# Verify backup was created
if [ -f "$BACKUP_FILE" ]; then
    echo "Backup created successfully: $BACKUP_FILE"
    echo "Backup size: $(du -h $BACKUP_FILE | cut -f1)"
    
    # Upload to cloud storage (simulated)
    echo "Uploading to cloud storage..."
    # aws s3 cp $BACKUP_FILE s3://backups/database/
    
    echo "Database backup completed successfully!"
else
    echo "ERROR: Backup failed!"
    exit 1
fi`,
    tags: ['database', 'backup', 'automation'],
    createdBy: 'admin@scaler.com',
    createdAt: '2024-01-14T16:45:00Z'
  },
  {
    id: 5,
    name: 'Log Cleanup',
    description: 'Clean up old log files to free disk space while preserving recent logs',
    content: `#!/bin/bash
# Log Cleanup Script

LOG_DIRS="/var/log /opt/app/logs"
DAYS_TO_KEEP=30

echo "Starting log cleanup process..."
echo "Keeping logs newer than $DAYS_TO_KEEP days"

for dir in $LOG_DIRS; do
    if [ -d "$dir" ]; then
        echo "Cleaning logs in $dir..."
        
        # Find and list files to be deleted
        find $dir -name "*.log" -type f -mtime +$DAYS_TO_KEEP -ls
        
        # Delete old log files
        find $dir -name "*.log" -type f -mtime +$DAYS_TO_KEEP -delete
        
        # Compress logs older than 7 days but newer than retention period
        find $dir -name "*.log" -type f -mtime +7 -mtime -$DAYS_TO_KEEP -exec gzip {} \;
    fi
done

echo "Log cleanup completed successfully!"
echo "Current disk usage:"
df -h | grep -E "/$|/var"`,
    tags: ['maintenance', 'cleanup', 'storage'],
    createdBy: 'user@scaler.com',
    createdAt: '2024-01-09T13:20:00Z'
  }
]

// Mock Audit Logs
export const mockAuditLogs = [
  {
    id: 1,
    scriptId: 1,
    scriptName: 'System Health Check',
    targetGroupId: 1,
    targetGroupName: 'Production Web Servers',
    status: 'success',
    output: `=== System Health Check ===
Timestamp: Mon Jan 15 2024 10:30:45 GMT-0500

CPU Usage:
15.2%

Memory Usage:
67.45%

Disk Usage:
82%

Health check completed successfully!`,
    executedAt: '2024-01-15T15:30:45Z',
    executedBy: 'admin@scaler.com'
  },
  {
    id: 2,
    scriptId: 2,
    scriptName: 'Deploy Application',
    targetGroupId: 2,
    targetGroupName: 'Staging Environment',
    status: 'success',
    output: `Deploying webapp version 2.1.4...

Backup created: /opt/webapp/backup_20240115_103245
Downloading release package...
Extracting application files...
Restarting application service...

Deployment completed successfully!
Application is now running version 2.1.4`,
    executedAt: '2024-01-15T15:32:45Z',
    executedBy: 'admin@scaler.com'
  },
  {
    id: 3,
    scriptId: 3,
    scriptName: 'Security Audit',
    targetGroupId: 1,
    targetGroupName: 'Production Web Servers',
    status: 'failed',
    output: `=== Security Audit Report ===
Generated: Mon Jan 15 2024 10:35:12 GMT-0500

ERROR: Insufficient permissions to access /var/log/auth.log
Some security checks could not be completed.
Please run with elevated privileges.

Security audit failed - manual review required.`,
    executedAt: '2024-01-15T15:35:12Z',
    executedBy: 'user@scaler.com'
  },
  {
    id: 4,
    scriptId: 4,
    scriptName: 'Database Backup',
    targetGroupId: 3,
    targetGroupName: 'Database Cluster',
    status: 'success',
    output: `Starting database backup for production_db...

Creating backup directory...
Performing mongodump operation...
Compressing backup file...

Backup created successfully: /backups/production_db_backup_20240115_104012.sql.gz
Backup size: 2.3G

Uploading to cloud storage...
Upload completed successfully!

Database backup completed successfully!`,
    executedAt: '2024-01-15T15:40:12Z',
    executedBy: 'admin@scaler.com'
  },
  {
    id: 5,
    scriptId: 5,
    scriptName: 'Log Cleanup',
    targetGroupId: 4,
    targetGroupName: 'Development Servers',
    status: 'success',
    output: `Starting log cleanup process...
Keeping logs newer than 30 days

Cleaning logs in /var/log...
Found 15 old log files (125 MB)
Deleted 15 files

Cleaning logs in /opt/app/logs...
Found 8 old log files (45 MB)
Deleted 8 files
Compressed 12 recent log files

Log cleanup completed successfully!
Current disk usage:
/dev/sda1    20G   12G  7.1G  63% /
/dev/sda2    10G  3.2G  6.3G  34% /var`,
    executedAt: '2024-01-15T15:42:30Z',
    executedBy: 'user@scaler.com'
  }
] 