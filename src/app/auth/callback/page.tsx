'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { authApi } from '@/lib/auth-api';
import { profileApi } from '@/lib/profile-api';
import { setAuthCookie } from '@/lib/auth-cookie';

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const accessToken = searchParams.get('accessToken');
    const refreshToken = searchParams.get('refreshToken');
    const error = searchParams.get('error');

    if (error || !accessToken || !refreshToken) {
      router.replace(`/login?error=${error || 'oauth_failed'}`);
      return;
    }

    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    setAuthCookie(accessToken);

    authApi
      .me()
      .then(async (user) => {
        useAuthStore.setState({
          user: user as any,
          accessToken,
          refreshToken,
        });

        const requestedReturnPath = sessionStorage.getItem('post-login-return-to');
        const returnPath =
          requestedReturnPath?.startsWith('/') &&
          !requestedReturnPath.startsWith('//') &&
          !requestedReturnPath.includes('\\')
            ? requestedReturnPath
            : null;
        sessionStorage.removeItem('post-login-return-to');

        try {
          const profile = await profileApi.get();
          if (!profile.isComplete) {
            sessionStorage.setItem('oauth-welcome', '1');
            router.replace(returnPath || '/profile');
            return;
          }
        } catch {
          sessionStorage.setItem('oauth-welcome', '1');
          router.replace(returnPath || '/profile');
          return;
        }

        router.replace(returnPath || '/matchmaking');
      })
      .catch(() => {
        router.replace('/login?error=oauth_failed');
      });
  }, [searchParams, router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="space-y-4 text-center">
        <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-muted-foreground">Đang xử lý đăng nhập...</p>
      </div>
    </div>
  );
}

/**
 * Trang callback nhận tokens từ OAuth redirect (Google / Facebook).
 * Backend redirect về: /auth/callback?accessToken=...&refreshToken=...
 */
export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="space-y-4 text-center">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="text-muted-foreground">Đang xử lý đăng nhập...</p>
          </div>
        </div>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  );
}
