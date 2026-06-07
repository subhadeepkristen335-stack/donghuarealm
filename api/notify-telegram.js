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

  const isValidUrl = (string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  const { animeTitle, episodeNumber, language, watchUrl, imageUrl, template } = req.body;
  
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const channelId = process.env.TELEGRAM_CHANNEL_ID;

  if (!botToken || !channelId) {
    console.error('[Telegram API] Missing credentials - botToken or channelId not configured');
    return res.status(500).json({ error: 'Telegram credentials not configured in Vercel environment variables.' });
  }

  const defaultTemplate = `🔥 <b>{Anime Title}</b> - Episode {Number}\n\n🌐 Language: {Language}\n\n▶ Watch Now:\n{Episode URL}\n\n#DonghuaRealm`;
  const messageTemplate = template || defaultTemplate;

  const caption = messageTemplate
    .replace(/{Anime\s*Title}/gi, escapeHtml(animeTitle))
    .replace(/{Number}/gi, escapeHtml(episodeNumber))
    .replace(/{Language}/gi, escapeHtml(language))
    .replace(/{Episode\s*URL}/gi, watchUrl); // URL doesn't necessarily need HTML escaping in href but as plain text it should probably not contain HTML anyway, but let's leave it unescaped for links.

  // Validate image URL and decide whether to send as photo or text
  const isValidImage = imageUrl && typeof imageUrl === 'string' && isValidUrl(imageUrl);
  const shouldSendAsPhoto = isValidImage;

  if (!isValidImage && imageUrl) {
    console.warn(`[Telegram API] Invalid image URL provided: ${imageUrl}. Will send as text message instead.`);
  }

  const telegramApiUrl = shouldSendAsPhoto 
    ? `https://api.telegram.org/bot${botToken}/sendPhoto`
    : `https://api.telegram.org/bot${botToken}/sendMessage`;

  const payload = {
    chat_id: channelId,
    parse_mode: 'HTML',
  };

  if (shouldSendAsPhoto) {
    payload.photo = imageUrl;
    payload.caption = caption;
  } else {
    payload.text = caption;
  }

  console.log(`[Telegram API] Sending ${shouldSendAsPhoto ? 'photo' : 'text'} notification:`, {
    anime: animeTitle,
    episode: episodeNumber,
    language,
    hasImage: shouldSendAsPhoto,
    url: telegramApiUrl
  });

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
      const errorMsg = data.description || 'Telegram API Error';
      console.error(`[Telegram API] Error response from Telegram:`, {
        status: response.status,
        error: errorMsg,
        errorCode: data.error_code
      });
      throw new Error(errorMsg);
    }

    console.log('[Telegram API] Notification sent successfully', {
      messageId: data.result.message_id,
      anime: animeTitle,
      episode: episodeNumber
    });
    return res.status(200).json({ success: true, messageId: data.result.message_id });
  } catch (error) {
    console.error('[Telegram API] Error sending notification:', {
      error: error.message,
      anime: animeTitle,
      episode: episodeNumber,
      stack: error.stack
    });
    return res.status(500).json({ error: error.message });
  }
}