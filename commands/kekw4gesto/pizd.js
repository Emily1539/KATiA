const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('pizd')
		.setDescription('pizd'),
	async execute(interaction) {
		return interaction.reply('pizda');
	},
};
