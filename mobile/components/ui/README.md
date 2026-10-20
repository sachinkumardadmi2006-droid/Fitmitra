UI RULES FOR EVERY SCREEN
1. Never write a hex color in a screen or component. Use const { theme } = useAppTheme() and theme.colors.* or theme.custom.*.
2. Spacing and corner radius come from theme.custom.spacing and theme.custom.radius.
3. Every screen is wrapped in <Screen>. In a tab screen pass edges={['top']}. When you pass header={<AppHeader .../>} the top inset is handled for you. Screens that use AppHeader must set headerShown: false in their Stack.Screen options.
4. Long lists use <AppList> (never ScrollView with .map for long data).
5. Every screen that loads data has three states: <SkeletonList /> while loading, <ErrorState error={error} onRetry={...} /> on error, <EmptyState /> when the list is empty. Never show fake or placeholder data.
6. All text goes through t() with keys in BOTH the English and Kannada locale files.
7. Text and icons that use the brand green on a surface must use theme.custom.primaryStrong (the light green is too light to read as text). Text on a green button uses theme.colors.onPrimary.
8. Buttons use <AppButton>, confirmations use <ConfirmDialog>, short messages use useSnackbar().showMessage(text, 'success' | 'error' | 'info').
9. Touch targets are at least 48 by 48.
10. Import shared components with: import { Screen, AppCard } from '../components/ui' (adjust the relative path).
