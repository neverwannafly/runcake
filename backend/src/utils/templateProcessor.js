/**
 * Template processor for script variables
 * Supports {{ variable_name }} syntax
 */

/**
 * Extract template variables from script content
 * @param {string} content - Script content
 * @returns {string[]} - Array of unique variable names
 */
function extractTemplateVariables(content) {
  if (!content) return []
  
  // Regex to match {{ variable_name }} patterns
  const variableRegex = /\{\{\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\}\}/g
  const variables = new Set()
  let match
  
  while ((match = variableRegex.exec(content)) !== null) {
    variables.add(match[1])
  }
  
  return Array.from(variables).sort()
}

/**
 * Process template by replacing variables with values
 * @param {string} content - Script content with templates
 * @param {Object} variables - Key-value pairs of variables
 * @returns {Object} - { processedContent, missingVariables }
 */
function processTemplate(content, variables = {}) {
  if (!content) return { processedContent: '', missingVariables: [] }
  
  const requiredVariables = extractTemplateVariables(content)
  const missingVariables = requiredVariables.filter(varName => 
    !(varName in variables) || variables[varName] === null || variables[varName] === undefined
  )
  
  if (missingVariables.length > 0) {
    return { 
      processedContent: content, 
      missingVariables 
    }
  }
  
  // Replace all template variables
  let processedContent = content
  
  for (const [varName, value] of Object.entries(variables)) {
    // Create regex for this specific variable
    const variableRegex = new RegExp(`\\{\\{\\s*${varName}\\s*\\}\\}`, 'g')
    
    // Convert value to string and escape special characters for shell safety
    const safeValue = escapeShellValue(String(value))
    console.log(safeValue);
    processedContent = processedContent.replace(variableRegex, safeValue)
  }
  
  return { 
    processedContent, 
    missingVariables: [] 
  }
}

/**
 * Escape shell special characters to prevent injection
 * @param {string} value - Value to escape
 * @returns {string} - Escaped value
 */
function escapeShellValue(value) {
  // For bash scripts, we'll wrap in single quotes and escape any single quotes
  if (typeof value !== 'string') {
    value = String(value)
  }
  
  // Escape single quotes by ending quote, adding escaped quote, starting quote again
  return `${value.replace(/'/g, "'\"'\"'")}`
}

/**
 * Validate variable names
 * @param {Object} variables - Variables object
 * @returns {string[]} - Array of invalid variable names
 */
function validateVariableNames(variables) {
  const invalidNames = []
  const validNameRegex = /^[a-zA-Z_][a-zA-Z0-9_]*$/
  
  for (const varName of Object.keys(variables)) {
    if (!validNameRegex.test(varName)) {
      invalidNames.push(varName)
    }
  }
  
  return invalidNames
}

/**
 * Get template variables with their types and examples
 * @param {string} content - Script content
 * @returns {Object[]} - Array of variable info objects
 */
function getTemplateVariableInfo(content) {
  const variables = extractTemplateVariables(content)
  
  return variables.map(varName => ({
    name: varName,
    required: true,
    type: 'string',
    example: getExampleValue(varName),
    description: generateDescription(varName)
  }))
}

/**
 * Generate example value based on variable name
 * @param {string} varName - Variable name
 * @returns {string} - Example value
 */
function getExampleValue(varName) {
  const lowerName = varName.toLowerCase()
  
  if (lowerName.includes('port')) return '8080'
  if (lowerName.includes('host') || lowerName.includes('server')) return 'localhost'
  if (lowerName.includes('user') || lowerName.includes('username')) return 'admin'
  if (lowerName.includes('pass') || lowerName.includes('password')) return '••••••••'
  if (lowerName.includes('path') || lowerName.includes('dir')) return '/var/app'
  if (lowerName.includes('env') || lowerName.includes('environment')) return 'production'
  if (lowerName.includes('db') || lowerName.includes('database')) return 'myapp_production'
  if (lowerName.includes('email')) return 'admin@example.com'
  if (lowerName.includes('url')) return 'https://example.com'
  if (lowerName.includes('version')) return '1.0.0'
  if (lowerName.includes('count') || lowerName.includes('num')) return '5'
  
  return 'example_value'
}

/**
 * Generate description based on variable name
 * @param {string} varName - Variable name
 * @returns {string} - Description
 */
function generateDescription(varName) {
  const lowerName = varName.toLowerCase()
  
  if (lowerName.includes('port')) return 'Port number for the service'
  if (lowerName.includes('host') || lowerName.includes('server')) return 'Hostname or server address'
  if (lowerName.includes('user') || lowerName.includes('username')) return 'Username for authentication'
  if (lowerName.includes('pass') || lowerName.includes('password')) return 'Password for authentication'
  if (lowerName.includes('path') || lowerName.includes('dir')) return 'File or directory path'
  if (lowerName.includes('env') || lowerName.includes('environment')) return 'Environment name'
  if (lowerName.includes('db') || lowerName.includes('database')) return 'Database name'
  if (lowerName.includes('email')) return 'Email address'
  if (lowerName.includes('url')) return 'URL endpoint'
  if (lowerName.includes('version')) return 'Version number'
  if (lowerName.includes('count') || lowerName.includes('num')) return 'Numeric value'
  
  return `Value for ${varName}`
}

module.exports = {
  extractTemplateVariables,
  processTemplate,
  validateVariableNames,
  getTemplateVariableInfo,
  escapeShellValue
} 