'use client';

import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Image from 'next/image';
import { Camera, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { profileApi, getAvatarUrl, type Gender, type ProfileData } from '@/lib/profile-api';
import { useAuthStore } from '@/store/authStore';

const schema = z.object({
  displayName: z.string().min(2, 'Tên ít nhất 2 ký tự').max(30),
  gender: z.enum(['male', 'female', 'other'], { required_error: 'Chọn giới tính' }),
  age: z.coerce.number().min(13, 'Tuổi tối thiểu 13').max(99),
  bio: z.string().max(200).optional(),
  chatPreference: z.enum(['opposite', 'same', 'any']).default('any'),
  preferredGender: z
    .union([z.enum(['male', 'female', 'other']), z.literal('')])
    .optional()
    .transform((v) => (v === '' ? undefined : v)),
});

type FormData = z.infer<typeof schema>;

const getOppositeGender = (gender?: Gender): Gender | undefined => {
  if (gender === 'male') return 'female';
  if (gender === 'female') return 'male';
  return undefined;
};

const getInitialGender = (initialData: ProfileData, authGender?: Gender | null) =>
  initialData.profile?.gender ?? initialData.user.gender ?? authGender ?? undefined;

const getFormDefaults = (initialData: ProfileData, authGender?: Gender | null) => {
  const hasProfile = !!initialData.profile;
  const gender = getInitialGender(initialData, authGender);
  const oppositeGender = getOppositeGender(gender);

  return {
    displayName: initialData.user.displayName,
    gender,
    age: initialData.profile?.age,
    bio: initialData.profile?.bio || '',
    chatPreference: hasProfile ? initialData.profile?.chatPreference || 'any' : 'opposite',
    preferredGender: hasProfile ? initialData.profile?.preferredGender : oppositeGender,
  };
};

interface Props {
  initialData: ProfileData;
  onSaved: (data: ProfileData) => void;
  onCancel: () => void;
}

export function ProfileForm({ initialData, onSaved, onCancel }: Props) {
  const { toast } = useToast();
  const { setUser, user, pendingGender } = useAuthStore();
  const authGender = user?.gender ?? pendingGender;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarPreview, setAvatarPreview] = useState(
    getAvatarUrl(initialData.profile?.avatar || initialData.user.avatar),
  );
  const [isUploading, setIsUploading] = useState(false);

  const hasProfile = !!initialData.profile;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: getFormDefaults(initialData, authGender),
  });

  useEffect(() => {
    reset(getFormDefaults(initialData, authGender));
    setAvatarPreview(getAvatarUrl(initialData.profile?.avatar || initialData.user.avatar));
  }, [authGender, initialData, reset]);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const result = await profileApi.uploadAvatar(file);
      setAvatarPreview(result.fullUrl || getAvatarUrl(result.avatarUrl));
      setUser({
        ...useAuthStore.getState().user!,
        displayName: result.profile.user.displayName,
        avatar: result.avatarUrl,
      });
      toast({ title: 'Đã cập nhật ảnh đại diện' });
      onSaved(result.profile);
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Upload thất bại', description: err.message });
    } finally {
      setIsUploading(false);
    }
  };

  const onSubmit = async (data: FormData) => {
    try {
      const payload = {
        displayName: data.displayName,
        gender: data.gender,
        age: data.age,
        bio: data.bio,
        chatPreference: data.chatPreference,
        preferredGender: data.preferredGender,
      };

      const result = hasProfile
        ? await profileApi.patch(payload)
        : await profileApi.create(payload as any);

      setUser({
        ...useAuthStore.getState().user!,
        displayName: result.user.displayName,
        avatar: result.user.avatar,
      });

      toast({ title: 'Đã lưu hồ sơ' });
      onSaved(result);
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Lưu thất bại',
        description: err.message || 'Vui lòng thử lại',
      });
    }
  };

  const selectClass =
    'w-full rounded-md border border-input bg-background px-3 py-2 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:text-sm';

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 rounded-xl border p-6">
      {/* Avatar upload */}
      <div className="flex flex-col items-center gap-3">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="group relative h-24 w-24 overflow-hidden rounded-full border-2 border-dashed border-primary/40 bg-muted transition hover:border-primary"
        >
          {avatarPreview ? (
            <Image src={avatarPreview} alt="Avatar" fill className="object-cover" unoptimized />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-muted-foreground">
              <Camera className="h-8 w-8" />
            </div>
          )}
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition group-hover:opacity-100">
            {isUploading ? (
              <Loader2 className="h-6 w-6 animate-spin text-white" />
            ) : (
              <Camera className="h-6 w-6 text-white" />
            )}
          </div>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={handleAvatarChange}
        />
        <p className="text-xs text-muted-foreground">Nhấn để đổi ảnh (JPEG, PNG, WebP, tối đa 5MB)</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="displayName">Tên hiển thị</Label>
        <Input id="displayName" {...register('displayName')} />
        {errors.displayName && (
          <p className="text-xs text-destructive">{errors.displayName.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label>Giới tính</Label>
        <select {...register('gender')} className={selectClass}>
          <option value="" disabled>
            -- Chọn giới tính --
          </option>
          <option value="male">Nam</option>
          <option value="female">Nữ</option>
          <option value="other">Khác</option>
        </select>
        {errors.gender && <p className="text-xs text-destructive">{errors.gender.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="age">Tuổi</Label>
        <Input id="age" type="number" min={13} max={99} {...register('age')} />
        {errors.age && <p className="text-xs text-destructive">{errors.age.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="bio">Giới thiệu (tuỳ chọn)</Label>
        <textarea
          id="bio"
          {...register('bio')}
          rows={3}
          maxLength={200}
          className={selectClass}
          placeholder="Một vài điều về bạn..."
        />
      </div>

      <div className="space-y-2">
        <Label>Muốn chat với</Label>
        <select {...register('chatPreference')} className={selectClass}>
          <option value="any">Bất kỳ ai</option>
          <option value="opposite">Giới tính ngược lại</option>
          <option value="same">Cùng giới tính</option>
        </select>
      </div>

      <div className="space-y-2">
        <Label>Giới tính đối phương ưu tiên (tuỳ chọn)</Label>
        <select {...register('preferredGender')} className={selectClass}>
          <option value="">Không chọn</option>
          <option value="male">Nam</option>
          <option value="female">Nữ</option>
          <option value="other">Khác</option>
        </select>
      </div>

      <div className="flex gap-3">
        <Button type="button" variant="outline" className="flex-1" onClick={onCancel}>
          Huỷ
        </Button>
        <Button type="submit" className="flex-1" disabled={isSubmitting || isUploading}>
          {isSubmitting ? 'Đang lưu...' : 'Lưu hồ sơ'}
        </Button>
      </div>
    </form>
  );
}
