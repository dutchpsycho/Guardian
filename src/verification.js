import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } from 'discord.js';
import { createCaptcha, createCaptchaEmbedAndButtons } from './utils/captcha.js';
import { loadVerificationData, saveVerificationData } from './utils/data.js';
import { readConfig } from './utils/utils.js';

const config = readConfig();
const userCaptchas = new Map();

export async function initializeVerification(client, overrideChannelId = null) {
    const savedMessageId = loadVerificationData();
    const verificationChannelId = overrideChannelId || config.channels.verification;

    try {
        const guild = client.guilds.cache.get(config.server.guild_id);
        if (!guild) {
            console.error('Guild not found.');
            return;
        }

        const channel = await client.channels.fetch(verificationChannelId);
        if (!channel || !channel.isTextBased()) {
            console.error(`Verification channel not found: ${verificationChannelId}`);
            return;
        }

        if (savedMessageId) {
            try {
                const existingMessage = await channel.messages.fetch(savedMessageId);
                reattachCollector(existingMessage);
                console.log(`Reattached to existing verification message in #${channel.name}`);
                return;
            } catch (error) {
                console.error('Verification message not found, sending a new one.');
            }
        }

        const embed = new EmbedBuilder()
            .setTitle('HYDRA VERIFICATION')
            .setDescription('Click the button below to get verified!')
            .setColor('#2F3136');

        const verifyButton = new ButtonBuilder()
            .setCustomId('verify_start_verification')
            .setLabel('Verify')
            .setStyle(ButtonStyle.Primary);

        const actionRow = new ActionRowBuilder().addComponents(verifyButton);

        const message = await channel.send({ embeds: [embed], components: [actionRow] });

        saveVerificationData(message.id);
        reattachCollector(message);

        console.log(`Sent new verification message in -> #${channel.name}`);
    } catch (error) {
        console.error(`❌ Error sending verification message:`, error);
    }
}

function reattachCollector(message) {
    const collector = message.createMessageComponentCollector({ componentType: 'BUTTON', time: 10 * 60 * 1000 });

    collector.on('collect', async interaction => {
        if (interaction.customId.startsWith('verify_')) {
            await handleButtonInteraction(interaction);
        }
    });

    collector.on('end', collected => {
        console.log(`Verification collector ended with ${collected.size} interactions.`);
    });
}

export async function handleButtonInteraction(interaction) {
    const guild = interaction.guild;
    if (guild.id !== config.server.guild_id) {
        await interaction.reply({ content: 'Verification is only available in the HYDRA server.', ephemeral: true });
        return;
    }

    const member = guild.members.cache.get(interaction.user.id);
    if (!member) {
        await interaction.reply({ content: 'Unable to fetch your member data. Please try again.', ephemeral: true });
        return;
    }

    const verificationRole = guild.roles.cache.get(config.server.verification_role_id);
    if (!verificationRole) {
        await interaction.reply({ content: 'Verification role not found. Please contact an admin.', ephemeral: true });
        return;
    }

    if (member.roles.cache.has(verificationRole.id)) {
        await interaction.reply({ content: `You're already verified.`, ephemeral: true });
        return;
    }

    if (interaction.customId === 'verify_start_verification') {
        const { captchaText, imageBuffer } = createCaptcha();
        const { captchaEmbed, attachment, actionRow } = createCaptchaEmbedAndButtons(captchaText, imageBuffer);

        userCaptchas.set(interaction.user.id, { captchaText, timestamp: Date.now() });

        await interaction.reply({ embeds: [captchaEmbed], files: [attachment], components: [actionRow], ephemeral: true });
    } else if (interaction.customId === 'verify_submit_captcha') {
        const modal = new ModalBuilder()
            .setCustomId('verify_captcha_modal')
            .setTitle('Captcha Verification');

        const captchaInput = new TextInputBuilder()
            .setCustomId('captcha_input')
            .setLabel('Enter the captcha text')
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
            .setPlaceholder('e.g., A1B2C3');

        const firstActionRow = new ActionRowBuilder().addComponents(captchaInput);
        modal.addComponents(firstActionRow);

        await interaction.showModal(modal);
    }
}

export async function handleModalSubmit(interaction) {
    if (interaction.customId !== 'verify_captcha_modal') return;

    const userId = interaction.user.id;
    const guild = interaction.guild;

    if (guild.id !== config.server.guild_id) {
        await interaction.reply({ content: 'Captcha verification is only available in the HYDRA server.', ephemeral: true });
        return;
    }

    const storedData = userCaptchas.get(userId);
    if (!storedData) {
        await interaction.reply({ content: 'Captcha has expired or was not generated. Please try verifying again.', ephemeral: true });
        return;
    }

    const { captchaText } = storedData;
    const userInput = interaction.fields.getTextInputValue('captcha_input').trim();

    if (userInput === captchaText) {
        userCaptchas.delete(userId);

        const member = guild.members.cache.get(userId);
        const verificationRole = guild.roles.cache.get(config.server.verification_role_id);

        if (!verificationRole) {
            await interaction.reply({ content: 'Verification role not found. Please contact an admin.', ephemeral: true });
            return;
        }

        try {
            await member.roles.add(verificationRole);
            await interaction.reply({ content: `You've been verified, welcome to HYDRA!`, ephemeral: true });
            console.log(`User ${userId} has been verified.`);
        } catch (error) {
            console.error('Error assigning role:', error);
            await interaction.reply({ content: 'Failed to assign role. Please contact an admin.', ephemeral: true });
        }

    } else {
        await interaction.reply({ content: 'Incorrect captcha. Please try again.', ephemeral: true });
        console.log(`User ${userId} entered incorrect captcha.`);
    }
}