const { REST, Routes } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');
require('dotenv').config();

const commands = [];
const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);
const { KatiaLogging } = require('./modules/logging/index.js');

const katiaLOG = new KatiaLogging({ filePath: './deploy.log' });

globalThis.katiaLOGinterval = setInterval(() => {
    katiaLOG.loopOp();
}, 25);

for (const folder of commandFolders) {
	const commandsPath = path.join(foldersPath, folder);
	const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
	for (const file of commandFiles) {
		const filePath = path.join(commandsPath, file);
		const command = require(filePath);
		if ('data' in command && 'execute' in command) {
			commands.push(command.data.toJSON());
		} else {
			katiaLOG.warn(`Ups! Upuściłam ${filePath}!\n`);
		}
	}
}

const rest = new REST().setToken(process.env.DISCORD_TOKEN);

(async () => {
	try {
		katiaLOG.log(`Odświeżam ${commands.length} komend...`);

		const data = await rest.put(
			Routes.applicationApplicationCommands(clientId),
			{ body: commands },
		);

        process.stderr.write(' OK\n');
	} catch (error) {
		katiaLOG.log(`${commands.length} komend odświeżonych.`);
        setTimeout(() => {
            katiaLOG.debug('Logger is shutting down. Clearing array...');
            while (katiaLOG.toWrite.length !== 0) {
                katiaLOG.loopOp();
            };
            clearInterval(globalThis.katiaLOGinterval);
            katiaLOG.debug('Logger shut down successfully.');
            katiaLOG.loopOp();
        }, 250);
	}
})();
