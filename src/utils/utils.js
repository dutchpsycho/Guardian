import fs from 'fs';
import toml from 'toml';
import tomlStringify from '@iarna/toml';
import path from 'path';

const configPath = path.resolve('config.toml');

export function readConfig() {
    if (!fs.existsSync(configPath)) {
        console.error('Config file not found.');
        process.exit(1);
    }
    const configContent = fs.readFileSync(configPath, 'utf-8');
    return toml.parse(configContent);
}

export function updateConfig(section, key, value) {
    let config = readConfig();
    
    if (!config[section]) {
        config[section] = {};
    }
    
    config[section][key] = value;

    fs.writeFileSync(configPath, tomlStringify.stringify(config), 'utf-8');
}