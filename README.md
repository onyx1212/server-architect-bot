# Discord Architect Bot 🏗️

An AI-powered Discord bot that acts as a server architect — designing complete server structures through DM conversations.

## Features

- **AI Server Architect** — DM the bot, it uses AI (OpenRouter + Groq fallback) to design a complete server blueprint with roles, categories, and channels
- **/apply \<id\>** — Apply a saved blueprint to your server instantly
- **/clone \<server_id\>** — Clone another server's structure
- **/blueprints** — View all your saved blueprints
- **Auto-moderation** — Groq AI monitors messages in real-time; detects toxicity, deletes messages, warns users (3 warnings = 5 min timeout)

## Setup

1. Clone this repo
2. Install dependencies: `npm install`
3. Copy `.env.example` to `.env` and fill in your tokens
4. Build: `npm run build`
5. Start: `npm start`

## Environment Variables

| Variable | Description |
|---|---|
| `DISCORD_BOT_TOKEN` | Your Discord bot token |
| `OPENROUTER_API_KEY` | OpenRouter API key (primary AI) |
| `GROQ_API_KEY` | Groq API key (fallback + moderation) |

## Bot Permissions Required

- Administrator (for building servers)
- Message Content Intent
- Server Members Intent

## Slash Commands

| Command | Description |
|---|---|
| `/architect` | Start DM with AI architect |
| `/apply <id>` | Apply blueprint to server |
| `/blueprints` | List your blueprints |
| `/blueprint <id>` | View blueprint details |
| `/clone <server_id>` | Clone a server's structure |
