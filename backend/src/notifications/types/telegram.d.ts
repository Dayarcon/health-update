declare module 'node-telegram-bot-api' {
  class TelegramBot {
    constructor(token: string, options?: any);
    sendMessage(chatId: string, text: string, options?: any): Promise<any>;
  }
  export = TelegramBot;
}
