// 声明外部模块以避免类型检查错误
declare module '@mariozechner/pi-agent-core' {
  // 核心类型声明
  export type Model<T = any> = any;
  export type Api = any;
  export type AgentMessage = any;
  export type AssistantMessage = any;
  export type StreamFn = any;
  export type AgentTool<T = any, R = any> = any;
  export type AgentToolResult<T = any> = any;
  export type AgentToolUpdateCallback<T = any> = any;
  export type ImageContent = any;
  export type TextContent = any;
  export type SessionManager = any;
  export type AgentSession = any;
  export type ModelRegistry = any;
  export type AuthStorage = any;
  export type ToolDefinition = any;
  export type ThinkingLevel = any;
  export type AgentEvent = any;
  export type OAuthProvider = any;
  export type OAuthCredentials = any;
  export type SimpleStreamOptions = any;
}

declare module '@mariozechner/pi-ai';
declare module '@mariozechner/pi-coding-agent';
declare module '@mariozechner/pi-tui';
