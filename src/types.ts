export interface RoleBlueprint {
  name: string;
  color: string;
  permissions: string[];
  hoist: boolean;
  mentionable: boolean;
}

export interface ChannelBlueprint {
  name: string;
  type: "text" | "voice" | "forum" | "announcement";
  topic?: string;
  nsfw?: boolean;
  slowmode?: number;
  userLimit?: number;
}

export interface CategoryBlueprint {
  name: string;
  channels: ChannelBlueprint[];
}

export interface ServerBlueprint {
  id: number;
  userId: string;
  createdAt: string;
  serverName: string;
  description: string;
  roles: RoleBlueprint[];
  categories: CategoryBlueprint[];
  standaloneChannels: ChannelBlueprint[];
}

export interface ConversationMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface UserConversation {
  messages: ConversationMessage[];
  phase: "chatting" | "done";
  lastActivity: string;
}

export interface UserWarnings {
  count: number;
  lastWarning: string;
  timedOutUntil?: string;
}
