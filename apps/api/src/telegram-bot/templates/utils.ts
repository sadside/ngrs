export function escapeHtml(text: string): string {
  return String(text ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function buildInlineKeyboard(path: string) {
  const webUrl = process.env.WEB_ADMIN_URL ?? '';
  // Telegram requires HTTPS for inline keyboard URLs — skip button for localhost/http
  if (!webUrl || !webUrl.startsWith('https://')) {
    return undefined;
  }
  return {
    inline_keyboard: [[
      { text: '🔗 Открыть в веб-админке', url: `${webUrl}${path}` },
    ]],
  };
}
