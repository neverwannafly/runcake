# Backend API

A comprehensive Node.js backend for script management and execution platform with AWS integration.

## Features

- **Authentication & Authorization**: JWT-based authentication with role-based access
- **Script Management**: Create, update, delete, and organize scripts with tags
- **AWS Integration**: EC2 instance discovery and SSM command execution
- **Target Groups**: Manage AWS resource groups using tags
- **IAM Credentials**: Secure storage and management of AWS credentials
- **Audit Logging**: Complete execution history with detailed logs
- **Real-time Execution**: Asynchronous script execution with status tracking

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: SQLite with better-sqlite3
- **Authentication**: JWT + bcrypt
- **AWS SDK**: v3 (EC2 + SSM)
- **Security**: Helmet, CORS
- **Logging**: Morgan

## Quick Start

### Prerequisites

- Node.js 16+ 
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Or start production server
npm start
```

### Default Admin Account

```
Email: admin@example.com
Password: admin123
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - User logout

### Scripts
- `GET /api/scripts` - List all scripts
- `POST /api/scripts` - Create new script
- `GET /api/scripts/:id` - Get script by ID
- `PUT /api/scripts/:id` - Update script
- `DELETE /api/scripts/:id` - Delete script
- `POST /api/scripts/:id/execute` - Execute script

### Target Groups
- `GET /api/target-groups` - List all target groups
- `POST /api/target-groups` - Create new target group
- `GET /api/target-groups/:id` - Get target group by ID
- `GET /api/target-groups/:id/preview` - Preview AWS instances
- `PUT /api/target-groups/:id` - Update target group
- `DELETE /api/target-groups/:id` - Delete target group

### IAM Credentials
- `GET /api/iam-credentials` - List all credentials
- `POST /api/iam-credentials` - Create new credential
- `GET /api/iam-credentials/:id` - Get credential by ID
- `PUT /api/iam-credentials/:id` - Update credential
- `DELETE /api/iam-credentials/:id` - Delete credential

### Audit Logs
- `GET /api/audit-logs` - List execution logs
- `GET /api/audit-logs/:id` - Get log by ID

## Environment Variables

Create a `.env` file in the root directory:

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# Database
DB_PATH=./data/dev.db

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d

# AWS Configuration
AWS_DEFAULT_REGION=us-east-1

# CORS Configuration
FRONTEND_URL=http://localhost:5173
```

## Database Schema

The application uses SQLite with the following tables:

- **users**: User accounts with authentication
- **iam_credentials**: AWS credential storage
- **scripts**: Script definitions with content and metadata
- **target_groups**: AWS resource group definitions
- **script_executions**: Audit log of all executions

## AWS Integration

### Requirements

- AWS Account with appropriate permissions
- EC2 instances with SSM Agent installed
- IAM user with EC2 and SSM permissions

### Permissions Required

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ec2:DescribeInstances",
        "ssm:SendCommand",
        "ssm:GetCommandInvocation",
        "ssm:ListCommandInvocations"
      ],
      "Resource": "*"
    }
  ]
}
```

## Security Features

- JWT token-based authentication
- Password hashing with bcrypt
- CORS protection
- Helmet security headers
- Input validation
- Role-based access control
- Secure credential storage

## Development

### Project Structure

```
src/
├── database/          # Database schema and connection
├── middleware/        # Express middleware
├── routes/           # API route definitions
├── services/         # Business logic services
└── server.js         # Main application entry point
```

### Running in Development

```bash
npm run dev
```

This starts the server with nodemon for auto-restart on changes.

### Testing

```bash
npm test
```

## Deployment

### Production Build

```bash
npm start
```

### Environment Setup

- Set `NODE_ENV=production`
- Configure proper JWT secret
- Set up proper database path
- Configure CORS for production frontend URL

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details 