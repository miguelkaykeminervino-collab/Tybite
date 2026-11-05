const {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder,
  ChannelType
} = require('discord.js');

const {
  joinVoiceChannel,
  getVoiceConnection,
  VoiceConnectionStatus,
  entersState
} = require('@discordjs/voice');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds
  ]
});

const commands = [
  new SlashCommandBuilder()
    .setName('callafk')
    .setDescription('Colocar o Tybite em uma call')
    .addStringOption(option =>
      option.setName('id')
        .setDescription('ID da call')
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName('sair')
    .setDescription('Retirar o Tybite da call'),

  new SlashCommandBuilder()
    .setName('status')
    .setDescription('Verificar se o Tybite está na call')
];

client.once('ready', async () => {
  console.log(`Tybite online: ${client.user.tag}`);

  const rest = new REST({ version: '10' })
    .setToken(process.env.TOKEN);

  await rest.put(
    Routes.applicationGuildCommands(
      client.user.id,
      process.env.GUILD_ID
    ),
    { body: commands.map(command => command.toJSON()) }
  );

  console.log('Comandos registrados!');
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'callafk') {
    const id = interaction.options.getString('id');
    const channel = await client.channels.fetch(id).catch(() => null);

    if (!channel || ![
      ChannelType.GuildVoice,
      ChannelType.GuildStageVoice
    ].includes(channel.type)) {
      return interaction.reply({
        content: 'ID de call inválido!',
        ephemeral: true
      });
    }

    const connection = joinVoiceChannel({
      channelId: channel.id,
      guildId: channel.guild.id,
      adapterCreator: channel.guild.voiceAdapterCreator,
      selfDeaf: true,
      selfMute: true
    });

    try {
      await entersState(connection, VoiceConnectionStatus.Ready, 15000);

      await interaction.reply('Tybite entrou na call! 🔊');
    } catch (error) {
      connection.destroy();

      await interaction.reply({
        content: 'Não consegui entrar na call. Verifique minhas permissões.',
        ephemeral: true
      });
    }
  }

  if (interaction.commandName === 'sair') {
    const connection = getVoiceConnection(interaction.guildId);

    if (connection) {
      connection.destroy();
      return interaction.reply('Tybite saiu da call! 👋');
    }

    return interaction.reply('Não estou em nenhuma call!');
  }

  if (interaction.commandName === 'status') {
    const connection = getVoiceConnection(interaction.guildId);

    return interaction.reply(
      connection
        ? 'Estou conectado à call! 🟢'
        : 'Não estou conectado a nenhuma call. 🔴'
    );
  }
});

client.login(process.env.TOKEN);
