
interface ChatGPTMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ChatGPTResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

export class ChatGPTService {
  private static apiKey: string | null = null;

  static setApiKey(key: string) {
    this.apiKey = key;
  }

  static async sendMessage(message: string, conversationHistory: ChatGPTMessage[] = []): Promise<string> {
    if (!this.apiKey) {
      throw new Error('ChatGPT API key not set. Please configure it in settings.');
    }

    const messages: ChatGPTMessage[] = [
      {
        role: 'system',
        content: 'You are a helpful AI assistant integrated into Chat Rescuer, a messaging application. Provide helpful, friendly responses to user queries.'
      },
      ...conversationHistory.slice(-10), // Keep last 10 messages for context
      {
        role: 'user',
        content: message
      }
    ];

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages,
          max_tokens: 500,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        throw new Error(`ChatGPT API error: ${response.status}`);
      }

      const data: ChatGPTResponse = await response.json();
      return data.choices[0]?.message?.content || 'Sorry, I could not generate a response.';
    } catch (error) {
      console.error('ChatGPT error:', error);
      throw new Error('Failed to get response from ChatGPT. Please try again.');
    }
  }

  static isConfigured(): boolean {
    return !!this.apiKey;
  }
}
