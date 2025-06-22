# Template Variables Feature

The Scaler application now supports template variables in scripts, allowing you to create reusable scripts with dynamic values.

## Syntax

Use the `{{ variable_name }}` syntax in your scripts:

```bash
#!/bin/bash
echo "Deploying to {{ environment }}"
echo "Using database: {{ db_host }}:{{ port }}"
```

## Variable Names

Variable names must:
- Start with a letter (a-z, A-Z) or underscore (_)
- Contain only letters, numbers, and underscores
- Be case-sensitive

✅ Valid: `environment`, `db_host`, `PORT_NUMBER`, `_private_key`
❌ Invalid: `123invalid`, `has-dash`, `has space`

## API Endpoints

### Get Template Variables
```
GET /api/scripts/:id/template-variables
```
Returns information about template variables in a script.

### Execute Script with Variables
```
POST /api/scripts/:id/execute
{
  "target_group_id": 1,
  "execution_mode": "all",
  "template_variables": {
    "environment": "production",
    "db_host": "prod-db.example.com",
    "port": "5432"
  }
}
```

## Security Features

- **Input Validation**: Variable names are validated to prevent injection
- **Shell Escaping**: All values are properly escaped for shell safety
- **Sensitive Masking**: Variables with names containing "pass", "key", "secret", or "token" are masked in logs and execution summaries

## Example

### Script Content
```bash
#!/bin/bash
echo "Deploying {{ app_name }} to {{ environment }}"
cd {{ app_path }}
docker run -e DB_HOST={{ db_host }} -e DB_PORT={{ port }} {{ app_name }}:{{ version }}
```

### Template Variables
```json
{
  "app_name": "my-app",
  "environment": "production", 
  "app_path": "/var/www/my-app",
  "db_host": "prod-db.example.com",
  "port": "5432",
  "version": "v1.2.3"
}
```

### Processed Script
```bash
#!/bin/bash
echo "Deploying 'my-app' to 'production'"
cd '/var/www/my-app'
docker run -e DB_HOST='prod-db.example.com' -e DB_PORT='5432' 'my-app':'v1.2.3'
```

## Error Handling

- **Missing Variables**: Returns 400 error with list of missing required variables
- **Invalid Names**: Returns 400 error with list of invalid variable names
- **Template Processing**: Fails gracefully if template processing encounters errors

## Database Storage

Template variables used in executions are stored in the `script_executions.template_variables` column as JSON for audit purposes. 