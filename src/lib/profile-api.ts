import { apiClient } from './api';

export type Gender = 'male' | 'female' | 'other';
export type ChatPreference = Gender;

export interface ProfileData {
  user: {
    id: string;
    email: string;
    displayName: string;
    avatar: string;
    gender?: Gender;
    role: string;
    isEmailVerified: boolean;
  };
  profile: {
    id: string;
    gender: Gender;
    age: number;
    bio: string;
    avatar: string;
    chatPreference: ChatPreference;
    isVip: boolean;
  } | null;
  isComplete: boolean;
}

export interface CreateProfilePayload {
  displayName?: string;
  gender: Gender;
  age: number;
  bio?: string;
  chatPreference?: ChatPreference;
}

export type UpdateProfilePayload = Partial<CreateProfilePayload>;

export type AccountDeletionRequestStatus = 'none' | 'pending' | 'completed' | 'rejected';

export interface AccountDeletionRequest {
  requested: boolean;
  requestId: string | null;
  status: AccountDeletionRequestStatus;
  requestedAt: string | null;
  deletionDueAt: string | null;
  message: string;
}

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';

export function getAvatarUrl(path: string | undefined | null): string {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return `${BACKEND_URL}${path}`;
}

export const profileApi = {
  get: () => apiClient.get<any, ProfileData>('/profile'),

  create: (data: CreateProfilePayload) => apiClient.post<any, ProfileData>('/profile', data),

  update: (data: CreateProfilePayload) => apiClient.put<any, ProfileData>('/profile', data),

  patch: (data: UpdateProfilePayload) => apiClient.patch<any, ProfileData>('/profile', data),

  remove: () => apiClient.delete<any, { message: string }>('/profile'),

  uploadAvatar: async (file: File) => {
    const formData = new FormData();
    formData.append('avatar', file);

    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : '';
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'}/profile/avatar`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });

    const json = await res.json();
    if (!res.ok) {
      const message = json?.message || 'Upload thất bại';
      throw new Error(Array.isArray(message) ? message[0] : message);
    }
    return (json.data ?? json) as {
      avatarUrl: string;
      fullUrl: string;
      profile: ProfileData;
    };
  },
};

export const userApi = {
  getMe: () =>
    apiClient.get<
      any,
      {
        id: string;
        email: string;
        displayName: string;
        avatar: string;
        role: string;
        isEmailVerified: boolean;
      }
    >('/users/me'),

  updateMe: (data: { displayName?: string; avatar?: string }) =>
    apiClient.patch<any, { id: string; displayName: string; avatar: string }>('/users/me', data),

  getAccountDeletionRequest: () =>
    apiClient.get<any, AccountDeletionRequest>('/users/me/deletion-request'),

  requestAccountDeletion: () =>
    apiClient.post<any, AccountDeletionRequest>('/users/me/deletion-request'),
};
