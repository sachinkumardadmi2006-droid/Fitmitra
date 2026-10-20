export function getErrorKey(error) {
  const status = error?.response?.status ?? error?.status;
  if (!status && (error?.code === 'ERR_NETWORK' || /network|connection|timed out|reach the server/i.test(String(error?.message || '')))) return 'errors.network';
  if (status === 401 || /session expired|unauthorized|401/i.test(String(error?.message || ''))) return 'errors.sessionExpired';
  if (status === 429 || /too many requests|rate limit|429/i.test(String(error?.message || ''))) return 'errors.rateLimited';
  if (status === 503 || /unavailable|503/i.test(String(error?.message || ''))) return 'errors.unavailable';
  return null;
}

export function getErrorMessage(error, t) {
  const key = getErrorKey(error);
  if (key) return t(key);
  const serverMessage =
    error?.response?.data?.error?.message ??
    error?.data?.error?.message ??
    error?.data?.message ??
    (typeof error?.message === 'string' && !error.message.includes('object Object') ? error.message : null);
  if (typeof serverMessage === 'string' && serverMessage.length > 0 && serverMessage.length < 200) return serverMessage;
  return t('errors.generic');
}
