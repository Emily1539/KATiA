const fs = require('node:fs');
const path = require('node:path');
const util = require('node:util');

const { Client, GatewayIntentBits, Collection, ActivityType } = require('discord.js');
const OAI = require('openai');
require('dotenv').config();

const { KatiaDatabase } = require('./modules/database/index.js');
const { KatiaLogging } = require('./modules/logging/index.js');
const corelib = require('./modules/corelib/index.js');

const katiaDB = new KatiaDatabase({ filePath: './database.json.enc35' });
const katiaLOG = new KatiaLogging({ filePath: './katia.log' });

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });
let status = [false, false, false]
katiaLOG.log('Loading KATIA...');

client.commands = new Collection();
const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

katiaLOG.log('Handler...');
for (const folder of commandFolders) {
	const commandsPath = path.join(foldersPath, folder);
	const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
	for (const file of commandFiles) {
		const filePath = path.join(commandsPath, file);
		const command = require(filePath);
		if ('data' in command && 'execute' in command) {
			client.commands.set(command.data.name, command);
            katiaLOG.debug(`Załadowano komendę ${command.data.name}`);
		} else {
			katiaLOG.warn(`Uu, ${filePath} nie działa prawidłowo. Co źle zrobiłeś tym razem?`);
		}
	}
}
katiaLOG.log('Załadowano komendy');

client.once('ready', async () => {
    status[2] = true;
    katiaLOG.log(`Connected as ${client.user.tag}`);
    client.user.setPresence({
        activities: [{ name: `Nie ciebie. Won.`, type: ActivityType.Listening }],
        status: 'idle',
    });
    // client.user.setActivity();
});

client.on('messageCreate', async (m) => {
    // if (m.author.id !== '526711537373806592') return;
    const mentions = m.mentions.users;
    if (mentions.get(m.client.user.id) !== undefined) {
        return m.reply('wypierdalaj');
    }
});

client.once('debug', async (dbg) => {
    katiaLOG.debug(dbg);
});

client.on('raw', async (rw) => {
    katiaLOG.raw(JSON.stringify(rw));
});
katiaLOG.log('Waiting for katiaLOG...');
corelib.waitUntil(() => {
    return status[0];
}).then(() => {
    katiaLOG.log('Waiting for katiaDB...');
    corelib.waitUntil(() => {
        return status[1];
    }).then(() => {
        katiaLOG.log('Logging in...');
        client.login(process.env.DISCORD_TOKEN);
    });
});

client.on('messageCreate', async (m) => {
    katiaLOG.log(`${m.author.discriminator}: ${typeof m.author.discriminator}`);
});

globalThis.intervals = {};

globalThis.intervals.LOGinterval = setInterval(() => {
    status[0] = true;
    katiaLOG.loopOp(); // Make the logger join the event loop
}, 75);

globalThis.intervals.DBinterval = setInterval(() => {
    status[1] = true;
    katiaDB.loopOp(); // Make the database join the event loop
}, 25);

globalThis.intervals.DBSyncInterval = setInterval(() => {
    katiaDB.sync(); // Synchronise the database
}, 5000);

process.on('warning', async (warn) => {
    katiaLOG.warn(util.format(warn));
});

process.on('unhandledRejection', async (e) => {
    katiaLOG.error(util.format(e));
});

process.on('SIGINT', async () => {
    process.exit();
});

process.on('exit', async () => {
    katiaLOG.log('Shutting down discord connection...');
    client.destroy();
    corelib.waitUntil(() => {
        return client.state
    })
    katiaLOG.log('Closing down KatiaDB...');
    katiaLOG.log(`${katiaDB.close() ? 'OK' : 'NO'}`);
    katiaLOG.log('Closing down KatiaLOG...');
    katiaLOG.close();
    const z = new Date();
    process.stderr.write(`${z.getFullYear()}-${z.getMonth()}-${z.getDay()}-${z.getHours()}-${z.getMinutes()}-${z.getSeconds()}:${z.getMilliseconds()} | noKAT | LOG | KatiaLOG closed down.\n`);
    process.stderr.write(`${z.getFullYear()}-${z.getMonth()}-${z.getDay()}-${z.getHours()}-${z.getMinutes()}-${z.getSeconds()}:${z.getMilliseconds()} | noKAT | LOG | Bye.\n`);
});
