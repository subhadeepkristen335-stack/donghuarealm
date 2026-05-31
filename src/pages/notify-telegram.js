export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { animeTitle, episodeNumber, language, watchUrl, imageUrl, template } = req.body;
  
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const channelId = process.env.TELEGRAM_CHANNEL_ID;

  if (!botToken || !channelId) {
    return res.status(500).json({ error: 'Telegram credentials not configured in environment variables.' });
  }

  const defaultTemplate = `🔥 {Anime Title} - Episode {Number}\n\n🌐 Language: {Language}\n\n▶ Watch Now:\n{Episode URL}\n\n#DonghuaRealm`;
  const messageTemplate = template || defaultTemplate;

  const caption = messageTemplate
    .replace(/{Anime\s*Title}/gi, animeTitle)
    .replace(/{Number}/gi, episodeNumber)
    .replace(/{Language}/gi, language)
    .replace(/{Episode\s*URL}/gi, watchUrl);

  const telegramApiUrl = `https://api.telegram.org/bot${botToken}/sendPhoto`;

  try {
    const response = await fetch(telegramApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: channelId,
        photo: imageUrl,
        caption: caption,
      }),
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