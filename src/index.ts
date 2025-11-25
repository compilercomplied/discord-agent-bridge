import { Client, Events, GatewayIntentBits, REST, Routes, SlashCommandBuilder } from 'discord.js';
import dotenv from 'dotenv';

dotenv.config();

const token = process.env.DISCORD_TOKEN;
const clientId = process.env.DISCORD_CLIENT_ID;

if (!token) {
  throw new Error('DISCORD_TOKEN environment variable is required');
}

if (!clientId) {
  throw new Error('DISCORD_CLIENT_ID environment variable is required');
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

const commands = [
  new SlashCommandBuilder()
    .setName('task')
    .setDescription('Submit a task to the AI agent')
    .addStringOption(option =>
      option
        .setName('description')
        .setDescription('The task description')
        .setRequired(true)
    ),
].map(command => command.toJSON());

const rest = new REST({ version: '10' }).setToken(token);

async function registerCommands() {
  if (!clientId) {
    throw new Error('DISCORD_CLIENT_ID is required for registering commands');
  }

  try {
    console.log('Started refreshing application (/) commands.');

    await rest.put(
      Routes.applicationCommands(clientId),
      { body: commands },
    );

    console.log('Successfully reloaded application (/) commands.');
  } catch (error) {
    console.error('Error registering commands:', error);
  }
}

client.once(Events.ClientReady, (readyClient) => {
  console.log(`Ready! Logged in as ${readyClient.user.tag}`);
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'task') {
    const taskDescription = interaction.options.getString('description', true);

    await interaction.deferReply();

    try {
      const response = await fetch('http://localhost:8080/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ task: taskDescription }),
      });

      if (response.status === 202) {
        await interaction.editReply({
          content: `✅ Task accepted and scheduled successfully!\n\`\`\`\n${taskDescription}\n\`\`\``,
        });
      } else if (response.status >= 400 && response.status < 500) {
        const errorText = await response.text().catch(() => 'Unknown error');
        await interaction.editReply({
          content: `❌ Client error (${response.status}): Failed to schedule task.\n\`\`\`\n${errorText}\n\`\`\``,
        });
      } else if (response.status >= 500) {
        const errorText = await response.text().catch(() => 'Unknown error');
        await interaction.editReply({
          content: `❌ Server error (${response.status}): The task service encountered an error.\n\`\`\`\n${errorText}\n\`\`\``,
        });
      } else {
        await interaction.editReply({
          content: `⚠️ Unexpected response (${response.status}): Task may not have been scheduled properly.`,
        });
      }
    } catch (error) {
      console.error('Error submitting task:', error);
      await interaction.editReply({
        content: `❌ Failed to connect to task service: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    }
  }
});

async function main() {
  await registerCommands();
  await client.login(token);
}

main().catch(console.error);
