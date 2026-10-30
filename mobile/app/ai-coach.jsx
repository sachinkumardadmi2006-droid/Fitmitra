import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Sparkles,
  Send,
  Bot,
  User,
  Trash2,
  X,
  ChevronDown,
  ChevronUp,
  Brain,
} from 'lucide-react-native';
import { Chip } from 'react-native-paper';
import { aiService } from '../services/aiService';
import { queryKeys } from '../constants/queryKeys';
import { useAppTheme } from '../theme/ThemeContext';
import AppHeader from '../components/ui/AppHeader';
import AppButton from '../components/ui/AppButton';

let nextMsgCounter = 0;
function generateMessageId(role) {
  nextMsgCounter += 1;
  return `${role}_${Date.now()}_${nextMsgCounter}`;
}

const QUICK_PROMPTS = [
  'High-protein vegetarian diet plan',
  '45-min Chest & Triceps workout routine',
  'How to safely break a fat loss plateau',
  'Optimal post-workout hydration & electrolytes',
];

const MEMORY_CATEGORIES = [
  { key: 'FITNESS_PREFERENCE', label: 'Fitness' },
  { key: 'WORKOUT_PREFERENCE', label: 'Workouts' },
  { key: 'PREFERENCE', label: 'General' },
];

export default function AiCoachScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { theme } = useAppTheme();
  const { colors, custom } = theme;
  const scrollViewRef = useRef(null);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState(null);

  // Messages list
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        "Hello Athlete! I'm your FitMitra AI Coach. Ask me anything about your training routines, nutrition targets, exercise form, or recovery planning!",
    },
  ]);

  // Expanded reasoning traces
  const [expandedReasoning, setExpandedReasoning] = useState({});

  // Memories Modal State
  const [memoriesModalVisible, setMemoriesModalVisible] = useState(false);
  const [memories, setMemories] = useState([]);
  const [loadingMemories, setLoadingMemories] = useState(false);

  // Add Memory form
  const [addMemoryCategory, setAddMemoryCategory] = useState('FITNESS_PREFERENCE');
  const [memoryKey, setMemoryKey] = useState('');
  const [memoryValue, setMemoryValue] = useState('');
  const [savingMemory, setSavingMemory] = useState(false);

  // React Query for usage & quota
  const usageQuery = useQuery({
    queryKey: queryKeys.aiUsage,
    queryFn: async () => {
      const res = await aiService.getUsage();
      return res?.data || res || null;
    },
    staleTime: 60 * 1000,
  });
  const usage = usageQuery.data || null;

  // Fetch memories
  const loadMemories = useCallback(async () => {
    try {
      setLoadingMemories(true);
      const res = await aiService.getMemories();
      const list = res?.data?.memories || res?.memories || [];
      setMemories(list);
    } catch (err) {
      console.warn('[AI Coach] Memories fetch error:', err.message);
    } finally {
      setLoadingMemories(false);
    }
  }, []);

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  const handleSend = async (messageToSend) => {
    const text = (messageToSend || input).trim();
    if (!text || loading) return;

    const userMsg = {
      id: generateMessageId('user'),
      role: 'user',
      content: text,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const payload = { message: text };
      if (conversationId) payload.conversationId = conversationId;

      const res = await aiService.chat(payload);
      const chatData = res?.data || res;

      if (chatData?.conversationId) {
        setConversationId(chatData.conversationId);
      }

      const botMsg = {
        id: generateMessageId('assistant'),
        role: 'assistant',
        content: chatData?.response || chatData?.message || chatData?.reply || 'Analyzed your request. Keep training consistently!',
        reasoning: chatData?.reasoning || chatData?.metadata?.reasoning || null,
        sources: chatData?.sources || [],
      };

      setMessages((prev) => [...prev, botMsg]);
      queryClient.invalidateQueries({ queryKey: queryKeys.aiUsage });
    } catch (err) {
      const errMsg = {
        id: generateMessageId('error'),
        role: 'assistant',
        content:
          err.message ||
          "I'm unable to connect to the fitness knowledge engine right now. Please check your connection and try again.",
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearChat = () => {
    setConversationId(null);
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content: 'Conversation cleared! How can I help with your training or diet today?',
      },
    ]);
  };

  const toggleReasoning = (msgId) => {
    setExpandedReasoning((prev) => ({
      ...prev,
      [msgId]: !prev[msgId],
    }));
  };

  const handleOpenMemories = () => {
    loadMemories();
    setMemoriesModalVisible(true);
  };

  const handleSaveMemory = async () => {
    if (!memoryKey.trim() || !memoryValue.trim()) {
      Alert.alert('Required Fields', 'Please enter both a topic name and your preference.');
      return;
    }

    try {
      setSavingMemory(true);
      await aiService.saveMemory({
        category: addMemoryCategory,
        key: memoryKey.trim(),
        value: memoryValue.trim(),
      });
      setMemoryKey('');
      setMemoryValue('');
      loadMemories();
    } catch (err) {
      Alert.alert('Save Failed', err.message || 'Could not save memory.');
    } finally {
      setSavingMemory(false);
    }
  };

  const handleDeleteMemory = async (id) => {
    try {
      await aiService.deleteMemory(id);
      loadMemories();
    } catch (err) {
      Alert.alert('Delete Failed', err.message || 'Could not delete memory.');
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* AppHeader with Back action, Title & Right Action Pills */}
      <AppHeader
        title="AI Fitness Coach"
        onBack={() => router.back()}
        actions={[
          {
            icon: 'brain',
            accessibilityLabel: 'AI Memories',
            onPress: handleOpenMemories,
          },
          {
            icon: 'trash-can-outline',
            accessibilityLabel: 'Clear Chat',
            onPress: handleClearChat,
          },
        ]}
      />

      {/* Quota Banner */}
      {usage && (
        <View
          style={[
            styles.usageBanner,
            {
              backgroundColor: colors.surfaceVariant,
              borderBottomColor: colors.outlineVariant,
            },
          ]}
        >
          <View style={styles.usageRow}>
            <View style={styles.rowAlign}>
              <Sparkles size={14} color={colors.primary} />
              <Text style={[styles.usageText, { color: colors.onSurface }]}>
                {usage.isPro
                  ? 'PRO Member • High Quota'
                  : `Daily Messages: ${usage.used} / ${usage.limit}`}
              </Text>
            </View>

            <Pressable onPress={handleOpenMemories} style={styles.memoryPillBtn}>
              <Brain size={13} color={custom.primaryStrong} />
              <Text style={[styles.memoryPillText, { color: custom.primaryStrong }]}>
                Coach Memories
              </Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* Main Chat Messages List */}
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {messages.map((msg, mIdx) => {
            const isUser = msg.role === 'user';
            const isExpanded = Boolean(expandedReasoning[msg.id]);

            return (
              <View
                key={String(msg.id || mIdx)}
                style={[
                  styles.msgRow,
                  isUser ? styles.msgRowUser : styles.msgRowAssistant,
                ]}
              >
                {!isUser && (
                  <View
                    style={[
                      styles.avatarBox,
                      { backgroundColor: colors.primaryContainer },
                    ]}
                  >
                    <Bot size={16} color={colors.onPrimaryContainer} />
                  </View>
                )}

                <View
                  style={[
                    styles.msgBubble,
                    isUser
                      ? [styles.msgBubbleUser, { backgroundColor: colors.primary }]
                      : [
                          styles.msgBubbleAssistant,
                          {
                            backgroundColor: colors.surface,
                            borderColor: colors.outlineVariant,
                          },
                        ],
                  ]}
                >
                  <Text
                    style={[
                      styles.msgContent,
                      { color: isUser ? colors.onPrimary : colors.onSurface },
                    ]}
                  >
                    {msg.content}
                  </Text>

                  {/* Optional DeepSeek Reasoning Trace */}
                  {msg.reasoning && (
                    <View style={styles.reasoningContainer}>
                      <Pressable
                        style={[
                          styles.reasoningToggle,
                          { backgroundColor: colors.surfaceVariant },
                        ]}
                        onPress={() => toggleReasoning(msg.id)}
                      >
                        <Brain size={12} color={colors.onSurfaceVariant} />
                        <Text style={[styles.reasoningToggleText, { color: colors.onSurfaceVariant }]}>
                          {isExpanded ? 'Hide AI Thought Process' : 'View AI Thought Process'}
                        </Text>
                        {isExpanded ? (
                          <ChevronUp size={12} color={colors.onSurfaceVariant} />
                        ) : (
                          <ChevronDown size={12} color={colors.onSurfaceVariant} />
                        )}
                      </Pressable>

                      {isExpanded && (
                        <View
                          style={[
                            styles.reasoningBox,
                            { backgroundColor: colors.surfaceVariant },
                          ]}
                        >
                          <Text style={[styles.reasoningText, { color: colors.onSurfaceVariant }]}>
                            {msg.reasoning}
                          </Text>
                        </View>
                      )}
                    </View>
                  )}
                </View>

                {isUser && (
                  <View
                    style={[
                      styles.avatarBox,
                      { backgroundColor: colors.surfaceVariant },
                    ]}
                  >
                    <User size={16} color={colors.onSurface} />
                  </View>
                )}
              </View>
            );
          })}

          {/* Assistant typing indicator */}
          {loading && (
            <View style={[styles.msgRow, styles.msgRowAssistant]}>
              <View
                style={[
                  styles.avatarBox,
                  { backgroundColor: colors.primaryContainer },
                ]}
              >
                <Bot size={16} color={colors.onPrimaryContainer} />
              </View>
              <View
                style={[
                  styles.msgBubble,
                  styles.msgBubbleAssistant,
                  { backgroundColor: colors.surface, borderColor: colors.outlineVariant },
                ]}
              >
                <Text style={[styles.typingText, { color: colors.onSurfaceVariant }]}>
                  FitMitra AI is formulating guidance...
                </Text>
              </View>
            </View>
          )}

          {/* Quick suggestions when conversation has few messages */}
          {messages.length <= 2 && !loading && (
            <View style={styles.quickPromptsWrap}>
              <Text style={[styles.quickPromptsTitle, { color: colors.onSurfaceVariant }]}>
                Suggested Questions
              </Text>
              {QUICK_PROMPTS.map((prompt, idx) => (
                <Pressable
                  key={String(idx)}
                  style={[
                    styles.quickPromptBtn,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.outlineVariant,
                    },
                  ]}
                  onPress={() => handleSend(prompt)}
                >
                  <Sparkles size={13} color={colors.primary} />
                  <Text style={[styles.quickPromptText, { color: colors.onSurface }]}>
                    {prompt}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}
        </ScrollView>

        {/* Input Bar */}
        <View
          style={[
            styles.inputContainer,
            {
              backgroundColor: colors.surface,
              borderTopColor: colors.outlineVariant,
            },
          ]}
        >
          <TextInput
            style={[
              styles.textInput,
              {
                backgroundColor: colors.surfaceVariant,
                color: colors.onSurface,
                borderColor: colors.outlineVariant,
              },
            ]}
            placeholder="Ask about exercises, macros, workouts..."
            placeholderTextColor={colors.onSurfaceVariant}
            value={input}
            onChangeText={setInput}
            multiline
            maxLength={1000}
            onSubmitEditing={() => handleSend()}
          />

          <Pressable
            disabled={!input.trim() || loading}
            style={[
              styles.sendBtn,
              {
                backgroundColor: input.trim() && !loading ? colors.primary : colors.surfaceVariant,
              },
            ]}
            onPress={() => handleSend()}
          >
            <Send
              size={18}
              color={input.trim() && !loading ? colors.onPrimary : colors.onSurfaceVariant}
            />
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      {/* AI Memories & Preferences Modal */}
      <Modal
        visible={memoriesModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setMemoriesModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.modalCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.outlineVariant,
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <View style={styles.rowAlign}>
                <Brain size={20} color={colors.primary} />
                <Text style={[styles.modalTitle, { color: colors.onSurface }]}>
                  Coach Memories
                </Text>
              </View>
              <Pressable onPress={() => setMemoriesModalVisible(false)} hitSlop={8}>
                <X size={20} color={colors.onSurfaceVariant} />
              </Pressable>
            </View>

            <Text style={[styles.modalSub, { color: colors.onSurfaceVariant }]}>
              These saved preferences help your AI Coach provide personalized advice without re-asking questions.
            </Text>

            {/* Add Memory Section */}
            <View
              style={[
                styles.addMemoryBox,
                { backgroundColor: colors.surfaceVariant, borderColor: colors.outlineVariant },
              ]}
            >
              <Text style={[styles.addMemoryTitle, { color: colors.onSurface }]}>
                Add Saved Preference
              </Text>

              <View style={styles.memoryCategoryRow}>
                {MEMORY_CATEGORIES.map((cat) => {
                  const isSel = addMemoryCategory === cat.key;
                  return (
                    <Chip
                      key={cat.key}
                      selected={isSel}
                      onPress={() => setAddMemoryCategory(cat.key)}
                      style={[
                        styles.memChip,
                        isSel
                          ? { backgroundColor: colors.primaryContainer }
                          : { backgroundColor: colors.surface },
                      ]}
                      textStyle={{
                        fontSize: 11,
                        color: isSel ? colors.onPrimaryContainer : colors.onSurfaceVariant,
                        fontWeight: isSel ? '700' : '500',
                      }}
                    >
                      {cat.label}
                    </Chip>
                  );
                })}
              </View>

              <TextInput
                style={[
                  styles.modalInput,
                  { backgroundColor: colors.surface, borderColor: colors.outlineVariant, color: colors.onSurface },
                ]}
                placeholder="Topic (e.g., knee_injury, diet_style)"
                placeholderTextColor={colors.onSurfaceVariant}
                value={memoryKey}
                onChangeText={setMemoryKey}
              />

              <TextInput
                style={[
                  styles.modalInput,
                  { backgroundColor: colors.surface, borderColor: colors.outlineVariant, color: colors.onSurface },
                ]}
                placeholder="Details (e.g., Avoid heavy squats, High protein vegetarian)"
                placeholderTextColor={colors.onSurfaceVariant}
                value={memoryValue}
                onChangeText={setMemoryValue}
              />

              <AppButton
                tone="primary"
                label="Save Preference"
                loading={savingMemory}
                onPress={handleSaveMemory}
                style={{ marginTop: 4 }}
              />
            </View>

            {/* Memories List */}
            <ScrollView style={{ maxHeight: 220 }} showsVerticalScrollIndicator={false}>
              {loadingMemories ? (
                <ActivityIndicator
                  size="small"
                  color={colors.primary}
                  style={{ marginVertical: 20 }}
                />
              ) : memories.length > 0 ? (
                memories.map((mem, memIdx) => (
                  <View
                    key={String(mem._id?._id || mem._id || mem.id || memIdx)}
                    style={[
                      styles.memoryItemRow,
                      { backgroundColor: colors.surfaceVariant, borderColor: colors.outlineVariant },
                    ]}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.memoryItemKey, { color: colors.onSurface }]}>
                        {mem.key}
                      </Text>
                      <Text style={[styles.memoryItemVal, { color: colors.onSurfaceVariant }]}>
                        {mem.value}
                      </Text>
                    </View>

                    <Pressable
                      onPress={() => handleDeleteMemory(mem._id || mem.id)}
                      hitSlop={8}
                      style={styles.trashBtn}
                    >
                      <Trash2 size={16} color={colors.error} />
                    </Pressable>
                  </View>
                ))
              ) : (
                <Text style={[styles.noMemoriesText, { color: colors.onSurfaceVariant }]}>
                  No saved preferences yet. Add dietary restrictions or fitness preferences above.
                </Text>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  usageBanner: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  usageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  usageText: {
    fontSize: 12,
    fontWeight: '600',
  },
  memoryPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  memoryPillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
  },
  msgRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 8,
  },
  msgRowUser: {
    justifyContent: 'flex-end',
  },
  msgRowAssistant: {
    justifyContent: 'flex-start',
  },
  avatarBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  msgBubble: {
    maxWidth: '78%',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  msgBubbleUser: {
    borderBottomRightRadius: 4,
  },
  msgBubbleAssistant: {
    borderBottomLeftRadius: 4,
    borderWidth: 1,
  },
  msgContent: {
    fontSize: 14,
    lineHeight: 20,
  },
  typingText: {
    fontSize: 13,
    fontStyle: 'italic',
  },
  reasoningContainer: {
    marginTop: 8,
  },
  reasoningToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  reasoningToggleText: {
    fontSize: 11,
    fontWeight: '600',
    flex: 1,
  },
  reasoningBox: {
    padding: 8,
    borderRadius: 8,
    marginTop: 4,
  },
  reasoningText: {
    fontSize: 11,
    lineHeight: 16,
  },
  quickPromptsWrap: {
    marginTop: 16,
    gap: 8,
  },
  quickPromptsTitle: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
  },
  quickPromptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  quickPromptText: {
    fontSize: 13,
    flex: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 10,
  },
  textInput: {
    flex: 1,
    minHeight: 44,
    maxHeight: 100,
    borderRadius: 22,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    fontSize: 14,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowAlign: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    padding: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  modalSub: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },
  addMemoryBox: {
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 14,
  },
  addMemoryTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
  },
  memoryCategoryRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 10,
  },
  memChip: {
    borderRadius: 12,
  },
  modalInput: {
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    fontSize: 13,
    marginBottom: 8,
  },
  memoryItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 8,
  },
  memoryItemKey: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  memoryItemVal: {
    fontSize: 12,
  },
  trashBtn: {
    padding: 6,
  },
  noMemoriesText: {
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 16,
  },
});
