import { Client, GatewayIntentBits } from 'discord.js';
import { initializeVerification, handleButtonInteraction, handleModalSubmit } from './verification.js';
import { commands, registerCommands } from './commands/deploy.js';
import { readConfig } from './utils/utils.js';

const config = readConfig();
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });

client.once('ready', async () => {
    console.log(`Logged in as ${client.user.tag}`);
    await registerCommands(client);
    await initializeVerification(client);
});

client.on('interactionCreate', async interaction => {
    if (interaction.isButton()) {
        await handleButtonInteraction(interaction);
    } else if (interaction.isModalSubmit()) {
        await handleModalSubmit(interaction);
    } else if (interaction.isCommand()) {
        const command = commands.find(cmd => cmd.data.name === interaction.commandName);
        if (command) {
            await command.execute(interaction);
        }
    }
});

client.login(config.bot.token);