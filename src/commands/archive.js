// bot/src/commands/memo.js
const { parseHighlightMessage } = require('../utils/parser');
const fetch = require('node-fetch'); // <<< เพิ่มบรรทัดนี้

module.exports = {
    name: 'memo',
    description: 'Archives your highlight to the web gallery.',

    async execute(message, args, client) {
        const { game, tags, content } = parseHighlightMessage(args);

        if (!game || tags.length === 0) {
            return message.reply('Please specify a game and at least one tag (e.g., `!memo game:valorant tags:epic,clutch`).');
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
                const fileName = `${Date.now()}-${message.author.id}-${attachment.name}`; // ใช้ชื่อไฟล์เดิมจาก Discord
                const filePath = `highlights/${fileName}`; // Folder ใน Supabase Storage

                const { error: uploadError } = await client.supabase.storage
                    .from('highlights') // <<< ตรวจสอบว่าชื่อ bucket ตรงกัน
                    .upload(filePath, buffer, {
                        contentType: attachment.contentType || 'application/octet-stream',
                        upsert: true // อัปเดตถ้าชื่อซ้ำ
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
            media_urls: storedMediaUrls, // <<< ใช้ URL ที่อัปโหลดไป Supabase แล้ว
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
};