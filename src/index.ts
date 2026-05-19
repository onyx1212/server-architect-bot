import { Client, GatewayIntentBits, Partials } from "discord.js";
import { registerCommands } from "./commands.js";
import { onMessageCreate } from "./events.js";
import { onInteractionCreate } from "./events.js";

const token = process.env["DISCORD_BOT_TOKEN"];
if (!token) throw new Error("DISCORD_BOT_TOKEN is required");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildModeration,
  ],
  partials: [Partials.Channel, Partials.Message],
});

client.once("ready", async (c) => {
  console.log(`✅ Bot ready: ${c.user.tag}`);
  await registerCommands(c.user.id, token);
});

client.on("messageCreate", onMessageCreate);
client.on("interactionCreate", onInteractionCreate);
client.on("error", (err) => console.error("Discord error:", err));

client.login(token);
