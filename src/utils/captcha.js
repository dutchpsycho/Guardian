import { createCanvas } from 'canvas';
import { AttachmentBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } from 'discord.js';
import { readConfig } from './utils.js';

const config = readConfig();

export function createCaptchaEmbedAndButtons(captchaText, imageBuffer) {
    const attachment = new AttachmentBuilder(imageBuffer, { name: 'Guardian_Captcha.png' });

    const captchaEmbed = new EmbedBuilder()
        .setTitle('Captcha Verification')
        .setDescription('Please solve the captcha below to verify your account.')
        .setColor('#2F3136')
        .setImage('attachment://captcha.png')
        .setFooter({ text: config.captcha.footer });

    const submitButton = new ButtonBuilder()
        .setCustomId('verify_submit_captcha')
        .setLabel('Submit Captcha')
        .setStyle(ButtonStyle.Secondary);

    const actionRow = new ActionRowBuilder().addComponents(submitButton);
    return { captchaEmbed, attachment, actionRow };
}

export function createCaptcha() {
    const canvas = createCanvas(300, 150);
    const ctx = canvas.getContext('2d');
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()-_+=';
    let captchaText = '';

    for (let i = 0; i < config.captcha.length; i++) {
        captchaText += characters.charAt(Math.floor(Math.random() * characters.length));
    }

    ctx.fillStyle = '#2F3136';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < 200; i++) {
        ctx.fillStyle = `rgba(255,255,255,${Math.random()})`;
        ctx.beginPath();
        ctx.arc(Math.random() * canvas.width, Math.random() * canvas.height, Math.random() * 2, 0, Math.PI * 2);
        ctx.fill();
    }

    const fonts = ['bold 40px Arial', 'bold 40px Verdana', 'bold 40px Times New Roman', 'italic 35px Tahoma'];
    const positions = [];
    ctx.fillStyle = '#ffffff';

    for (let i = 0; i < captchaText.length; i++) {
        const x = 30 + i * 35;
        const y = 80 + Math.random() * 30 - 15;
        ctx.font = fonts[Math.floor(Math.random() * fonts.length)];
        ctx.fillText(captchaText[i], x, y);
        positions.push({ x, y });
    }

    ctx.strokeStyle = '#ff0000';
    ctx.lineWidth = 2;
    for (let i = 0; i < positions.length - 1; i++) {
        ctx.beginPath();
        ctx.moveTo(positions[i].x + 15, positions[i].y - 20);
        ctx.lineTo(positions[i + 1].x + 15, positions[i + 1].y - 20);
        ctx.stroke();
    }

    return { captchaText, imageBuffer: canvas.toBuffer() };
}