import dotenv from 'dotenv';
import { DiscordBot } from '@/Bot.js';
import { OrchestratorService } from '@/OrchestratorService.js';

dotenv.config();

const token = process.env.APP_DISCORD_TOKEN;
const clientId = process.env.APP_DISCORD_CLIENT_ID;
const orchestratorUrl = process.env.APP_AGENT_ORCHESTRATOR_URL;

if (!token || !clientId) {
  throw new Error('DISCORD_TOKEN and DISCORD_CLIENT_ID are required');
}

// TODO null-force until a clean configuration load exists
const orchestratorService = new OrchestratorService(orchestratorUrl!);
const enablePlainTextCommands = process.env.APP_ENABLE_PLAIN_TEXT_COMMANDS === 'true';
const bot = new DiscordBot(token, clientId, orchestratorService, enablePlainTextCommands);

bot.start().catch((error: unknown) => {
  console.error('Failed to start bot:', error);
  process.exit(1);
});
