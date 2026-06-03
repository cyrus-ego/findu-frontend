/** Cookie lưu roomId hiện tại để middleware có thể đọc (SSR-safe). */
const ROOM_COOKIE = 'active-room-id';

/** Thời gian tồn tại của cookie phòng chat: 24 giờ. */
const ROOM_COOKIE_MAX_AGE = 60 * 60 * 24;

/** Đọc roomId từ cookie. */
export function getRoomCookie(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${ROOM_COOKIE}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

/** Ghi roomId vào cookie khi user join phòng thành công. */
export function setRoomCookie(roomId: string) {
  if (typeof document === 'undefined') return;
  document.cookie = `${ROOM_COOKIE}=${roomId}; path=/; max-age=${ROOM_COOKIE_MAX_AGE}; SameSite=Lax`;
}

/** Xóa cookie phòng chat khi user rời phòng hoặc phòng đóng. */
export function clearRoomCookie() {
  if (typeof document === 'undefined') return;
  document.cookie = `${ROOM_COOKIE}=; path=/; max-age=0`;
}
