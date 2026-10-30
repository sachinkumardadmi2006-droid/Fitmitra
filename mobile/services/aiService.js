import { api } from './api';

export const aiService = {
  /**
   * Send a chat prompt to the server's LangChain + Gemini RAG engine (30s timeout)
   * @param {object} payload { message: string, conversationId?: string, language?: 'en' | 'kn' }
   */
  async chat(payload) {
    return api.post('/ai/chat', payload, { timeout: 30000 });
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

  /**
   * Fetch today's AI message quota usage
   */
  async getUsage() {
    return api.get('/ai/usage');
  },

  /**
   * Fetch user's active AI memories / preferences
   */
  async getMemories() {
    return api.get('/ai/memories');
  },

  /**
   * Save a new memory / fitness preference
   * @param {object} payload { category: 'PREFERENCE'|'FITNESS_PREFERENCE'|'LANGUAGE'|'WORKOUT_PREFERENCE', key, value }
   */
  async saveMemory(payload) {
    return api.post('/ai/memories', payload);
  },

  /**
   * Delete a saved memory
   */
  async deleteMemory(id) {
    return api.delete(`/ai/memories/${id}`);
  },
};
