export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const escapeHtml = (unsafe) => {
    return (unsafe || '').toString()
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  };

  const { animeTitle, episodeNumber, language, watchUrl, imageUrl, template } = req.body;
  
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const channelId = process.env.TELEGRAM_CHANNEL_ID;

  if (!botToken || !channelId) {
    return res.status(500).json({ error: 'Telegram credentials not configured in Vercel environment variables.' });
  }

  const defaultTemplate = `🔥 <b>{Anime Title}</b> - Episode {Number}\n\n🌐 Language: {Language}\n\n▶ Watch Now:\n{Episode URL}\n\n#DonghuaRealm`;
  const messageTemplate = template || defaultTemplate;

  const caption = messageTemplate
    .replace(/{Anime\s*Title}/gi, escapeHtml(animeTitle))
    .replace(/{Number}/gi, escapeHtml(episodeNumber))
    .replace(/{Language}/gi, escapeHtml(language))
    .replace(/{Episode\s*URL}/gi, watchUrl); // URL doesn't necessarily need HTML escaping in href but as plain text it should probably not contain HTML anyway, but let's leave it unescaped for links.

  const isPhoto = Boolean(imageUrl);
  const telegramApiUrl = isPhoto 
    ? `https://api.telegram.org/bot${botToken}/sendPhoto`
    : `https://api.telegram.org/bot${botToken}/sendMessage`;

  const payload = {
    chat_id: channelId,
    parse_mode: 'HTML',
    [isPhoto ? 'photo' : 'text']: isPhoto ? imageUrl : caption,
  };

  if (isPhoto) {
    payload.caption = caption;
  }

  try {
    const response = await fetch(telegramApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!data.ok) {
      throw new Error(data.description || 'Telegram API Error');
    }

    return res.status(200).json({ success: true, messageId: data.result.message_id });
  } catch (error) {
    console.error('Telegram API Error:', error);
    return res.status(500).json({ error: error.message });
  }
}