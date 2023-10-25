import axios from 'axios';
import { API_TELEGRAM } from './constants.js';

type ParseMode = 'HTML' | 'MarkdownV2' | 'Markdown';
export const notifyOnTelegramMe = async (
  token: string,
  chatId: string,
  message: string,
  parseMode: ParseMode = 'HTML',
): Promise<void> => {
  const options = {
    method: 'POST',
    url: `${API_TELEGRAM}${token}/sendMessage`,
    headers: { accept: 'application/json', 'content-type': 'application/json' },
    data: {
      text: message,
      disable_web_page_preview: true,
      disable_notification: false,
      reply_to_message_id: null,
      chat_id: chatId,
      parse_mode: parseMode,
    },
  };

  try {
    await axios.request(options);
  } catch (error: any) {
    console.log('notifyOnTelegramMe -> Error', error);
  }
};
