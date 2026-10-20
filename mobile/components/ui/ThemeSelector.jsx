import React from 'react';
import { View } from 'react-native';
import { SegmentedButtons, Text } from 'react-native-paper';
import { Sun, Moon, Smartphone } from 'lucide-react-native';
import { useTranslation } from '../../utils/i18n';
import { useAppTheme } from '../../theme/ThemeContext';

export default function ThemeSelector() {
  const { preference, setPreference, theme } = useAppTheme();
  const { t } = useTranslation();
  return (
    <View>
      <Text variant="titleSmall" style={{ color: theme.colors.onSurface, marginBottom: 8 }}>
        {t('settings.theme')}
      </Text>
      <SegmentedButtons
        value={preference}
        onValueChange={setPreference}
        buttons={[
          {
            value: 'light',
            label: t('settings.themeLight'),
            icon: ({ size, color }) => <Sun size={size || 16} color={color} />,
          },
          {
            value: 'dark',
            label: t('settings.themeDark'),
            icon: ({ size, color }) => <Moon size={size || 16} color={color} />,
          },
          {
            value: 'system',
            label: t('settings.themeSystem'),
            icon: ({ size, color }) => <Smartphone size={size || 16} color={color} />,
          },
        ]}
      />
    </View>
  );
}
