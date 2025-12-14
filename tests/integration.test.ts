import { Client, Events, GatewayIntentBits, TextChannel } from 'discord.js';
import { DiscordBot } from '@/Bot.js';
import { MockOrchestratorService } from './mocks/MockOrchestratorService.js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const SUT_TOKEN = process.env.INTEGRATION_SUT_TOKEN;
const SUT_CLIENT_ID = process.env.INTEGRATION_SUT_CLIENT_ID;
const TESTER_TOKEN = process.env.INTEGRATION_TESTER_TOKEN;
const TEST_CHANNEL_ID = process.env.INTEGRATION_TEST_CHANNEL_ID;

if (!SUT_TOKEN || !SUT_CLIENT_ID || !TESTER_TOKEN || !TEST_CHANNEL_ID) {
  console.error('Missing environment variables: SUT_TOKEN, SUT_CLIENT_ID, TESTER_TOKEN, TEST_CHANNEL_ID');
  process.exit(1);
}

async function runTest() {
  const mockOrchestrator = new MockOrchestratorService();
  const sutBot = new DiscordBot(SUT_TOKEN!, SUT_CLIENT_ID!, mockOrchestrator, true);
  
  const testerClient = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
  });

  const responsePromise = new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Test timed out waiting for response'));
    }, 15000);

    testerClient.on(Events.MessageCreate, (message) => {
      if (message.channelId === TEST_CHANNEL_ID && message.author.id === SUT_CLIENT_ID && message.content.includes('✅ Task accepted')) {
        console.log('[Test] Success! Received confirmation from SUT.');
        clearTimeout(timeout);
        resolve();
      }
    });
  });

  console.log('[Test] Starting Tester Bot...');
  await testerClient.login(TESTER_TOKEN);

  console.log('[Test] Starting SUT...');
  await sutBot.start();

  try {
    const channel = await testerClient.channels.fetch(TEST_CHANNEL_ID!);
    if (channel instanceof TextChannel) {
      console.log('[Test] Sending !task command...');
      await channel.send('!task Run integration test');
    } else {
      throw new Error('Test channel is not a TextChannel or not found');
    }
  } catch (error) {
    console.error('Failed to send command:', error);
    process.exit(1);
  }

  await responsePromise;
}

runTest()
  .then(() => {
    console.log('Test Passed');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Test Failed:', err);
    process.exit(1);
  });
