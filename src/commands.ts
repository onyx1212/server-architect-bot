import { REST, Routes, SlashCommandBuilder } from "discord.js";

export const commands = [
  new SlashCommandBuilder()
    .setName("apply")
    .setDescription("Apply a saved server blueprint to this server")
    .addIntegerOption((opt) =>
      opt.setName("id").setDescription("Blueprint ID from DMs").setRequired(true)
    )
    .toJSON(),

  new SlashCommandBuilder()
    .setName("blueprints")
    .setDescription("View all your saved server blueprints")
    .toJSON(),

  new SlashCommandBuilder()
    .setName("blueprint")
    .setDescription("View details of a specific blueprint")
    .addIntegerOption((opt) =>
      opt.setName("id").setDescription("Blueprint ID").setRequired(true)
    )
    .toJSON(),

  new SlashCommandBuilder()
    .setName("clone")
    .setDescription("Clone another server's structure to this server")
    .addStringOption((opt) =>
      opt.setName("server_id").setDescription("Source server ID").setRequired(true)
    )
    .toJSON(),

  new SlashCommandBuilder()
    .setName("architect")
    .setDescription("Start a DM conversation with the AI server architect")
    .toJSON(),
];

export async function registerCommands(clientId: string, token: string) {
  const rest = new REST({ version: "10" }).setToken(token);
  try {
    await rest.put(Routes.applicationCommands(clientId), { body: commands });
    console.log("✅ Slash commands registered");
  } catch (err) {
    console.error("Failed to register commands:", err);
  }
}
