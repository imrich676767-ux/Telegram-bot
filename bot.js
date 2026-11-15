const { Telegraf, Markup } = require('telegraf');
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const BOT_TOKEN = '9073859818:AAHmR9hznAuewrPPgVRp-lKkG--EU-9nkfk';
const ADMIN_ID = 8874434128; // Admin ID របស់អ្នក

if (!BOT_TOKEN) {
  console.error('Error: BOT_TOKEN is missing! ❌');
  process.exit(1);
}

const bot = new Telegraf(BOT_TOKEN);
const app = express();
const PORT = process.env.PORT || 3000;

// រៀបចំ SQLite Database (ប្តូរពី keys មកជា scripts)
const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) console.error('Database error:', err.message);
  else console.log('Connected to SQLite database successfully. ✅');
});

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS scripts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    file_id TEXT UNIQUE NOT NULL,
    package_type TEXT NOT NULL,
    status TEXT DEFAULT 'available',
    sold_to INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
});

// Express Server (ការពារ Render Sleep)
app.get('/', (req, res) => {
  res.send('Telegram Bot is running 24/7! 🚀');
});

app.listen(PORT, () => {
  console.log(`Web server is listening on port ${PORT}`);
});

// ហ្វេសម៉ឺនុយដើម (Start)
bot.start((ctx) => {
  return ctx.reply(
    'សួស្តី! សូមស្វាគមន៍មកកាន់ហាងលក់ Script Skin ស្វ័យប្រវត្តិតាម KHQR ២៤ម៉ោង。\nសូមជ្រើសរើសជម្រើសខាងក្រោម៖',
    Markup.keyboard([
      ['🛍️ ទិញ Script Skin', '📦 ពិនិត្យការបញ្ជាទិញ'],
      ['ℹ️ ជំនួយ / ទំនាក់ទំនង', '⚙️ Admin Panel']
    ]).resize()
  );
});

// ពេលអតិថិជនចុច "🛍️ ទិញ Script Skin"
bot.hears('🛍️ ទិញ Script Skin', (ctx) => {
  ctx.reply('សូមជ្រើសរើសកញ្ចប់ Script Skin ដែលអ្នកចង់ទិញ៖',
    Markup.inlineKeyboard([
      [Markup.button.callback('📦 Script Skin V1 - 1\$', 'buy_v1')],
      [Markup.button.callback('📦 Script Skin V2 (Pro) - 5\$', 'buy_v2')]
    ])
  );
});

bot.hears('ℹ️ ជំនួយ / ទំនាក់ទំនង', (ctx) => {
  ctx.reply('សម្រាប់បញ្ហាផ្សេងៗ សូមទាក់ទងមកកាន់ Admin: @YourUsername');
});

// Admin Panel Menu
bot.hears('⚙️ Admin Panel', (ctx) => {
  if (ctx.from.id !== ADMIN_ID) {
    return ctx.reply('⚠️ អ្នកមិនមែនជា Admin ទេ។');
  }

  return ctx.reply('⚙️ **Admin Control Panel**',
    Markup.inlineKeyboard([
      [Markup.button.callback('➕ បន្ថែម File Script ថ្មី', 'admin_add_script_info')],
      [Markup.button.callback('📊 មើលស្តុក Script', 'admin_stock')]
    ])
  );
});

bot.action('admin_add_script_info', (ctx) => {
  ctx.answerCbQuery();
  ctx.reply('ដើម្បីបន្ថែម File Script ចូលស្តុក សូម **Upload File មកកាន់ Bot ផ្ទាល់** ជាមួយ Caption តាមទម្រង់:\n`/addscript [package_type]`\nឧទាហរណ៍: `/addscript v1`', { parse_mode: 'Markdown' });
});

