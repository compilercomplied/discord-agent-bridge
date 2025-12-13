import { Client, Events, GatewayIntentBits, REST, Routes, SlashCommandBuilder } from 'discord.js';
import type { Interaction, ChatInputCommandInteraction } from 'discord.js';
import type { IOrchestratorService } from './OrchestratorService.js';

export class DiscordBot {
  private readonly client: Client;
  private readonly token: string;
  private readonly clientId: string;
  private readonly orchestratorService: IOrchestratorService;
  private readonly rest: REST;

  constructor(token: string, clientId: string, orchestratorService: IOrchestratorService) {
    this.token = token;
    this.clientId = clientId;
    this.orchestratorService = orchestratorService;

    this.client = new Client({
      intents: [GatewayIntentBits.Guilds],
    });

    this.rest = new REST({ version: '10' }).setToken(token);
    this.setupListeners();
  }

  private setupListeners(): void {
    this.client.once(Events.ClientReady, (readyClient) => {
      console.log(`Ready! Logged in as ${readyClient.user.tag}`);
    });

    this.client.on(Events.InteractionCreate, (interaction) => this.handleInteraction(interaction));
  }

  private getCommands() {
    return [
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
  }

  private async registerCommands(): Promise<void> {
    try {
      console.log('Started refreshing application (/) commands.');
      await this.rest.put(
        Routes.applicationCommands(this.clientId),
        { body: this.getCommands() },
      );
      console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
      console.error('Error registering commands:', error);
      throw error; // Re-throw to handle it in start() if needed
    }
  }

  private async handleInteraction(interaction: Interaction): Promise<void> {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'task') {
      await this.handleTaskCommand(interaction);
    }
  }

  private async handleTaskCommand(interaction: ChatInputCommandInteraction): Promise<void> {
    const taskDescription = interaction.options.getString('description', true);
    await interaction.deferReply();

    try {
      const response = await this.orchestratorService.submitTask(taskDescription);

      if (response.status === 202) {
        await interaction.editReply({
          content: `✅ Task accepted and scheduled successfully!\n\
\
${taskDescription}\n\
\
`,
        });
      } else {
        const errorText = await response.text().catch(() => 'Unknown error');
        const prefix = response.status >= 500 ? 'Server error' : 'Client error';
        await interaction.editReply({
          content: `❌ ${prefix} (${response.status}): Failed to schedule task.\n\
\
${errorText}\n\
\
`,
        });
      }
    } catch (error) {
      console.error('Error submitting task:', error);
      await interaction.editReply({
        content: `❌ Failed to connect to task service: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    }
  }

  public async start(): Promise<void> {
    await this.registerCommands();
    await this.client.login(this.token);
  }
}