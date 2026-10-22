/**
 * Resolves a media key or URL into a fully-qualified URL.
 * Reads base URL from process.env.EXPO_PUBLIC_MEDIA_BASE_URL.
 * Full URLs (http:// or https://) pass through unchanged.
 * If base is missing for a relative key, returns null and logs console.warn in __DEV__.
 *
 * @param {string|null|undefined} pathOrUrl
 * @returns {string|null}
 */
export function resolveMediaUrl(pathOrUrl) {
  if (!pathOrUrl || typeof pathOrUrl !== 'string') {
    return null;
  }

  const trimmed = pathOrUrl.trim();
  if (!trimmed) return null;

  // Full URLs pass through unchanged
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }

  const baseUrl = process.env.EXPO_PUBLIC_MEDIA_BASE_URL;
  if (!baseUrl) {
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      console.warn(
        `[media.js] EXPO_PUBLIC_MEDIA_BASE_URL is not defined in environment. Cannot resolve relative media key: "${trimmed}"`
      );
    }
    return null;
  }

  const normalizedBase = baseUrl.replace(/\/+$/, '');
  const normalizedPath = trimmed.replace(/^\/+/, '');
  return `${normalizedBase}/${normalizedPath}`;
}

export default resolveMediaUrl;
