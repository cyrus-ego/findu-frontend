'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/hooks/use-toast';
import { SocialAuthButtons, SocialAuthDivider } from '@/components/auth/SocialAuthButtons';
import { OAUTH_ERROR_MESSAGES } from '@/lib/auth-oauth';

const schema = z.object({
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(6, 'Mật khẩu ít nhất 6 ký tự'),
});

type FormData = z.infer<typeof schema>;

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuthStore();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  useEffect(() => {
    const error = searchParams.get('error');
    if (!error) return;

    toast({
      variant: 'destructive',
      title: 'Đăng nhập thất bại',
      description: OAUTH_ERROR_MESSAGES[error] || 'Không thể đăng nhập. Vui lòng thử lại.',
    });
    router.replace('/login');
  }, [searchParams, toast, router]);

  const onSubmit = async (data: FormData) => {
    try {
      await login(data.email, data.password);
      router.push('/matchmaking');
    } catch (err: any) {
      if (err.message?.includes('OTP') || err.message?.includes('xác thực')) {
        useAuthStore.getState().setPendingEmail(data.email);
        router.push('/verify-email');
        return;
      }
      toast({
        variant: 'destructive',
        title: 'Đăng nhập thất bại',
        description: err.message || 'Email hoặc mật khẩu không đúng',
      });
    }
  };

  return (
    <div className="space-y-6">
      <SocialAuthButtons />
      <SocialAuthDivider />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="login-email">Email</Label>
          <Input
            id="login-email"
            type="email"
            placeholder="ban@example.com"
            autoComplete="email"
            {...register('email')}
          />
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="login-password">Mật khẩu</Label>
          <Input
            id="login-password"
            type="password"
            placeholder="••••••••"
            autoComplete="current-password"
            {...register('password')}
          />
          {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
        </div>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Đang đăng nhập...' : 'Đăng nhập'}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Chưa có tài khoản?{' '}
        <Link href="/register" className="text-primary hover:underline">
          Đăng ký ngay
        </Link>
      </p>
    </div>
  );
}
