import { Client, Events, GatewayIntentBits, REST, Routes, SlashCommandBuilder } from 'discord.js';
import type { Interaction, ChatInputCommandInteraction, Message } from 'discord.js';
import type { IOrchestratorService } from '@/OrchestratorService.js';

interface ReplyInterface {
  reply(content: string): Promise<void>;
}

export class DiscordBot {
  private readonly client: Client;
  private readonly token: string;
  private readonly clientId: string;
  private readonly orchestratorService: IOrchestratorService;
  private readonly rest: REST;
  private readonly enablePlainTextCommands: boolean;

  constructor(
    token: string, 
    clientId: string, 
    orchestratorService: IOrchestratorService,
    enablePlainTextCommands: boolean = false
  ) {
    this.token = token;
    this.clientId = clientId;
    this.orchestratorService = orchestratorService;
    this.enablePlainTextCommands = enablePlainTextCommands;

    const intents = [GatewayIntentBits.Guilds];
    if (this.enablePlainTextCommands) {
      intents.push(GatewayIntentBits.GuildMessages);
      intents.push(GatewayIntentBits.MessageContent);
    }

    this.client = new Client({ intents });

    this.rest = new REST({ version: '10' }).setToken(token);
    this.setupListeners();
  }

  private setupListeners(): void {
    this.client.once(Events.ClientReady, (readyClient) => {
      console.log(`Ready! Logged in as ${readyClient.user.tag}`);
    });

    this.client.on(Events.InteractionCreate, (interaction) => this.handleInteraction(interaction));

    if (this.enablePlainTextCommands) {
      this.client.on(Events.MessageCreate, (message) => this.handleMessage(message));
    }
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
      throw error; 
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

    await this.processTask(taskDescription, {
      reply: async (content) => {
        await interaction.editReply({ content });
      }
    });
  }

  private async handleMessage(message: Message): Promise<void> {
    if (message.author.id === this.client.user?.id) return;
    if (!message.content.startsWith('!task ')) return;

    const taskDescription = message.content.slice(6).trim();
    if (!taskDescription) return;

    await this.processTask(taskDescription, {
      reply: async (content) => {
        await message.reply(content);
      }
    });
  }

  private async processTask(taskDescription: string, replier: ReplyInterface): Promise<void> {
    try {
      const response = await this.orchestratorService.submitTask(taskDescription);

      if (response.status === 202) {
        await replier.reply(`✅ Task accepted and scheduled successfully!\n\
\
${taskDescription}\n\
\
`);
      } else {
        const errorText = await response.text().catch(() => 'Unknown error');
        const prefix = response.status >= 500 ? 'Server error' : 'Client error';
        await replier.reply(`❌ ${prefix} (${response.status}): Failed to schedule task.\n\
\
${errorText}\n\
\
`);
      }
    } catch (error) {
      console.error('Error submitting task:', error);
      await replier.reply(`❌ Failed to connect to task service: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  public async start(): Promise<void> {
    await this.registerCommands();
    await this.client.login(this.token);
  }
}
