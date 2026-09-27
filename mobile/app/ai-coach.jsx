import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Sparkles, Send, Bot, User, Trash2 } from 'lucide-react-native';
import { aiService } from '../services/aiService';
import { TopBar } from '../components/common/TopBar';
import { MaterialCard } from '../components/common/MaterialCard';
import { useTheme } from '../context/ThemeContext';
import { FontSize, BorderRadius } from '../constants/theme';

export default function AiCoachScreen() {
  const { colors, isDark } = useTheme();
  const scrollViewRef = useRef(null);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        "Hello Athlete! I'm your FitMitra AI Coach, powered by DeepSeek and LangGraph. Ask me anything about workout routines, nutrition targets, form corrections, or macro planning!",
    },
  ]);

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  const handleSend = async (messageToSend) => {
    const text = (messageToSend || input).trim();
    if (!text || loading) return;

    const userMsg = {
      id: String(Date.now()),
      role: 'user',
      content: text,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await aiService.chat({ message: text });
      const replyText =
        res?.reply ||
        res?.message ||
        res?.response ||
        'I am analyzing your fitness data. Keep up the high workout consistency!';

      const botMsg = {
        id: String(Date.now() + 1),
        role: 'assistant',
        content: replyText,
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      const errorMsg = {
        id: String(Date.now() + 1),
        role: 'assistant',
        content:
          "I'm currently unable to reach the fitness knowledge base. Please check your network connection and try again.",
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content:
          "Chat cleared! How can I assist with your fitness journey today?",
      },
    ]);
  };

  const QUICK_PROMPTS = [
    '🍗 High-protein vegetarian meal plan',
    '🏋️ 45-min Chest & Triceps routine',
    '🔥 How to break through fat loss plateau',
    '💧 Best post-workout hydration tips',
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.bgBase }]}>
      {/* Context-Aware TopBar */}
      <TopBar
        title="AI Coach"
        subtitle="DeepSeek + LangGraph RAG"
        showBack
        icon={Sparkles}
        rightAction={
          <Pressable
            onPress={handleClearChat}
            style={[styles.clearBtn, { borderColor: colors.border }]}
            hitSlop={8}
          >
            <Trash2 size={18} color={colors.textSecondary} />
          </Pressable>
        }
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.chatScroll}
          contentContainerStyle={styles.chatContent}
        >
          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <View
                key={msg.id}
                style={[
                  styles.messageRow,
                  isUser ? styles.userRow : styles.botRow,
                ]}
              >
                {!isUser && (
                  <View
                    style={[
                      styles.avatarWrap,
                      { backgroundColor: colors.primary + '20', borderColor: colors.primary },
                    ]}
                  >
                    <Bot size={18} color={colors.primary} />
                  </View>
                )}

                <View
                  style={[
                    styles.bubble,
                    isUser
                      ? [styles.userBubble, { backgroundColor: colors.primary }]
                      : [
                          styles.botBubble,
                          {
                            backgroundColor: colors.surface,
                            borderColor: colors.border,
                          },
                        ],
                  ]}
                >
                  <Text
                    style={[
                      styles.bubbleText,
                      { color: isUser ? '#000000' : colors.textPrimary },
                    ]}
                  >
                    {msg.content}
                  </Text>
                </View>

                {isUser && (
                  <View
                    style={[
                      styles.avatarWrap,
                      { backgroundColor: colors.surfaceElevated, borderColor: colors.border },
                    ]}
                  >
                    <User size={18} color={colors.textSecondary} />
                  </View>
                )}
              </View>
            );
          })}

          {loading && (
            <View style={[styles.messageRow, styles.botRow]}>
              <View
                style={[
                  styles.avatarWrap,
                  { backgroundColor: colors.primary + '20', borderColor: colors.primary },
                ]}
              >
                <Bot size={18} color={colors.primary} />
              </View>
              <View
                style={[
                  styles.bubble,
                  styles.botBubble,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                ]}
              >
                <ActivityIndicator size="small" color={colors.primary} />
              </View>
            </View>
          )}

          {/* Quick Prompts Carousel (when message count is low) */}
          {messages.length <= 2 && (
            <View style={styles.quickPromptsSection}>
              <Text style={[styles.quickPromptsTitle, { color: colors.textMuted }]}>
                SUGGESTED QUESTIONS
              </Text>
              <View style={styles.chipsWrap}>
                {QUICK_PROMPTS.map((p, idx) => (
                  <Pressable
                    key={idx}
                    style={[
                      styles.promptChip,
                      { backgroundColor: colors.surface, borderColor: colors.border },
                    ]}
                    onPress={() => handleSend(p)}
                  >
                    <Text style={[styles.promptChipText, { color: colors.textPrimary }]}>
                      {p}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}
        </ScrollView>

        {/* Input Bar */}
        <View
          style={[
            styles.inputContainer,
            {
              backgroundColor: colors.surface,
              borderTopColor: colors.border,
            },
          ]}
        >
          <TextInput
            style={[styles.inputField, { color: colors.textPrimary, backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
            placeholder="Ask your coach anything..."
            placeholderTextColor={colors.textMuted}
            value={input}
            onChangeText={setInput}
            onSubmitEditing={() => handleSend()}
            returnKeyType="send"
          />
          <Pressable
            style={[
              styles.sendBtn,
              { backgroundColor: input.trim() ? colors.primary : colors.surfaceElevated },
            ]}
            onPress={() => handleSend()}
            disabled={!input.trim() || loading}
          >
            <Send size={18} color={input.trim() ? '#000' : colors.textMuted} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  clearBtn: {
    width: 38,
    height: 38,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatScroll: {
    flex: 1,
  },
  chatContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 20,
    gap: 14,
  },
  messageRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-end',
  },
  userRow: {
    justifyContent: 'flex-end',
  },
  botRow: {
    justifyContent: 'flex-start',
  },
  avatarWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  bubble: {
    maxWidth: '78%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: BorderRadius.lg,
  },
  userBubble: {
    borderBottomRightRadius: 4,
  },
  botBubble: {
    borderWidth: 1,
    borderBottomLeftRadius: 4,
  },
  bubbleText: {
    fontSize: FontSize.sm,
    lineHeight: 20,
    fontWeight: '500',
  },
  quickPromptsSection: {
    marginTop: 24,
  },
  quickPromptsTitle: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 10,
    marginLeft: 4,
  },
  chipsWrap: {
    gap: 8,
  },
  promptChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  promptChipText: {
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
    gap: 10,
  },
  inputField: {
    flex: 1,
    height: 46,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: FontSize.sm,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
