import axios from 'axios';
import { API_TELEGRAM } from './constants';

export const notifyOnTelegramMe = (token: string, chatId: string, message: string) => {
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
      parse_mode: 'HTML',
    },
  };

  axios
    .request(options)
    .then(() => {})
    .catch(error => {
      console.error(error);
    });
};
