/**
 * MCP Server Implementation
 *
 * Implements Model Context Protocol for Claude Code integration
 * Handles conversation lifecycle and coordinates core modules
 */

import {
  MCPServer,
  MCPConfig,
  MCPStatus,
  MCPRequest,
  MCPResponse,
} from '../types';

import { capturer } from '../core/capturer';
import { formatter } from '../core/formatter';
import { writer } from '../core/writer';

export class DialogueReporterMCPServer implements MCPServer {
  private config?: MCPConfig;
  private running: boolean = false;
  private startTime?: Date;
  private requestCount: number = 0;
  private errorCount: number = 0;

  async start(config: MCPConfig): Promise<void> {
    this.config = config;
    this.startTime = new Date();
    this.running = true;

    // Initialize capturer
    await capturer.initialize({
      bufferSize: 100,
      flushInterval: 5000,
      includeToolCalls: true,
      includeTimestamps: true,
    });

    // Subscribe to captured data
    capturer.subscribe(async (data) => {
      try {
        // Format to markdown
        const markdown = await formatter.format(data);

        // Write to file
        const result = await writer.write(markdown);

        if (!result.success) {
          console.error('Failed to write conversation:', result.error);
          this.errorCount++;
        }
      } catch (error) {
        console.error('Failed to process conversation:', error);
        this.errorCount++;
      }
    });

    console.log('Dialogue Reporter MCP Server started');
  }

  async stop(): Promise<void> {
    this.running = false;

    // Shutdown capturer (flushes remaining data)
    await capturer.shutdown();

    console.log('Dialogue Reporter MCP Server stopped');
  }

  getStatus(): MCPStatus {
    const uptime = this.startTime
      ? Date.now() - this.startTime.getTime()
      : 0;

    return {
      running: this.running,
      uptime,
      requestsHandled: this.requestCount,
      errors: this.errorCount,
    };
  }

  async handleRequest(request: MCPRequest): Promise<MCPResponse> {
    this.requestCount++;

    try {
      const { method, params } = request;

      switch (method) {
        case 'initialize':
          return this.handleInitialize(params);

        case 'conversation/start':
          return this.handleConversationStart(params);

        case 'conversation/message':
          return this.handleConversationMessage(params);

        case 'conversation/end':
          return this.handleConversationEnd(params);

        case 'config/get':
          return this.handleConfigGet();

        case 'config/set':
          return this.handleConfigSet(params);

        case 'status/get':
          return this.handleStatusGet();

        case 'verify':
          return this.handleVerify();

        default:
          return {
            error: {
              code: -32601,
              message: `Method not found: ${method}`,
            },
          };
      }
    } catch (error) {
      this.errorCount++;

      return {
        error: {
          code: -32603,
          message: error instanceof Error ? error.message : 'Internal error',
        },
      };
    }
  }

  private handleInitialize(params: any): MCPResponse {
    return {
      result: {
        serverInfo: {
          name: 'dialogue-reporter',
          version: '1.0.0',
        },
        capabilities: {
          conversationCapture: true,
          markdownFormatting: true,
          configuration: true,
        },
      },
    };
  }

  private handleConversationStart(params: any): MCPResponse {
    const { sessionId } = params;

    if (!sessionId) {
      return {
        error: {
          code: -32602,
          message: 'Missing required parameter: sessionId',
        },
      };
    }

    capturer.startConversation(sessionId);

    return {
      result: {
        success: true,
        sessionId,
      },
    };
  }

  private handleConversationMessage(params: any): MCPResponse {
    const { message } = params;

    if (!message) {
      return {
        error: {
          code: -32602,
          message: 'Missing required parameter: message',
        },
      };
    }

    capturer.captureMessage(message);

    return {
      result: {
        success: true,
      },
    };
  }

  private handleConversationEnd(params: any): MCPResponse {
    capturer.endConversation();

    return {
      result: {
        success: true,
      },
    };
  }

  private handleConfigGet(): MCPResponse {
    return {
      result: {
        config: this.config,
      },
    };
  }

  private handleConfigSet(params: any): MCPResponse {
    // Configuration update would be implemented here
    return {
      result: {
        success: true,
      },
    };
  }

  private handleStatusGet(): MCPResponse {
    const status = this.getStatus();
    const capturerStatus = capturer.getStatus();
    const formatterStatus = formatter.getStatus();

    return {
      result: {
        server: status,
        capturer: capturerStatus,
        formatter: formatterStatus,
      },
    };
  }

  private async handleVerify(): Promise<MCPResponse> {
    try {
      // Verify capturer
      const capturerStatus = capturer.getStatus();
      if (!capturerStatus.initialized) {
        throw new Error('Capturer not initialized');
      }

      // Verify formatter
      const formatterStatus = formatter.getStatus();
      if (!formatterStatus.ready) {
        throw new Error('Formatter not ready');
      }

      // Verify writer permissions
      const writerStatus = await writer.getStatus();
      if (!writerStatus.writable) {
        throw new Error(`Output directory not writable: ${writerStatus.directory}`);
      }

      return {
        result: {
          success: true,
          checks: {
            capturer: 'ok',
            formatter: 'ok',
            writer: 'ok',
          },
        },
      };
    } catch (error) {
      return {
        error: {
          code: -32000,
          message: error instanceof Error ? error.message : 'Verification failed',
        },
      };
    }
  }
}

/**
 * Singleton instance
 */
export const mcpServer = new DialogueReporterMCPServer();
