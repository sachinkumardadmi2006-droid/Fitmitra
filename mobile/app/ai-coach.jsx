import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Keyboard,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Sparkles,
  Send,
  Bot,
  User,
  ChevronDown,
  ChevronUp,
  Brain,
} from 'lucide-react-native';
import { aiService } from '../services/aiService';
import { useAppTheme } from '../theme/ThemeContext';
import AppHeader from '../components/ui/AppHeader';

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

export default function AiCoachScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme } = useAppTheme();
  const { colors } = theme;
  const scrollViewRef = useRef(null);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, () => {
      setIsKeyboardVisible(true);
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    });

    const hideSub = Keyboard.addListener(hideEvent, () => {
      setIsKeyboardVisible(false);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

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
        content:
          chatData?.response ||
          chatData?.message ||
          chatData?.reply ||
          'Analyzed your request. Keep training consistently!',
        reasoning: chatData?.reasoning || chatData?.metadata?.reasoning || null,
        sources: chatData?.sources || [],
      };

      setMessages((prev) => [...prev, botMsg]);
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

  const toggleReasoning = (msgId) => {
    setExpandedReasoning((prev) => ({
      ...prev,
      [msgId]: !prev[msgId],
    }));
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* AppHeader with Back action, Title & Subtitle only - clean, no extra icons */}
      <AppHeader
        title="AI Fitness Coach"
        subtitle="Personalized training & nutrition guidance"
        onBack={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/more'))}
      />

      {/* Main Chat Messages List with KeyboardAvoidingView */}
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
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

                  {/* Optional Reasoning Trace */}
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
                        <Text
                          style={[
                            styles.reasoningToggleText,
                            { color: colors.onSurfaceVariant },
                          ]}
                        >
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
                          <Text
                            style={[
                              styles.reasoningText,
                              { color: colors.onSurfaceVariant },
                            ]}
                          >
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

        {/* Input Bar with safe area padding for navigation bar */}
        <View
          style={[
            styles.inputContainer,
            {
              backgroundColor: colors.surface,
              borderTopColor: colors.outlineVariant,
              paddingBottom: isKeyboardVisible ? 10 : Math.max(12, insets.bottom + 10),
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
            returnKeyType="send"
            onFocus={() => {
              setTimeout(() => {
                scrollViewRef.current?.scrollToEnd({ animated: true });
              }, 150);
            }}
            onSubmitEditing={() => handleSend()}
          />

          <Pressable
            disabled={!input.trim() || loading}
            style={[
              styles.sendBtn,
              {
                backgroundColor:
                  input.trim() && !loading ? colors.primary : colors.surfaceVariant,
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
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
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
    paddingTop: 10,
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
});
