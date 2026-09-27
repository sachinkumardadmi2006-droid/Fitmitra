import { api } from './api';

export const aiService = {
  /**
   * Send a chat prompt to the server's LangChain + Gemini RAG engine
   * @param {object} payload { message: string, conversationId?: string, language?: 'en' | 'kn' }
   */
  async chat(payload) {
    return api.post('/ai/chat', payload);
  },

  /**
   * Fetch conversation history list
   */
  async getConversations(params = {}) {
    return api.get('/ai/conversations', params);
  },

  /**
   * Fetch a specific conversation with all message history
   */
  async getConversation(id) {
    return api.get(`/ai/conversations/${id}`);
  },

  /**
   * Delete a conversation
   */
  async deleteConversation(id) {
    return api.delete(`/ai/conversations/${id}`);
  },
};
