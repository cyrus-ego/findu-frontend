'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, Loader2, Trash2, X } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { userApi, type AccountDeletionRequest } from '@/lib/profile-api';

const formatDate = (value: string | null) => {
  if (!value) return '';
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'long' }).format(new Date(value));
};

export function AccountDeletionSection() {
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [request, setRequest] = useState<AccountDeletionRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    userApi
      .getAccountDeletionRequest()
      .then(setRequest)
      .catch(() => {
        // Không chặn trang hồ sơ nếu API trạng thái tạm thời không khả dụng.
      })
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    if (searchParams.get('deleteAccount') === '1') {
      document.getElementById('delete-account')?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [searchParams]);

  const submitRequest = async () => {
    setIsSubmitting(true);
    try {
      const result = await userApi.requestAccountDeletion();
      setRequest(result);
      setShowConfirm(false);
      setConfirmed(false);
      toast({
        title: 'Đã ghi nhận yêu cầu',
        description: `Talk First sẽ xử lý chậm nhất vào ${formatDate(result.deletionDueAt)}.`,
      });
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Không thể gửi yêu cầu',
        description: err.message || 'Vui lòng thử lại.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const status = request?.status ?? 'none';
  const hasPendingRequest = status === 'pending';
  const closeConfirm = () => {
    setShowConfirm(false);
    setConfirmed(false);
  };

  return (
    <section id="delete-account" className="mt-10 scroll-mt-24 rounded-xl border p-6">
      <div className="flex items-start gap-3">
        <div className="rounded-full bg-destructive/10 p-2 text-destructive">
          <Trash2 className="h-5 w-5" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-semibold">Xóa tài khoản Talk First</h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Bạn có thể gửi yêu cầu xóa tài khoản và toàn bộ dữ liệu liên quan ngay tại đây. Yêu cầu
            được xử lý trong tối đa 30 ngày.
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
        <div className="rounded-lg bg-muted/50 p-4">
          <h3 className="font-medium">Dữ liệu sẽ bị xóa</h3>
          <ul className="mt-2 list-disc space-y-1.5 pl-5 text-muted-foreground">
            <li>Tài khoản, email và dữ liệu xác thực</li>
            <li>Hồ sơ, ảnh đại diện và tùy chọn ghép đôi</li>
            <li>Token thông báo, danh sách chặn và dữ liệu trò chuyện còn lại</li>
          </ul>
        </div>
        <div className="rounded-lg bg-muted/50 p-4">
          <h3 className="font-medium">Dữ liệu được giữ tạm thời</h3>
          <p className="mt-2 leading-6 text-muted-foreground">
            Bản ghi yêu cầu và dữ liệu an toàn/chống lạm dụng tối thiểu được giữ tối đa 90 ngày sau
            khi hoàn tất, sau đó sẽ bị xóa, trừ khi pháp luật yêu cầu lâu hơn.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="mt-5 flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          Đang kiểm tra trạng thái yêu cầu...
        </div>
      ) : hasPendingRequest ? (
        <div className="mt-5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" aria-hidden="true" />
            <div className="text-sm">
              <p className="font-medium text-emerald-700 dark:text-emerald-400">
                Yêu cầu đang được xử lý
              </p>
              <p className="mt-1 leading-6 text-muted-foreground">
                Đã gửi ngày {formatDate(request?.requestedAt ?? null)}. Hạn hoàn tất:{' '}
                {formatDate(request?.deletionDueAt ?? null)}.
              </p>
              {request?.requestId && (
                <p className="mt-1 break-all text-xs text-muted-foreground">
                  Mã yêu cầu: {request.requestId}
                </p>
              )}
            </div>
          </div>
        </div>
      ) : (
        <Button variant="destructive" className="mt-5" onClick={() => setShowConfirm(true)}>
          Gửi yêu cầu xóa tài khoản
        </Button>
      )}

      {showConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center"
          onClick={closeConfirm}
          role="presentation"
        >
          <div
            className="w-full max-w-md rounded-2xl border bg-card p-5 shadow-xl"
            onClick={(event) => event.stopPropagation()}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-account-title"
            aria-describedby="delete-account-description"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5 shrink-0" aria-hidden="true" />
                <h2 id="delete-account-title" className="text-lg font-semibold">
                  Xác nhận yêu cầu xóa
                </h2>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={closeConfirm}
                aria-label="Đóng"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <p
              id="delete-account-description"
              className="mt-3 text-sm leading-6 text-muted-foreground"
            >
              Sau khi yêu cầu được xử lý, tài khoản và dữ liệu đã xóa không thể khôi phục. Bạn vẫn
              có thể sử dụng tài khoản trong thời gian chờ xử lý.
            </p>

            <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-lg border p-3 text-sm">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(event) => setConfirmed(event.target.checked)}
                className="mt-0.5 h-4 w-4 accent-destructive"
              />
              <span>Tôi hiểu việc xóa tài khoản là không thể hoàn tác.</span>
            </label>

            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button variant="outline" onClick={closeConfirm}>
                Hủy
              </Button>
              <Button
                variant="destructive"
                disabled={!confirmed || isSubmitting}
                onClick={submitRequest}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang gửi...
                  </>
                ) : (
                  'Xác nhận gửi yêu cầu'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
