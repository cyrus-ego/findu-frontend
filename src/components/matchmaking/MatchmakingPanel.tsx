'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Users, Clock, Hash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMatchmaking } from '@/hooks/useMatchmaking';
import { useToast } from '@/hooks/use-toast';
import { profileApi, type ChatPreference, type Gender } from '@/lib/profile-api';

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

const getOppositeGender = (gender?: Gender): Gender | undefined => {
  if (gender === 'male') return 'female';
  if (gender === 'female') return 'male';
  if (gender === 'other') return 'other';
  return undefined;
};

const normalizePreference = (value: unknown, gender?: Gender): ChatPreference => {
  if (value === 'male' || value === 'female' || value === 'other') return value;
  if (value === 'same' && gender) return gender;
  if (value === 'opposite') return getOppositeGender(gender) ?? 'female';
  return getOppositeGender(gender) ?? 'female';
};

export function MatchmakingPanel() {
  const router = useRouter();
  const { toast } = useToast();
  const {
    isInQueue,
    position,
    queueSize,
    elapsedSeconds,
    error,
    joinQueue,
    leaveQueue,
  } = useMatchmaking();

  const [preference, setPreference] = useState<ChatPreference>('female');
  const [isJoining, setIsJoining] = useState(false);
  const [isLoadingProfileSettings, setIsLoadingProfileSettings] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadProfileSettings = async () => {
      try {
        const result = await profileApi.get();
        if (!isMounted || !result.profile) return;

        setPreference(normalizePreference(result.profile.chatPreference, result.profile.gender));
      } catch {
        // Search still validates profile completeness and auth errors through joinQueue.
      } finally {
        if (isMounted) {
          setIsLoadingProfileSettings(false);
        }
      }
    };

    loadProfileSettings();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSearch = async () => {
    setIsJoining(true);
    try {
      await joinQueue(
        {
          preference,
        },
        (roomId) => {
          toast({ title: 'Đã tìm thấy người tâm sự!' });
          router.push(`/chat/${roomId}`);
        },
      );
    } catch (err: any) {
      if (err.message?.includes('Hồ sơ chưa hoàn thiện')) {
        toast({
          variant: 'destructive',
          title: 'Chưa đủ điều kiện',
          description: err.message,
        });
        router.push('/profile');
        return;
      }
      toast({
        variant: 'destructive',
        title: 'Không thể tìm kiếm',
        description: err.message,
      });
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="w-full max-w-md space-y-8 text-center">
      {/* <PanelHeader /> */}

      {!isInQueue ? (
        <div className="space-y-4 text-left">
          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button
            size="lg"
            className="w-full rounded-full"
            onClick={handleSearch}
            disabled={isJoining || isLoadingProfileSettings}
          >
            {isJoining ? 'Đang kết nối...' : 'Tìm người tâm sự'}
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            <Link href="/profile" className="text-primary hover:underline">
              Cập nhật hồ sơ
            </Link>{' '}
            trước khi tìm kiếm (cần giới tính & tuổi)
          </p>
        </div>
      ) : (
        <>
          {/* Shazam-style full-screen pulse background */}
          <div className="pointer-events-none fixed inset-0 z-0 flex items-center justify-center overflow-hidden">
            {/* Inner rings - fast */}
            <div className="animate-pulse-ring absolute left-1/2 top-1/2 h-[200px] w-[200px] rounded-full border-2 border-primary/40" />
            <div className="animate-pulse-ring absolute left-1/2 top-1/2 h-[200px] w-[200px] rounded-full border-2 border-primary/30 [animation-delay:0.7s]" />
            <div className="animate-pulse-ring absolute left-1/2 top-1/2 h-[200px] w-[200px] rounded-full border-2 border-primary/20 [animation-delay:1.4s]" />
            {/* Middle rings */}
            <div className="animate-pulse-ring absolute left-1/2 top-1/2 h-[350px] w-[350px] rounded-full border-2 border-primary/30" />
            <div className="animate-pulse-ring absolute left-1/2 top-1/2 h-[350px] w-[350px] rounded-full border-2 border-primary/20 [animation-delay:1s]" />
            <div className="animate-pulse-ring absolute left-1/2 top-1/2 h-[350px] w-[350px] rounded-full border border-primary/15 [animation-delay:2s]" />
            {/* Outer rings - slow */}
            <div className="animate-pulse-ring-slow absolute left-1/2 top-1/2 h-[500px] w-[500px] rounded-full border border-primary/20" />
            <div className="animate-pulse-ring-slow absolute left-1/2 top-1/2 h-[500px] w-[500px] rounded-full border border-primary/15 [animation-delay:1.3s]" />
            <div className="animate-pulse-ring-slow absolute left-1/2 top-1/2 h-[500px] w-[500px] rounded-full border border-primary/10 [animation-delay:2.6s]" />
            {/* Ambient glow */}
            <div className="absolute left-1/2 top-1/2 h-[250px] w-[250px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/5 blur-3xl" />
          </div>

           {/* Content layer */}
          <div className="relative z-10 space-y-6">
            <div className="flex flex-col items-center gap-6">
              {/* Central glowing orb */}
              <div className="animate-pulse-glow relative flex h-28 w-28 items-center justify-center rounded-full bg-primary/10 backdrop-blur-sm">
                <Users className="h-12 w-12 text-primary" />
              </div>
              <div>
                <p className="text-xl font-semibold">
                  {elapsedSeconds < 30
                    ? 'Đang tìm người phù hợp...'
                    : elapsedSeconds < 120
                      ? 'Nhiều người đang online, sắp tìm thấy rồi!'
                      : 'Đang mở rộng tìm kiếm...'}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {elapsedSeconds >= 120
                    ? 'Nếu thấy quá lâu hãy xem lại setting hồ sơ của bạn.'
                    : 'Ưu tiên người chờ đến trước!'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 rounded-xl border bg-card/80 p-4 backdrop-blur">
              <Stat icon={<Hash className="h-4 w-4" />} label="Vị trí chờ" value={`#${position}`} />
              <Stat
                icon={<Users className="h-4 w-4" />}
                label="Đang chờ"
                value={`${queueSize} người`}
              />
              <Stat
                icon={<Clock className="h-4 w-4" />}
                label="Đã chờ"
                value={formatTime(elapsedSeconds)}
              />
            </div>

            {elapsedSeconds >= 120 && (
              <p className="text-center text-xs text-muted-foreground">
                <Link href="/profile" className="text-primary hover:underline">
                  Cập nhật hồ sơ
                </Link>{' '}
                để tăng cơ hội ghép đôi nhanh hơn
              </p>
            )}

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button variant="destructive" size="lg" className="w-full rounded-full" onClick={leaveQueue}>
              Huỷ tìm kiếm
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

function PanelHeader() {
  return (
    <div>
      <div className="mb-4 flex justify-center">
        <div className="rounded-2xl bg-primary/10 p-5">
          <Users className="h-10 w-10 text-primary" />
        </div>
      </div>
      <h1 className="text-2xl font-bold">Tìm người tâm sự</h1>
      <p className="mt-2 text-muted-foreground">
        Nếu thấy quá lâu hãy xem lại setting hồ sơ của bạn.
      </p>
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-lg bg-muted/50 p-3">
      <div className="flex items-center gap-1 text-muted-foreground">{icon}</div>
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}
