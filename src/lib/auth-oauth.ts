const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export type OAuthProvider = 'google' | 'facebook';

export function getOAuthUrl(provider: OAuthProvider): string {
  return `${API_URL}/auth/${provider}`;
}

export const OAUTH_ERROR_MESSAGES: Record<string, string> = {
  oauth_failed: 'Đăng nhập mạng xã hội thất bại. Vui lòng thử lại.',
  oauth_cancelled: 'Bạn đã huỷ đăng nhập.',
};
