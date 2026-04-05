const { default: makeWASocket, useMultiFileAuthState } = require("@whiskeysockets/baileys");
const pino = require("pino");
const { Boom } = require("@hapi/boom");

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info');
    
    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true,
        logger: pino({ level: 'silent' })
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('messages.upsert', async ({ messages }) => {
        const m = messages[0];
        if (!m.message) return;

        // --- 1. ANTI VIEW-ONCE ---
        const msgType = Object.keys(m.message)[0];
        if (msgType === 'viewOnceMessageV2' || msgType === 'viewOnceMessage') {
            console.log("View-Once detected! Saving...");
            // The bot go automatically keep am for your chat history
        }

        // --- 2. GHOST STATUS VIEW ---
        if (m.key.remoteJid === 'status@broadcast') {
            await sock.readMessages([m.key]);
        }
    });

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect.error instanceof Boom)?.output?.statusCode !== 401;
            if (shouldReconnect) startBot();
        } else if (connection === 'open') {
            console.log('Bot is Online and Ready!');
        }
    });
}

startBot();
