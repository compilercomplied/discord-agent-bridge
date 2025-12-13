import dotenv from 'dotenv';
import { DiscordBot } from './Bot.js';
import { OrchestratorService } from './OrchestratorService.js';

dotenv.config();

const token = process.env.DISCORD_TOKEN;
const clientId = process.env.DISCORD_CLIENT_ID;
const orchestratorUrl = process.env.AGENT_ORCHESTRATOR_URL || 'http://agent-orchestrator:8080';

if (!token || !clientId) {
  throw new Error('DISCORD_TOKEN and DISCORD_CLIENT_ID are required');
}

const orchestratorService = new OrchestratorService(orchestratorUrl);
const bot = new DiscordBot(token, clientId, orchestratorService);

bot.start().catch((error: unknown) => {
  console.error('Failed to start bot:', error);
  process.exit(1);
});
