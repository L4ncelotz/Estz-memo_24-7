// bot/src/index.js (ปรับปรุงสำหรับ Prefix Commands)
require('dotenv').config();
const keepAlive = require('./server.js');
keepAlive();
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const { createClient } = require('@supabase/supabase-js');
const fs = require('node:fs');
const path = require('node:path');

// ตรวจสอบว่ามี .env variables ที่จำเป็นหรือไม่
if (!process.env.DISCORD_BOT_TOKEN || !process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
    console.error("Missing required environment variables. Please check your .env file.");
    process.exit(1);
}

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.DirectMessages,
        // สำคัญ: ต้องเพิ่ม MessageContent เพื่อให้บอทอ่านเนื้อหาข้อความได้
        GatewayIntentBits.MessageContent,
    ],
});

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

// กำหนด prefix สำหรับคำสั่งของคุณ
const prefix = '!'; // คุณสามารถเปลี่ยนเป็นอย่างอื่นได้ เช่น '.' หรือ 'เก็บ'

client.commands = new Collection();
client.supabase = supabase;

// โหลด Commands (สำหรับ Prefix Commands)
// เราจะสร้างโฟลเดอร์ commands/ และวางไฟล์ command logic ไว้ที่นั่น
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    // Prefix commands ไม่ได้ใช้ 'data' แต่ใช้ 'name' และ 'execute'
    if ('name' in command && 'execute' in command) {
        client.commands.set(command.name, command);
    } else {
        console.log(`[WARNING] The command at ${filePath} is missing a required "name" or "execute" property.`);
    }
}

client.once('ready', () => {
    console.log(`Ready! Logged in as ${client.user.tag}`);
});

// Event Listener สำหรับ Prefix Commands (messageCreate)
client.on('messageCreate', async message => {
    // เพิกเฉยข้อความจากบอทอื่น และข้อความที่ไม่ได้ขึ้นต้นด้วย prefix
    if (message.author.bot || !message.content.startsWith(prefix)) return;

    // แยกคำสั่งและ arguments
    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();

    const command = client.commands.get(commandName);

    if (!command) {
        // ถ้าไม่พบคำสั่ง อาจจะไม่ต้องตอบกลับ หรือตอบกลับว่าไม่รู้จักคำสั่ง
        // message.reply(`Unknown command: \`${commandName}\``);
        return;
    }

    try {
        // ส่ง message และ args ไปยัง command execute function
        await command.execute(message, args, client);
    } catch (error) {
        console.error(error);
        message.reply('There was an error while executing this command!');
    }
});


client.login(process.env.DISCORD_BOT_TOKEN);