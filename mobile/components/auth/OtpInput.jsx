import React, { useState, useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { useAppTheme } from '../../theme/ThemeContext';
import { authSizes } from './authTheme';

/**
 * 6-box OTP Input using a single hidden TextInput with paste and auto-completion support
 * Dynamic theme colors (supports Light and Dark mode)
 */
const OtpInput = forwardRef(function OtpInput(
  {
    length = 6,
    onComplete,
    onChangeCode,
    error = false,
    resetKey,
    autoFocus = true,
    style,
  },
  ref
) {
  const { theme, isDark } = useAppTheme();
  const [code, setCode] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef(null);

  useImperativeHandle(ref, () => ({
    clear: () => {
      setCode('');
      if (inputRef.current) inputRef.current.clear();
    },
    focus: () => {
      if (inputRef.current) inputRef.current.focus();
    },
  }));

  // Reset code when resetKey changes
  useEffect(() => {
    if (resetKey !== undefined) {
      setCode('');
      if (inputRef.current) inputRef.current.clear();
    }
  }, [resetKey]);

  const handleChangeText = (text) => {
    // Strip non-numeric characters for paste support
    const cleaned = text.replace(/[^0-9]/g, '').slice(0, length);
    setCode(cleaned);

    if (onChangeCode) {
      onChangeCode(cleaned);
    }

    if (cleaned.length === length) {
      if (onComplete) {
        onComplete(cleaned);
      }
    }
  };

  const handleBoxPress = () => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const primaryAccent = theme.custom?.primaryStrong || theme.colors.primary;
  const boxBg = isDark ? theme.colors.elevation.level1 : theme.colors.surfaceVariant;

  const boxes = Array.from({ length }).map((_, index) => {
    const digit = code[index] || '';
    const isCurrent = isFocused && index === code.length && code.length < length;
    const isLast = isFocused && index === length - 1 && code.length === length;
    const isActive = isCurrent || isLast;

    let borderColor = theme.colors.outlineVariant;
    let borderWidth = 1;

    if (error) {
      borderColor = theme.colors.error;
      borderWidth = 1.5;
    } else if (isActive) {
      borderColor = primaryAccent;
      borderWidth = 1.5;
    }

    return (
      <View
        key={index}
        style={[
          styles.box,
          {
            backgroundColor: boxBg,
            borderColor,
            borderWidth,
          },
        ]}
      >
        <Text style={[styles.digit, { color: theme.colors.onSurface }]}>
          {digit}
        </Text>
      </View>
    );
  });

  return (
    <Pressable onPress={handleBoxPress} style={[styles.container, style]}>
      {/* Hidden native input */}
      <TextInput
        ref={inputRef}
        value={code}
        onChangeText={handleChangeText}
        maxLength={length}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="one-time-code"
        autoFocus={autoFocus}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        style={styles.hiddenInput}
        caretHidden
      />

      {/* Visible boxes */}
      <View style={styles.boxesRow}>{boxes}</View>
    </Pressable>
  );
});

export default OtpInput;

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 16,
  },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    width: 1,
    height: 1,
  },
  boxesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: 340,
  },
  box: {
    width: authSizes.otpBoxWidth,
    height: authSizes.otpBoxHeight,
    borderRadius: authSizes.otpBoxRadius,
    alignItems: 'center',
    justifyContent: 'center',
  },
  digit: {
    fontSize: 22,
    fontWeight: '700',
  },
});
