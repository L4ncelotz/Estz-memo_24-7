# Discord Gaming Highlights Bot

## Overview
This is a Discord bot that archives gaming highlights to Supabase storage and database. Users can share game clips, screenshots, and highlights from Discord, which are automatically uploaded to Supabase and organized by game and tags.

## Project Structure
- `src/index.js` - Main bot entry point with Discord client setup
- `src/commands/archive.js` - Command handler for archiving highlights (uses `!memo` prefix command)
- `src/utils/parser.js` - Utility to parse game, tags, and content from command messages
- `src/deploy-commands.js` - Script to deploy slash commands to Discord (not currently used, bot uses prefix commands)
- `server.js` - Express server to keep bot alive

## Current State
The bot is successfully running and connected to Discord as "Estz_Memory#2735". It uses:
- **Discord.js v14** for Discord API interactions
- **Supabase** for cloud storage and database
- **Prefix commands** with `!` prefix (e.g., `!memo`)

## How It Works
1. Users send a message in Discord with format: `!memo game:gamename tags:tag1,tag2 optional description`
2. Users attach media files (images, videos) to the message
3. The bot:
   - Downloads the media from Discord
   - Uploads it to Supabase storage bucket named `highlights`
   - Saves metadata to Supabase database table named `highlights`
   - Returns confirmation to the user

## Environment Variables
The following secrets are configured in Replit:
- `DISCORD_BOT_TOKEN` - Discord bot authentication token
- `DISCORD_CLIENT_ID` - Discord application client ID
- `DISCORD_GUILD_ID` - Discord server ID for command deployment
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_SERVICE_KEY` - Supabase service role key

## Supabase Requirements
The bot expects the following Supabase setup:
1. **Storage Bucket**: `highlights` (must be created in Supabase)
2. **Database Table**: `highlights` with columns:
   - `user_id` (text) - Discord user ID
   - `username` (text) - Discord username
   - `game` (text) - Game name
   - `tags` (array/text) - Tags for the highlight
   - `media_urls` (array/text) - Public URLs of uploaded media
   - `content` (text, nullable) - Optional description
   - `created_at` (timestamp) - Creation timestamp

## Workflow
The bot runs via the "Discord Bot" workflow which executes `node src/index.js` and displays console output.

## Recent Changes (October 12, 2025)
- Fixed Discord bot token environment variable (was using DISCORD_TOKEN, corrected to DISCORD_BOT_TOKEN)
- Added `.trim()` to Supabase credentials to prevent header errors
- Removed duplicate `keepAlive()` call
- Successfully deployed and running on Replit

## Known Issues
- Deprecation warning: Discord.js v15 will rename `ready` event to `clientReady`
- The `deploy-commands.js` script exists but the bot currently uses prefix commands instead of slash commands
