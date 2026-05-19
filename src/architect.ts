import { chat } from "./ai.js";
import { saveBlueprint, setConversation, getConversation, deleteConversation } from "./storage.js";
import type { ServerBlueprint } from "./types.js";

const SYSTEM_PROMPT = `You are an expert Discord server architect. Your role is to help users design a complete, professional Discord server structure through friendly conversation.

Steps:
1. Ask what kind of server they want (gaming, community, business, study group, etc.)
2. Ask about the main topics or features they want
3. Ask about expected community size and culture
4. After gathering enough info (3-5 exchanges), generate a complete blueprint

When ready, output the blueprint as valid JSON wrapped EXACTLY like this:
<blueprint>
{
  "serverName": "...",
  "description": "...",
  "roles": [
    {"name": "...", "color": "#RRGGBB", "permissions": [], "hoist": true, "mentionable": false}
  ],
  "categories": [
    {
      "name": "...",
      "channels": [
        {"name": "...", "type": "text", "topic": "..."}
      ]
    }
  ],
  "standaloneChannels": []
}
</blueprint>

Role permission strings: "ADMINISTRATOR", "KICK_MEMBERS", "BAN_MEMBERS", "MANAGE_MESSAGES", "MANAGE_CHANNELS", "MANAGE_ROLES", "VIEW_CHANNEL", "SEND_MESSAGES", "READ_MESSAGE_HISTORY", "MUTE_MEMBERS", "DEAFEN_MEMBERS", "MOVE_MEMBERS", "MANAGE_NICKNAMES"
Channel types: "text", "voice", "forum", "announcement"
Make the structure detailed (8-15 roles, multiple categories). Respond in the SAME language the user writes in.`;

export async function handleDM(
  userId: string,
  userMessage: string
): Promise<{ reply: string; blueprint?: ServerBlueprint }> {
  let conv = getConversation(userId);

  if (!conv) {
    conv = {
      messages: [{ role: "system", content: SYSTEM_PROMPT }],
      phase: "chatting",
      lastActivity: new Date().toISOString(),
    };
  }

  conv.messages.push({ role: "user", content: userMessage });
  conv.lastActivity = new Date().toISOString();

  const response = await chat(conv.messages as Parameters<typeof chat>[0]);
  const blueprintMatch = response.match(/<blueprint>([\s\S]*?)<\/blueprint>/);
  let blueprint: ServerBlueprint | undefined;
  let replyText = response;

  if (blueprintMatch) {
    try {
      const raw = JSON.parse(blueprintMatch[1].trim());
      blueprint = saveBlueprint({
        userId,
        createdAt: new Date().toISOString(),
        serverName: raw.serverName ?? "My Server",
        description: raw.description ?? "",
        roles: raw.roles ?? [],
        categories: raw.categories ?? [],
        standaloneChannels: raw.standaloneChannels ?? [],
      });
      conv.phase = "done";
      replyText = response.replace(/<blueprint>[\s\S]*?<\/blueprint>/, "").trim();
      if (!replyText) replyText = `✅ Blueprint **#${blueprint.id}** created for **${blueprint.serverName}**!`;
      deleteConversation(userId);
    } catch {
      // JSON parse failed
    }
  } else {
    conv.messages.push({ role: "assistant", content: response });
    setConversation(userId, conv);
  }

  return { reply: replyText, blueprint };
}

export function formatBlueprintEmbed(bp: ServerBlueprint): string {
  const roleList = bp.roles.map((r) => `• **${r.name}**`).join("\n");
  const catList = bp.categories
    .map((c) => `📁 **${c.name}** (${c.channels.length} channels)`)
    .join("\n");

  return [
    `🏗️ **Blueprint #${bp.id} — ${bp.serverName}**`,
    `*${bp.description}*`,
    ``,
    `**Roles (${bp.roles.length}):**`,
    roleList || "None",
    ``,
    `**Categories (${bp.categories.length}):**`,
    catList || "None",
    ``,
    `📌 To apply: go to your server and type \`/apply ${bp.id}\``,
  ].join("\n");
}
