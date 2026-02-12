import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logDir = path.join(__dirname, 'logs');

if (!fs.existsSync(logDir)) {
    try {
        fs.mkdirSync(logDir, { recursive: true });
    } catch (e) {
        console.error("Could not create logs directory", e);
    }
}

export function logHealth(message) {
    try {
        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] [HEALTH] ${message}\n`;
        fs.appendFileSync(path.join(logDir, 'health.log'), logMessage);
    } catch (e) {
        console.error("Failed to write to health log", e);
    }
}
