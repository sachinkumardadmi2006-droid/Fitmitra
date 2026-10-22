export const lightColors = {
  primary: '#71bc75fc', onPrimary: '#08260F', primaryContainer: '#D7F0D8', onPrimaryContainer: '#0B3D1A',
  secondary: '#FBC02D', onSecondary: '#3A2A00', secondaryContainer: '#FFF0B8', onSecondaryContainer: '#3A2A00',
  tertiary: '#00897B', onTertiary: '#FFFFFF', tertiaryContainer: '#B2DFDB', onTertiaryContainer: '#00352F',
  error: '#BA1A1A', onError: '#FFFFFF', errorContainer: '#FFDAD6', onErrorContainer: '#410002',
  background: '#F7FAF5', onBackground: '#171D17',
  surface: '#FFFFFF', onSurface: '#171D17',
  surfaceVariant: '#E4EBE1', onSurfaceVariant: '#424940',
  outline: '#72796F', outlineVariant: '#C2C9BE',
  shadow: '#000000', scrim: '#000000',
  inverseSurface: '#2C322C', inverseOnSurface: '#EEF2EB', inversePrimary: '#81C784',
  surfaceDisabled: 'rgba(23, 29, 23, 0.12)', onSurfaceDisabled: 'rgba(23, 29, 23, 0.38)',
  backdrop: 'rgba(44, 50, 44, 0.4)',
  elevation: { level0: 'transparent', level1: '#F2F7EF', level2: '#ECF3E9', level3: '#E6EEE3', level4: '#E3ECE0', level5: '#DEE8DB' },
};

export const darkColors = {
  primary: '#81C784', onPrimary: '#08260F', primaryContainer: '#1F5A2B', onPrimaryContainer: '#D7F0D8',
  secondary: '#FFD54F', onSecondary: '#3A2A00', secondaryContainer: '#5A4500', onSecondaryContainer: '#FFECB3',
  tertiary: '#4DB6AC', onTertiary: '#00352F', tertiaryContainer: '#00504A', onTertiaryContainer: '#B2DFDB',
  error: '#FFB4AB', onError: '#690005', errorContainer: '#93000A', onErrorContainer: '#FFDAD6',
  background: '#0F130F', onBackground: '#E1E6DE',
  surface: '#171C17', onSurface: '#E1E6DE',
  surfaceVariant: '#2B322B', onSurfaceVariant: '#C2C9BE',
  outline: '#8C9388', outlineVariant: '#424940',
  shadow: '#000000', scrim: '#000000',
  inverseSurface: '#E1E6DE', inverseOnSurface: '#2C322C', inversePrimary: '#2E7D32',
  surfaceDisabled: 'rgba(225, 230, 222, 0.12)', onSurfaceDisabled: 'rgba(225, 230, 222, 0.38)',
  backdrop: 'rgba(15, 19, 15, 0.6)',
  elevation: { level0: 'transparent', level1: '#1C221C', level2: '#212821', level3: '#262E26', level4: '#283028', level5: '#2B342B' },
};

// Extra colors that Material does not define. primaryStrong and accentText are for TEXT and ICONS on surfaces
// (the light green and the yellow are too light to read as text on white).
export const lightCustom = {
  primaryStrong: '#2E7D32', accentText: '#7A5B00',
  success: '#2E7D32', onSuccess: '#FFFFFF', warning: '#FBC02D',
  skeletonBase: '#E4EBE1', skeletonHighlight: '#F1F6EE',
  chart: ['#66BB6A', '#FBC02D', '#00897B', '#8D6E63', '#7E57C2'],
  heatmap: { empty: '#E4EBE1', levels: ['#D7F0D8', '#A5D6A7', '#66BB6A', '#2E7D32'] },
};

export const darkCustom = {
  primaryStrong: '#81C784', accentText: '#FFD54F',
  success: '#81C784', onSuccess: '#08260F', warning: '#FFD54F',
  skeletonBase: '#222922', skeletonHighlight: '#2F382F',
  chart: ['#81C784', '#FFD54F', '#4DB6AC', '#BCAAA4', '#B39DDB'],
  heatmap: { empty: '#222922', levels: ['#1F3D25', '#2F6B3A', '#4CAF50', '#81C784'] },
};
