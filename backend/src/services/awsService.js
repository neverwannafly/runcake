const { EC2Client, DescribeInstancesCommand } = require('@aws-sdk/client-ec2')
const { SSMClient, SendCommandCommand, GetCommandInvocationCommand } = require('@aws-sdk/client-ssm')

class AWSService {
  constructor(credentials) {
    const awsConfig = {
      region: credentials.region || 'us-east-1',
      credentials: {
        accessKeyId: credentials.access_key_id,
        secretAccessKey: credentials.secret_access_key
      }
    }
    
    this.ec2Client = new EC2Client(awsConfig)
    this.ssmClient = new SSMClient(awsConfig)
  }

  async getInstancesByTag(tagKey, tagValue) {
    try {
      const command = new DescribeInstancesCommand({
        Filters: [
          {
            Name: `tag:${tagKey}`,
            Values: [tagValue]
          },
          {
            Name: 'instance-state-name',
            Values: ['running']
          }
        ]
      })

      const response = await this.ec2Client.send(command)
      const instances = []

      response.Reservations?.forEach(reservation => {
        reservation.Instances?.forEach(instance => {
          instances.push({
            instanceId: instance.InstanceId,
            privateIpAddress: instance.PrivateIpAddress,
            publicIpAddress: instance.PublicIpAddress,
            instanceType: instance.InstanceType,
            state: instance.State?.Name,
            platform: instance.Platform || 'linux',
            tags: instance.Tags || [],
            launchTime: instance.LaunchTime
          })
        })
      })

      return {
        success: true,
        instances,
        total: instances.length
      }
    } catch (error) {
      console.error('Error fetching instances:', error)
      return {
        success: false,
        error: error.message,
        instances: []
      }
    }
  }

  async executeCommand(instanceIds, commands, executionMode = 'all', runnerId = null) {
    try {
      let targetInstanceIds = instanceIds
      if (executionMode === 'random' && instanceIds.length > 0) {
        const randomIndex = Math.floor(Math.random() * instanceIds.length)
        targetInstanceIds = [instanceIds[randomIndex]]
      }

      if (targetInstanceIds.length === 0) {
        throw new Error('No instances available for execution')
      }

      const scriptContent = Array.isArray(commands) ? commands.join('\n') : commands
      
      // Get runner init code if runnerId is provided
      let finalCommand = scriptContent
      let runnerName = 'bash'
      
      if (runnerId) {
        const { db } = require('../database/db')
        const runner = db.prepare('SELECT name, init_code FROM runners WHERE id = ?').get(runnerId)
        
        if (runner) {
          runnerName = runner.name
          // Replace {{SCRIPT_CONTENT}} placeholder with actual script content
          finalCommand = runner.init_code.replace('{{SCRIPT_CONTENT}}', scriptContent)
        } else {
          console.warn(`Runner with ID ${runnerId} not found, falling back to bash`)
          finalCommand = scriptContent
        }
      }

      const command = new SendCommandCommand({
        DocumentName: 'AWS-RunShellScript',
        InstanceIds: targetInstanceIds,
        Parameters: {
          commands: [finalCommand]
        },
        Comment: `Runcake script execution (${runnerName}) - ${new Date().toISOString()}`,
        TimeoutSeconds: 3600
      })

      const response = await this.ssmClient.send(command)

      return {
        success: true,
        commandId: response.Command?.CommandId,
        instanceIds: targetInstanceIds,
        status: response.Command?.Status || 'InProgress',
        runnerName
      }
    } catch (error) {
      console.error('Error executing command:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  async getCommandStatus(commandId, instanceId) {
    try {
      const command = new GetCommandInvocationCommand({
        CommandId: commandId,
        InstanceId: instanceId
      })

      const response = await this.ssmClient.send(command)

      return {
        success: true,
        status: response.Status,
        standardOutputContent: response.StandardOutputContent || '',
        standardErrorContent: response.StandardErrorContent || '',
        executionStartDateTime: response.ExecutionStartDateTime,
        executionEndDateTime: response.ExecutionEndDateTime
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
        status: 'Failed'
      }
    }
  }
}

module.exports = AWSService 