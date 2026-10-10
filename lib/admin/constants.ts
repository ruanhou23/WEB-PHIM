/**
 * Các hằng số dùng chung cho auth.
 * File này KHÔNG import firebase-admin → an toàn cho Edge Runtime (middleware).
 */

// Admin session
export const SESSION_COOKIE_NAME = "admin_session";
export const SESSION_MAX_AGE = 60 * 60 * 8; // 8 giờ

// Viewer session (người xem được cấp quyền)
export const VIEWER_SESSION_COOKIE_NAME = "viewer_session";
export const VIEWER_SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 ngày
