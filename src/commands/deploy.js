import { REST, Routes, SlashCommandBuilder } from 'discord.js';
import { updateConfig, readConfig } from '../utils/utils.js';
import { loadVerificationData, saveVerificationData } from '../utils/data.js';
import { initializeVerification } from '../verification.js';

const config = readConfig();

/**
 * Checks if the user has one of the whitelisted roles.
 * @param {Interaction} interaction
 * @returns {boolean} True if the user has permission, false otherwise.
 */
function hasPermission(interaction) {
    const memberRoles = interaction.member.roles.cache;
    const whitelistedRoles = config.permissions.whitelisted_roles || [];

    return whitelistedRoles.some(roleId => memberRoles.has(roleId));
}

const commands = [
    {
        data: new SlashCommandBuilder()
            .setName('setchannel')
            .setDescription('Set the verification channel')
            .addStringOption(option =>
                option.setName('channel_id')
                    .setDescription('The ID of the verification channel')
                    .setRequired(true)),
        execute: async (interaction) => {
            if (!hasPermission(interaction)) {
                return interaction.reply({ content: "❌ You do not have permission to use this command.", ephemeral: true });
            }

            const channelId = interaction.options.getString('channel_id');
            updateConfig('channels', 'verification', channelId);
            await interaction.reply({ content: `✅ Verification channel set to <#${channelId}>.`, ephemeral: true });
        }
    },
    {
        data: new SlashCommandBuilder()
            .setName('setrole')
            .setDescription('Set the verification role')
            .addStringOption(option =>
                option.setName('role_id')
                    .setDescription('The ID of the verification role')
                    .setRequired(true)),
        execute: async (interaction) => {
            if (!hasPermission(interaction)) {
                return interaction.reply({ content: "❌ You do not have permission to use this command.", ephemeral: true });
            }

            const roleId = interaction.options.getString('role_id');
            updateConfig('server', 'verification_role_id', roleId);
            await interaction.reply({ content: `✅ Verification role set.`, ephemeral: true });
        }
    },
    {
        data: new SlashCommandBuilder()
            .setName('settimeout')
            .setDescription('Set captcha timeout (in seconds)')
            .addIntegerOption(option =>
                option.setName('seconds')
                    .setDescription('Timeout duration in seconds')
                    .setRequired(true)),
        execute: async (interaction) => {
            if (!hasPermission(interaction)) {
                return interaction.reply({ content: "❌ You do not have permission to use this command.", ephemeral: true });
            }

            const timeout = interaction.options.getInteger('seconds');
            updateConfig('captcha', 'timeout', timeout);
            await interaction.reply({ content: `✅ Captcha timeout set to ${timeout} seconds.`, ephemeral: true });
        }
    },
    {
        data: new SlashCommandBuilder()
            .setName('setlength')
            .setDescription('Set captcha length')
            .addIntegerOption(option =>
                option.setName('length')
                    .setDescription('Number of characters in captcha')
                    .setRequired(true)),
        execute: async (interaction) => {
            if (!hasPermission(interaction)) {
                return interaction.reply({ content: "❌ You do not have permission to use this command.", ephemeral: true });
            }

            const length = interaction.options.getInteger('length');
            updateConfig('captcha', 'length', length);
            await interaction.reply({ content: `✅ Captcha length set to ${length}.`, ephemeral: true });
        }
    },
    {
        data: new SlashCommandBuilder()
            .setName('setfooter')
            .setDescription('Set captcha embed footer')
            .addStringOption(option =>
                option.setName('text')
                    .setDescription('Footer text for embed')
                    .setRequired(true)),
        execute: async (interaction) => {
            if (!hasPermission(interaction)) {
                return interaction.reply({ content: "❌ You do not have permission to use this command.", ephemeral: true });
            }

            const text = interaction.options.getString('text');
            updateConfig('captcha', 'footer', text);
            await interaction.reply({ content: `✅ Captcha footer updated.`, ephemeral: true });
        }
    },
    {
        data: new SlashCommandBuilder()
            .setName('override')
            .setDescription('Resend the verification message in the current or a new channel')
            .addStringOption(option =>
                option.setName('channel_id')
                    .setDescription('The ID of the new channel (optional)')
                    .setRequired(false)),
        execute: async (interaction) => {
            if (!hasPermission(interaction)) {
                return interaction.reply({ content: "❌ You do not have permission to use this command.", ephemeral: true });
            }

            const guild = interaction.guild;
            const newChannelId = interaction.options.getString('channel_id') || config.channels.verification;
            const savedMessageId = loadVerificationData();

            try {
                const channel = await guild.channels.fetch(newChannelId);
                if (!channel || !channel.isTextBased()) {
                    return interaction.reply({ content: `❌ Invalid channel ID.`, ephemeral: true });
                }

                if (savedMessageId) {
                    try {
                        const oldChannel = await guild.channels.fetch(config.channels.verification);
                        if (oldChannel) {
                            const oldMessage = await oldChannel.messages.fetch(savedMessageId);
                            if (oldMessage) {
                                await oldMessage.delete();
                                console.log('✅ Deleted old verification message.');
                            }
                        }
                    } catch (error) {
                        console.warn('⚠️ Could not delete old verification message.');
                    }
                }

                updateConfig('channels', 'verification', newChannelId);
                await initializeVerification(interaction.client, newChannelId);
                await interaction.reply({ content: `✅ Verification message sent to <#${newChannelId}>.`, ephemeral: true });

            } catch (error) {
                console.error(error);
                await interaction.reply({ content: `❌ Failed to override verification message.`, ephemeral: true });
            }
        }
    }
];

export async function registerCommands(client) {
    try {
        const rest = new REST({ version: '10' }).setToken(config.bot.token);
        await rest.put(
            Routes.applicationGuildCommands(config.bot.app_id, config.server.guild_id),
            { body: commands.map(cmd => cmd.data.toJSON()) }
        );
        console.log('Registered application (/) commands');
    } catch (error) {
        console.error('❌ Error registering commands:', error);
    }
}

export { commands };