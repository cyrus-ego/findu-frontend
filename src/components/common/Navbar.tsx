'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MessageCircle, User, LogOut, Moon, Sun, X } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/authStore';

export function Navbar() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { user, logout } = useAuthStore();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogout = () => {
    setShowLogoutConfirm(false);
    logout();
    router.push('/login');
  };

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex min-w-0 items-center gap-2 font-bold text-primary">
            <MessageCircle className="h-5 w-5" />
            <span className="hidden sm:inline">StrangerConfide</span>
          </Link>

          <nav className="flex items-center gap-2">
            {user ? (
              <>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/matchmaking">
                    <MessageCircle className="h-4 w-4 sm:hidden" />
                    <span className="hidden sm:inline">Tìm người tâm sự</span>
                  </Link>
                </Button>
                <Button asChild variant="ghost" size="icon">
                  <Link href="/profile">
                    <User className="h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowLogoutConfirm(true)}
                  aria-label="Đăng xuất"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/login">Đăng nhập</Link>
                </Button>
                <Button asChild size="sm">
                  <Link href="/register">Đăng ký</Link>
                </Button>
              </>
            )}

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              aria-label="Đổi giao diện"
            >
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </Button>
          </nav>
        </div>
      </header>

      {showLogoutConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center"
          onClick={() => setShowLogoutConfirm(false)}
          role="presentation"
        >
          <div
            className="w-full max-w-sm rounded-2xl border bg-card p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="logout-confirm-title"
            aria-describedby="logout-confirm-description"
          >
            <div className="mb-3 flex items-center justify-between">
              <h2 id="logout-confirm-title" className="text-lg font-semibold">
                Xác nhận đăng xuất
              </h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowLogoutConfirm(false)}
                aria-label="Đóng"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <p id="logout-confirm-description" className="text-sm text-muted-foreground">
              Bạn có chắc chắn muốn đăng xuất khỏi tài khoản hiện tại không?
            </p>

            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button variant="outline" onClick={() => setShowLogoutConfirm(false)}>
                Hủy
              </Button>
              <Button variant="destructive" onClick={handleLogout}>
                Đăng xuất
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
