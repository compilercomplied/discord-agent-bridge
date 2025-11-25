# Discord Agent Bridge

A Discord bot that bridges Discord commands to an AI agent task scheduler.

## Features

- `/task` slash command to submit tasks to an AI agent
- Posts task descriptions to `localhost:8080/api/tasks`
- Provides user feedback on task acceptance/rejection
- Handles client errors (4xx), server errors (5xx), and connection failures

## Setup

### Prerequisites

- Node.js 18+ installed
- A Discord bot token and client ID
- An AI agent API running on `localhost:8080`

### Installation

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file from the example:
```bash
cp .env.example .env
```

3. Configure your `.env` file with your Discord credentials:
```
DISCORD_TOKEN=your_bot_token_here
DISCORD_CLIENT_ID=your_client_id_here
```

### Getting Discord Credentials

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Create a new application
3. Go to the "Bot" section and create a bot
4. Copy the bot token to `DISCORD_TOKEN`
5. Go to "OAuth2" section and copy the Application ID to `DISCORD_CLIENT_ID`
6. Invite the bot to your server with the `applications.commands` and `bot` scopes

## Usage

### Development Mode

```bash
npm run dev
```

### Production Mode

```bash
npm run build
npm start
```

## Commands

### `/task [description]`

Submits a task to the AI agent scheduler.

**Example:**
```
/task Analyze the latest sales data and create a summary report
```

**Responses:**
- ✅ Success (202): Task accepted and scheduled
- ❌ Client Error (4xx): Invalid request
- ❌ Server Error (5xx): Service error
- ❌ Connection Error: Cannot reach the task service

## API Integration

The bot sends POST requests to `http://localhost:8080/api/tasks` with the following format:

```json
{
  "task": "user task description"
}
```

Expected responses:
- `202 Accepted`: Task scheduled successfully
- `4xx`: Client error (invalid request)
- `5xx`: Server error (service unavailable)

## License

ISC
