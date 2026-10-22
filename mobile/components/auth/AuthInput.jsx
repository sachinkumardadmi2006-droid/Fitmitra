import React, { useState, forwardRef } from 'react';
import { View, TextInput, Text, Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useAppTheme } from '../../theme/ThemeContext';
import { authSizes, authTypography } from './authTheme';

/**
 * Custom Auth Input with Feather icon, focus border, password visibility toggle,
 * and support for forwarded refs and keyboard navigation props.
 * Dynamic theme colors (supports Light and Dark mode)
 */
const AuthInput = forwardRef(function AuthInput(
  {
    icon,
    placeholder,
    value,
    onChangeText,
    secureTextEntry = false,
    keyboardType = 'default',
    autoCapitalize = 'none',
    error,
    editable = true,
    style,
    label,
    returnKeyType,
    onSubmitEditing,
    blurOnSubmit,
    ...rest
  },
  ref
) {
  const { theme, isDark } = useAppTheme();
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const primaryAccent = theme.custom?.primaryStrong || theme.colors.primary;
  const showEyeToggle = secureTextEntry;
  const isSecured = secureTextEntry && !isPasswordVisible;

  const inputBg = isDark
    ? theme.colors.elevation.level1
    : theme.colors.surfaceVariant;

  const borderColor = error
    ? theme.colors.error
    : isFocused
    ? primaryAccent
    : 'transparent';

  const iconColor = error
    ? theme.colors.error
    : isFocused
    ? primaryAccent
    : theme.colors.onSurfaceVariant;

  return (
    <View style={[styles.container, style]}>
      {label ? (
        <Text style={[styles.label, { color: theme.colors.onSurface }]}>
          {label}
        </Text>
      ) : null}
      <View
        style={[
          styles.inputWrapper,
          {
            borderColor,
            borderWidth: isFocused || error ? 1.5 : 0,
            backgroundColor: inputBg,
          },
        ]}
      >
        {icon ? (
          <Feather
            name={icon}
            size={18}
            color={iconColor}
            style={styles.leftIcon}
          />
        ) : null}

        <TextInput
          ref={ref}
          style={[styles.input, { color: theme.colors.onSurface }]}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.onSurfaceVariant}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={isSecured}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={false}
          editable={editable}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          blurOnSubmit={blurOnSubmit}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...rest}
        />

        {showEyeToggle ? (
          <Pressable
            onPress={() => setIsPasswordVisible(!isPasswordVisible)}
            style={styles.rightIconButton}
            hitSlop={10}
            accessibilityLabel={isPasswordVisible ? 'Hide password' : 'Show password'}
          >
            <Feather
              name={isPasswordVisible ? 'eye-off' : 'eye'}
              size={18}
              color={isPasswordVisible ? primaryAccent : theme.colors.onSurfaceVariant}
            />
          </Pressable>
        ) : null}
      </View>
      {error ? (
        <Text style={[styles.errorText, { color: theme.colors.error }]}>
          {error}
        </Text>
      ) : null}
    </View>
  );
});

export default AuthInput;

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 16,
  },
  label: {
    fontSize: authTypography.bodySize,
    fontWeight: '600',
    marginBottom: 6,
  },
  inputWrapper: {
    height: authSizes.inputHeight,
    borderRadius: authSizes.inputRadius,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  leftIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: authTypography.bodySize,
  },
  rightIconButton: {
    padding: 6,
    marginLeft: 6,
  },
  errorText: {
    fontSize: authTypography.smallSize,
    marginTop: 4,
    marginLeft: 4,
  },
});
