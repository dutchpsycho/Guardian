import fs from 'fs';
import path from 'path';

const dataDir = path.resolve('./data');
const verificationFilePath = path.join(dataDir, 'verification.json');

function ensureDataFileExists() {
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }

    if (!fs.existsSync(verificationFilePath)) {
        fs.writeFileSync(verificationFilePath, JSON.stringify({ verificationMessageId: null }, null, 4), 'utf-8');
    }
}

export function loadVerificationData() {
    ensureDataFileExists();
    const fileData = fs.readFileSync(verificationFilePath, 'utf-8');
    const data = JSON.parse(fileData);
    return data.verificationMessageId || null;
}

export function saveVerificationData(messageId) {
    ensureDataFileExists();
    fs.writeFileSync(verificationFilePath, JSON.stringify({ verificationMessageId: messageId }, null, 4), 'utf-8');
}