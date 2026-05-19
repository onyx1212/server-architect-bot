import {
  Guild,
  PermissionFlagsBits,
  ChannelType,
} from "discord.js";
import type { ServerBlueprint, ChannelBlueprint } from "./types.js";

const PERM_MAP: Record<string, bigint> = {
  ADMINISTRATOR: PermissionFlagsBits.Administrator,
  KICK_MEMBERS: PermissionFlagsBits.KickMembers,
  BAN_MEMBERS: PermissionFlagsBits.BanMembers,
  MANAGE_MESSAGES: PermissionFlagsBits.ManageMessages,
  MANAGE_CHANNELS: PermissionFlagsBits.ManageChannels,
  MANAGE_ROLES: PermissionFlagsBits.ManageRoles,
  VIEW_CHANNEL: PermissionFlagsBits.ViewChannel,
  SEND_MESSAGES: PermissionFlagsBits.SendMessages,
  READ_MESSAGE_HISTORY: PermissionFlagsBits.ReadMessageHistory,
  MUTE_MEMBERS: PermissionFlagsBits.MuteMembers,
  DEAFEN_MEMBERS: PermissionFlagsBits.DeafenMembers,
  MOVE_MEMBERS: PermissionFlagsBits.MoveMembers,
  MANAGE_NICKNAMES: PermissionFlagsBits.ManageNicknames,
};

function buildPermBits(perms: string[]): bigint {
  return perms.reduce((acc, p) => acc | (PERM_MAP[p] ?? 0n), 0n);
}

function channelTypeMap(type: string): ChannelType {
  switch (type) {
    case "voice": return ChannelType.GuildVoice;
    case "forum": return ChannelType.GuildForum;
    case "announcement": return ChannelType.GuildAnnouncement;
    default: return ChannelType.GuildText;
  }
}

export async function applyBlueprint(
  guild: Guild,
  blueprint: ServerBlueprint,
  progress: (msg: string) => Promise<void>
): Promise<void> {
  await progress("🔧 Creating roles...");

  for (const roleDef of blueprint.roles) {
    try {
      await guild.roles.create({
        name: roleDef.name,
        color: (roleDef.color as `#${string}`) || "#99AAB5",
        hoist: roleDef.hoist,
        mentionable: roleDef.mentionable,
        permissions: buildPermBits(roleDef.permissions),
      });
    } catch { /* skip */ }
  }

  await progress(`✅ Roles created. Building categories & channels...`);

  for (const cat of blueprint.categories) {
    try {
      const category = await guild.channels.create({
        name: cat.name,
        type: ChannelType.GuildCategory,
      });
      for (const ch of cat.channels) {
        await createChannel(guild, ch, category.id);
      }
    } catch { /* skip */ }
  }

  for (const ch of blueprint.standaloneChannels ?? []) {
    await createChannel(guild, ch, undefined);
  }

  await progress(`🎉 Server **${blueprint.serverName}** built successfully!`);
}

async function createChannel(guild: Guild, ch: ChannelBlueprint, parentId?: string) {
  try {
    await guild.channels.create({
      name: ch.name,
      type: channelTypeMap(ch.type),
      parent: parentId,
      topic: ch.topic,
      nsfw: ch.nsfw ?? false,
      rateLimitPerUser: ch.slowmode ?? 0,
      userLimit: ch.userLimit,
    });
  } catch { /* skip */ }
}

export async function cloneGuild(
  sourceGuild: Guild,
  targetGuild: Guild,
  progress: (msg: string) => Promise<void>
): Promise<void> {
  await progress("🔍 Reading source server structure...");
  await progress("🔧 Cloning roles...");

  const sortedRoles = [...sourceGuild.roles.cache.values()]
    .filter((r) => !r.managed && r.name !== "@everyone")
    .sort((a, b) => a.position - b.position);

  const roleMap = new Map<string, string>();
  for (const role of sortedRoles) {
    try {
      const newRole = await targetGuild.roles.create({
        name: role.name,
        color: role.color,
        hoist: role.hoist,
        mentionable: role.mentionable,
        permissions: role.permissions,
      });
      roleMap.set(role.id, newRole.id);
    } catch { /* skip */ }
  }

  await progress("📁 Cloning channels...");

  const categories = [...sourceGuild.channels.cache.values()]
    .filter((c) => c.type === ChannelType.GuildCategory)
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));

  const catMap = new Map<string, string>();
  for (const cat of categories) {
    try {
      const newCat = await targetGuild.channels.create({ name: cat.name, type: ChannelType.GuildCategory });
      catMap.set(cat.id, newCat.id);
    } catch { /* skip */ }
  }

  const channels = [...sourceGuild.channels.cache.values()]
    .filter((c) => c.type !== ChannelType.GuildCategory)
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));

  for (const ch of channels) {
    try {
      await targetGuild.channels.create({
        name: ch.name,
        type: ch.type as ChannelType,
        parent: ch.parentId ? catMap.get(ch.parentId) : undefined,
      });
    } catch { /* skip */ }
  }

  await progress("✅ Server cloned successfully!");
}
