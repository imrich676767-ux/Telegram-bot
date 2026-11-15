const { Telegraf, Markup } = require('telegraf');
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// ១. ការកំណត់រចនាសម្ព័ន្ធ Bot (ទាញយកពី Environment Variables របស់ Render)
const BOT_TOKEN = process.env.BOT_TOKEN || '9073859818:AAHmR9hznAuewrPPgVRp-lKkG--EU-9nkfk;
const ADMIN_ID = Number(process.env.ADMIN_ID) || 8874434128; // Telegram ID របស់អ្នក

const bot = new Telegraf(BOT_TOKEN);
const app = express();
const PORT = process.env.PORT || 3000;

// ២. រៀបចំ SQLite Database
const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) console.error('Database error:', err.message);
  else console.log('Connected to SQLite database successfully. ✅');
});

// បង្កើត Table ស្វ័យប្រវត្តិ
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS keys (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key_string TEXT UNIQUE NOT NULL,
    package_type TEXT NOT NULL,
    status TEXT DEFAULT 'available',
    sold_to INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
});

// ៣. Express Server (សម្រាប់ការពារកុំឱ្យ Render Free Tier Sleep)
app.get('/', (req, res) => {
  res.send('Telegram Bot is running 24/7! 🚀');
});

app.listen(PORT, () => {
  console.log(`Web server is listening on port ${PORT}`);
});

// ៤. Telegram Bot Commands & Menus
bot.start((ctx) => {
  return ctx.reply(
    'សួស្តី! សូមស្វាគមន៍មកកាន់ហាងលក់ Key ស្វ័យប្រវត្តិ ២៤ម៉ោង។\nសូមជ្រើសរើសជម្រើសខាងក្រោម៖',
    Markup.keyboard([
      ['🔑 ទិញ Key', '📦 ពិនិត្យការបញ្ជាទិញ'],
      ['ℹ️ ជំនួយ / ទំនាក់ទំនង', '⚙️ Admin Panel']
    ]).resize()
  );
});

bot.hears('🔑 ទិញ Key', (ctx) => {
  ctx.reply('សូមជ្រើសរើសកញ្ចប់ដែលអ្នកចង់ទិញ៖',
    Markup.inlineKeyboard([
      [Markup.button.callback('📦 កញ្ចប់ 1 ថ្ងៃ - 1\$', 'buy_1d')],
      [Markup.button.callback('📦 កញ្ចប់ 30 ថ្ងៃ - 10\$', 'buy_30d')]
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
      [Markup.button.callback('➕ បន្ថែម Key ថ្មី', 'admin_add_key')],
      [Markup.button.callback('📊 មើលស្តុក Key', 'admin_stock')]
    ])
  );
});

// ឧទាហរណ៍ Admin បន្ថែម Key: /addkey 30d ABC-XYZ-123
bot.command('addkey', (ctx) => {
  if (ctx.from.id !== ADMIN_ID) return;

  const args = ctx.message.text.split(' ');
  const packageType = args[1];
  const keyString = args[2];

  if (!packageType || !keyString) {
    return ctx.reply('⚠️ ទម្រង់ខុស! ប្រើប្រាស់: `/addkey [package] [key]`', { parse_mode: 'Markdown' });
  }

  db.run(`INSERT INTO keys (key_string, package_type) VALUES (?, ?)`, [keyString, packageType], function(err) {
    if (err) {
      return ctx.reply('❌ បរាជ័យក្នុងការបន្ថែម Key (Key នេះអាចមានរួចហើយ)។');
    }
    ctx.reply(`✅ បានបន្ថែម Key ជោគជ័យសម្រាប់កញ្ចប់ **${packageType}**!`, { parse_mode: 'Markdown' });
  });
});

bot.action('buy_30d', (ctx) => {
  ctx.answerCbQuery();
  ctx.reply('សូមស្កេន KHQR ខាងក្រោមដើម្បីបង់ប្រាក់ ១០ដុល្លារ (ប្រព័ន្ធនឹងផ្ញើ Key ស្វ័យប្រវត្តិពេលលុយចូល)។');
});

// ចាប់ផ្តើម Bot
bot.launch();
console.log('Telegram Bot is running...');

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
