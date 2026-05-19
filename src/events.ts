import { Message, Interaction, ChannelType, PermissionFlagsBits } from "discord.js";
import { moderate } from "./ai.js";
import { addWarning, getBlueprint, getUserBlueprints } from "./storage.js";
import { handleDM, formatBlueprintEmbed } from "./architect.js";
import { applyBlueprint, cloneGuild } from "./builder.js";

export async function onMessageCreate(message: Message) {
  if (message.author.bot) return;

  if (message.channel.type === ChannelType.DM) {
    try {
      await message.channel.sendTyping();
      const { reply, blueprint } = await handleDM(message.author.id, message.content);
      if (reply) await message.reply(reply.slice(0, 2000));
      if (blueprint) await message.channel.send(formatBlueprintEmbed(blueprint).slice(0, 2000));
    } catch (err) {
      console.error("DM error:", err);
      await message.reply("❌ An error occurred. Please try again!");
    }
    return;
  }

  if (!message.guild || !message.content || message.content.length < 2) return;

  try {
    const result = await moderate(message.content);
    if (!result.toxic) return;

    await message.delete().catch(() => null);
    const warnings = addWarning(message.guild.id, message.author.id);

    if (warnings.timedOutUntil) {
      const member = await message.guild.members.fetch(message.author.id).catch(() => null);
      if (member) await member.timeout(5 * 60 * 1000, "Auto-mod: repeated violations").catch(() => null);
      await message.channel.send(`⏰ <@${message.author.id}> has been timed out for 5 minutes for repeated violations!`).catch(() => null);
    } else {
      await message.channel.send(`⚠️ <@${message.author.id}> Warning **${warnings.count}/3** — your message was removed.`).catch(() => null);
    }
  } catch (err) {
    console.error("Moderation error:", err);
  }
}

export async function onInteractionCreate(interaction: Interaction) {
  if (!interaction.isChatInputCommand()) return;
  const { commandName } = interaction;

  if (commandName === "architect") {
    try {
      await (interaction.user as any).send(
        "👋 Hello! I'm your Discord server architect.\n\nTell me: what is the theme or purpose of the server you want to build?"
      );
      await interaction.reply({ content: "📬 Sent you a DM! Check your messages.", ephemeral: true });
    } catch {
      await interaction.reply({ content: "❌ Cannot send you a DM. Please enable DMs.", ephemeral: true });
    }
    return;
  }

  if (commandName === "blueprints") {
    const bps = getUserBlueprints(interaction.user.id);
    if (!bps.length) {
      await interaction.reply({ content: "📭 No blueprints yet. Use `/architect` to build one!", ephemeral: true });
      return;
    }
    const list = bps.map((bp) => `**#${bp.id}** — ${bp.serverName}`).join("\n");
    await interaction.reply({ content: `📋 **Your Blueprints:**\n${list}`, ephemeral: true });
    return;
  }

  if (commandName === "blueprint") {
    const id = interaction.options.getInteger("id", true);
    const bp = getBlueprint(id);
    if (!bp) { await interaction.reply({ content: `❌ Blueprint #${id} not found.`, ephemeral: true }); return; }
    await interaction.reply({ content: formatBlueprintEmbed(bp).slice(0, 2000), ephemeral: true });
    return;
  }

  if (commandName === "apply") {
    if (!interaction.guild) { await interaction.reply({ content: "❌ Server only.", ephemeral: true }); return; }
    const member = await interaction.guild.members.fetch(interaction.user.id).catch(() => null);
    if (!member?.permissions.has(PermissionFlagsBits.Administrator)) {
      await interaction.reply({ content: "❌ Need Administrator permission.", ephemeral: true }); return;
    }
    const id = interaction.options.getInteger("id", true);
    const bp = getBlueprint(id);
    if (!bp) { await interaction.reply({ content: `❌ Blueprint #${id} not found.`, ephemeral: true }); return; }

    await interaction.reply({ content: `🚀 Applying Blueprint **#${id} — ${bp.serverName}**...` });
    try {
      await applyBlueprint(interaction.guild, bp, async (msg) => { await interaction.followUp({ content: msg }); });
    } catch (err) {
      console.error("Apply error:", err);
      await interaction.followUp({ content: "❌ Error while building server." });
    }
    return;
  }

  if (commandName === "clone") {
    if (!interaction.guild) { await interaction.reply({ content: "❌ Server only.", ephemeral: true }); return; }
    const member = await interaction.guild.members.fetch(interaction.user.id).catch(() => null);
    if (!member?.permissions.has(PermissionFlagsBits.Administrator)) {
      await interaction.reply({ content: "❌ Need Administrator permission.", ephemeral: true }); return;
    }
    const sourceId = interaction.options.getString("server_id", true);
    const sourceGuild = interaction.client.guilds.cache.get(sourceId);
    if (!sourceGuild) { await interaction.reply({ content: "❌ Bot not in that server or invalid ID.", ephemeral: true }); return; }

    await interaction.reply({ content: `🔄 Cloning **${sourceGuild.name}** → **${interaction.guild.name}**...` });
    try {
      await cloneGuild(sourceGuild, interaction.guild, async (msg) => { await interaction.followUp({ content: msg }); });
    } catch (err) {
      console.error("Clone error:", err);
      await interaction.followUp({ content: "❌ Error while cloning." });
    }
  }
}