// Admin បន្ថែម File Script ចូល Database ដោយ Upload Document ផ្ទាល់
bot.on('document', async (ctx) => {
  if (ctx.from.id !== ADMIN_ID) return;

  const caption = ctx.message.caption || '';
  const args = caption.split(' ');
  const command = args[0];
  const packageType = args[1];

  if (command !== '/addscript' || !packageType) {
    return ctx.reply('⚠️ សូមផ្ញើ File ភ្ជាប់ជាមួយ Caption: `/addscript v1` ឬ `/addscript v2`', { parse_mode: 'Markdown' });
  }

  const fileId = ctx.message.document.file_id;

  db.run(`INSERT INTO scripts (file_id, package_type) VALUES (?, ?)`, [fileId, packageType], function(err) {
    if (err) {
      return ctx.reply('❌ បរាជ័យក្នុងការបន្ថែម File (File នេះអាចមានក្នុងប្រព័ន្ធរួចហើយ)។');
    }
    ctx.reply(`✅ បានបន្ថែម File Script សម្រាប់កញ្ចប់ **${packageType}** ចូលស្តុកជោគជ័យ!`, { parse_mode: 'Markdown' });
  });
});

// ─── ដំណើរការទូទាត់ប្រាក់តាម KHQR ───
const khqrImageUrl = 'https://i.imgur.com/12Ezdqe.png'; // Link រូបភាព KHQR របស់អ្នក

bot.action('buy_v1', (ctx) => {
  ctx.answerCbQuery();
  ctx.replyWithPhoto(khqrImageUrl, {
    caption: `📦 **Script Skin V1 - 1.00\$**\n\n` +
             `១. សូមស្កេន KHQR ខាងលើដើម្បីបង់ប្រាក់ចំនួន **\$1.00**\n` +
             `២. បន្ទាប់ពីបង់ប្រាក់រួច **សូមផ្ញើរូបភាពវិក្កយបត្រ (Receipt/Slip)** ចូលមកកាន់ទីនេះជាគោលដៅ!\n\n` +
             `⏳ កំពុងរង់ចាំ Receipt របស់អ្នក...`,
    parse_mode: 'Markdown'
  });
});

bot.action('buy_v2', (ctx) => {
  ctx.answerCbQuery();
  ctx.replyWithPhoto(khqrImageUrl, {
    caption: `📦 **Script Skin V2 (Pro) - 5.00\$**\n\n` +
             `១. សូមស្កេន KHQR ខាងលើដើម្បីបង់ប្រាក់ចំនួន **\$5.00**\n` +
             `២. បន្ទាប់ពីបង់ប្រាក់រួច **សូមផ្ញើរូបភាពវិក្កយបត្រ (Receipt/Slip)** ចូលមកកាន់ទីនេះជាគោលដៅ!\n\n` +
             `⏳ កំពុងរង់ចាំ Receipt របស់អ្នក...`,
    parse_mode: 'Markdown'
  });
});

// ពេលអតិថិជនផ្ញើរូបភាព Receipt (Slip) ចូលមក Bot
bot.on('photo', async (ctx) => {
  const userId = ctx.from.id;
  const username = ctx.from.username ? `@${ctx.from.username}` : ctx.from.first_name;
  const photoId = ctx.photo[ctx.photo.length - 1].file_id;

  if (userId === ADMIN_ID) {
    return ctx.reply('⚠️ នេះជាគណនី Admin មិនមែនជាការផ្ញើ Slip ទិញទំនិញទេ។');
  }

  // ផ្ញើរូបភាព Receipt ទៅកាន់ Admin ព្រមទាំងប៊ូតុង Approve / Reject
  await bot.telegram.sendPhoto(ADMIN_ID, photoId, {
    caption: `🔔 **មានការបញ្ជាទិញ Script Skin ថ្មី (រង់ចាំការផ្ទៀងផ្ទាត់ Slip)!**\n\n` +
             `👤 អតិថិជន: ${username} (ID: \`${userId}\`)\n\n` +
             `សូមពិនិត្យមើល Receipt ខាងលើ រួចចុចប៊ូតុងខាងក្រោមដើម្បីផ្ញើ Script ជូនអតិថិជន៖`,
    parse_mode: 'Markdown',
    ...Markup.inlineKeyboard([
      [
        Markup.button.callback('✅ Approve (V1)', `approve_${userId}_v1`),
        Markup.button.callback('✅ Approve (V2)', `approve_${userId}_v2`)
      ],
      [
        Markup.button.callback('❌ Reject (បដិសេធ)', `reject_${userId}`)
      ]
    ])
  });

  ctx.reply('📩 បានទទួល Receipt របស់អ្នកហើយ! សូមរង់ចាំ Admin ពិនិត្យ និងផ្ញើ File Script ជូនក្នុងរយៈពេលបន្តិច។');
});

