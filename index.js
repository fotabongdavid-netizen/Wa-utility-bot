const { default: makeWASocket, useMultiFileAuthState, delay } = require("@whiskeysockets/baileys");
const pino = require("pino");

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('session');
    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true,
        logger: pino({ level: 'silent' })
    });

    sock.ev.on('messages.upsert', async ({ messages }) => {
        const m = messages[0];
        if (!m.message) return;

        // --- 1. ANTI VIEW-ONCE ---
        // If someone sends a View-Once, the bot sends it back to YOU
        const msgType = Object.keys(m.message)[0];
        if (msgType === 'viewOnceMessageV2' || msgType === 'viewOnceMessageV2Extension') {
            console.log("View-Once detected! Sending to your chat...");
            const viewOnce = m.message[msgType].message;
            await sock.sendMessage(sock.user.id, { forward: m }, { quoted: m });
        }

        // --- 2. GHOST STATUS VIEW ---
        // Automatically views status updates without showing your name
        if (m.key.remoteJid === 'status@broadcast') {
            await sock.readMessages([m.key]);
        }
    });

    sock.ev.on('creds.update', saveCreds);
}

startBot();
      
