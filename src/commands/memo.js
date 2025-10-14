// bot/src/commands/memo.js (เปลี่ยนชื่อจาก archive.js)
const { parseHighlightMessage } = require('../utils/parser');
const fetch = require('node-fetch');

module.exports = {
    name: 'memo', // <-- ชื่อคำสั่งหลักคือ 'memo'
    description: 'Manages your highlights (archive, view, help).', // <-- เปลี่ยนคำอธิบายให้ครอบคลุม

    async execute(message, args, client) {
        // ตรวจสอบ Subcommand
        const subcommand = args[0] ? args[0].toLowerCase() : null;

        if (subcommand === 'help') {
            return this.sendHelpMessage(message); // เรียกใช้ฟังก์ชันส่งข้อความช่วยเหลือ
        }

        if (subcommand === 'view') {
            return this.sendViewMessage(message); // เรียกใช้ฟังก์ชันส่ง URL แกลเลอรี
        }
        
        // ถ้าไม่มี subcommand หรือไม่ใช่ 'help'/'view' ให้ดำเนินการ archiving ตามปกติ
        // ตัด subcommand ตัวแรกออกจาก args เพื่อให้ parseHighlightMessage ทำงานได้ถูกต้อง
        const archiveArgs = subcommand ? args.slice(1) : args; 

        const { game, tags, content } = parseHighlightMessage(archiveArgs);

        if (!game || tags.length === 0) {
            // ถ้าไม่มี game หรือ tags และไม่มี media attachment 
            // ให้แนะนำวิธีใช้ หรือส่งข้อความ help
            if (message.attachments.size === 0) {
                 return message.reply(
                    'Please specify a game and at least one tag (e.g., `!memo game:valorant tags:epic,clutch [optional_content]`) ' +
                    'and attach a media file. Use `!memo help` for more options.'
                );
            }
            // ถ้ามี attachment แต่ไม่มี game/tags ก็ให้แนะนำเหมือนเดิม
            return message.reply(
                'Please specify a game and at least one tag (e.g., `!memo game:valorant tags:epic,clutch [optional_content]`).'
            );
        }

        const discordAttachments = message.attachments.values();
        const storedMediaUrls = [];

        for (const attachment of discordAttachments) {
            try {
                const response = await fetch(attachment.url);
                if (!response.ok) {
                    console.error(`Failed to fetch attachment from Discord: ${attachment.url} - ${response.statusText}`);
                    continue;
                }
                const buffer = await response.buffer();
                const fileName = `${Date.now()}-${message.author.id}-${attachment.name}`;
                const filePath = `highlights/${fileName}`;

                const { error: uploadError } = await client.supabase.storage
                    .from('highlights')
                    .upload(filePath, buffer, {
                        contentType: attachment.contentType || 'application/octet-stream',
                        upsert: true
                    });

                if (uploadError) {
                    console.error('Supabase Storage upload error:', uploadError);
                    continue;
                }

                const { data: publicUrlData } = client.supabase.storage
                    .from('highlights')
                    .getPublicUrl(filePath);

                if (publicUrlData && publicUrlData.publicUrl) {
                    storedMediaUrls.push(publicUrlData.publicUrl);
                } else {
                    console.error('Failed to get public URL for:', filePath);
                }

            } catch (error) {
                console.error('Error processing media attachment:', error);
                message.channel.send(`Error processing one of your media files: ${attachment.name}`);
            }
        }

        if (storedMediaUrls.length === 0) {
            return message.reply('No media attachments were successfully processed for archiving. Please ensure you attached a valid file.');
        }

        const highlightData = {
            user_id: message.author.id,
            username: message.author.username,
            game: game,
            tags: tags,
            media_urls: storedMediaUrls,
            content: content || null,
            created_at: new Date(),
        };

        try {
            const { error } = await client.supabase
                .from('highlights')
                .insert([highlightData]);

            if (error) {
                console.error('Error inserting highlight into Supabase:', error.message);
                return message.reply('Failed to save highlight to the archive. Please try again.');
            }

            return message.reply(`Your highlight for **${game}** has been archived!`);

        } catch (err) {
            console.error('Unexpected error while saving highlight:', err);
            return message.reply('An unexpected error occurred.');
        }
    },

    // --- เพิ่มฟังก์ชันสำหรับ Subcommand ที่นี่ ---

    sendHelpMessage(message) {
        let helpMessage = 
            '**!memo Commands:**\n\n' +
            '`!memo game:<game_name> tags:<tag1,tag2> [optional_content] ตัวอย่าง !memo game:valorant tags:stupid [ไอไปท์ตายโง่]` (Attach media files)\n' +
            '  *Archives your highlight to the web gallery.*\n\n' +
            '`!memo view`\n' +
            '  *Shows the web gallery URL to view your archived highlights.*\n\n' +
            '`!memo help`\n' +
            '  *Shows this help message.*\n';
        
        message.channel.send(helpMessage);
    },

    sendViewMessage(message) {
        // คุณจะต้องแทนที่ URL นี้ด้วย URL จริงของเว็บแกลเลอรีของคุณ
        const galleryUrl = process.env.WEB_GALLERY_URL || 'https://estz-frontend-kowd.vercel.app/'; 
        message.reply(`You can view your archived highlights here: ${galleryUrl}`);
    }
};