// ─── ផ្នែក Admin ចុច Approve / Reject ───

bot.action(/approve_(\d+)_(.+)/, async (ctx) => {
  if (ctx.from.id !== ADMIN_ID) {
    return ctx.answerCbQuery('⚠️ អ្នកគ្មានសិទ្ធិទេ!');
  }

  const userId = ctx.match[1];
  const packageType = ctx.match[2];
  ctx.answerCbQuery('កំពុងដំណើរការ...');

  // ទាញយក File Script ទំនេរ (Random យកមួយ) ពី Database តាមប្រភេទកញ្ចប់
  db.get(
    `SELECT * FROM scripts WHERE package_type = ? AND status = 'available' ORDER BY RANDOM() LIMIT 1`,
    [packageType],
    async (err, scriptRow) => {
      if (err || !scriptRow) {
        return ctx.reply(`❌ **បរាជ័យ៖** គ្មាន File Script ទំនេរក្នុងស្តុកសម្រាប់កញ្ចប់ **${packageType}** ទេ! សូម Upload File បន្ថែមជាមុនសិន។`, { parse_mode: 'Markdown' });
      }

      // កែប្រែស្ថានភាព Script ទៅជា sold
      db.run(
        `UPDATE scripts SET status = 'sold', sold_to = ? WHERE id = ?`,
        [userId, scriptRow.id],
        async (updateErr) => {
          if (updateErr) {
            return ctx.reply('❌ Database Error ពេលអាប់ដេត Script Status');
          }

          // ផ្ញើ File Script ទៅអតិថិជនស្វ័យប្រវត្តិ
          try {
            await bot.telegram.sendDocument(userId, scriptRow.file_id, {
              caption: `🎉 **ការទូទាត់របស់អ្នកត្រូវបាន Admin អនុម័តជោគជ័យ!**\n\n` +
                       `📦 កញ្ចប់ Script: ${packageType.toUpperCase()}\n` +
                       `📄 ខាងលើនេះគឺជា File Script របស់អ្នក។ អរគុណសម្រាប់ការប្រើប្រាស់សេវាកម្មយើងខ្ញុំ!`,
              parse_mode: 'Markdown'
            });

            // កែប្រែសារលើ Admin Panel ថាបានអនុម័តរួច
            ctx.editMessageCaption(`✅ **បានអនុម័តការបញ្ជាទិញជោគជ័យ!**\nបានផ្ញើ File Script ជូនអតិថិជនរួចរាល់។`, { parse_mode: 'Markdown' });
          } catch (e) {
            ctx.reply('⚠️ បានកាត់ស្តុក File រួចរាល់ ប៉ុន្តែផ្ញើទៅអតិថិជនមិនកើត (ពួកគេអាចបាន Block Bot)។');
          }
        }
      );
    }
  );
});

bot.action(/reject_(\d+)/, async (ctx) => {
  if (ctx.from.id !== ADMIN_ID) return;
  const userId = ctx.match[1];
  ctx.answerCbQuery('បានបដិសេធការបញ្ជាទិញ');

  try {
    await bot.telegram.sendMessage(
      userId,
      `❌ **សូមអភ័យទោស!** វិក្កយបត្រ (Receipt) របស់អ្នកត្រូវបាន Admin បដិសេធ (អាចខុសចំនួនទឹកប្រាក់ ឬមិនច្បាស់លាស់)។ សូមទំនាក់ទំនងមកកាន់ Admin ផ្ទាល់។`
    );
    ctx.editMessageCaption('❌ **បានបដិសេធការបញ្ជាទិញនេះ។**', { parse_mode: 'Markdown' });
  } catch (e) {
    ctx.reply('⚠️ មានបញ្ហ្នុងការផ្ញើសារជូនដំណឹងដល់អតិថិជន។');
  }
});

bot.launch();
console.log('Telegram Bot is running...');

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
