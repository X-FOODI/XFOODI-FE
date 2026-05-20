import axiosInstance from './axiosInstance';
import { API_ROUTES } from '../constants/apiRoutes';
import type { User } from './authService';

// ── Request / Response types ──────────────────────────────────────────────────

export interface UpdateProfileRequest {
  fullName: string;
  phoneNumber?: string;
  avatarUrl?: string;
  gender?: string;
  dateOfBirth?: string; // ISO date string e.g. "1995-08-20"
  address?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface UpdateProfileResponse {
  success: boolean;
  data?: User;
  message?: string;
  error?: string;
}

export interface ChangePasswordResponse {
  success: boolean;
  message?: string;
  error?: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function extractErrorMessage(error: unknown, fallback: string): never {
  const err = error as {
    response?: { status?: number; data?: { message?: string; error?: string } };
    message?: string;
    code?: string;
  };

  const backendMsg =
    err.response?.data?.message?.trim() || err.response?.data?.error?.trim();
  if (backendMsg) throw new Error(backendMsg);

  if (err.response?.status === 400) throw new Error('Invalid request data. Please check your input.');
  if (err.response?.status === 401) throw new Error('Unauthorized. Please log in again.');
  if (err.response?.status === 404) throw new Error('User not found.');
  if (err.message === 'Network Error' || err.code === 'ERR_NETWORK')
    throw new Error('Cannot connect to server. Please check your internet connection.');
  if (err.code === 'ECONNABORTED') throw new Error('Request timed out. Please try again.');

  throw new Error(fallback);
}

// ── Service ───────────────────────────────────────────────────────────────────

const userService = {
  /**
   * GET /api/auth/me — fetch the current authenticated user's profile.
   */
  async getMe(): Promise<User> {
    try {
      const response = await axiosInstance.get<UpdateProfileResponse>(API_ROUTES.AUTH.ME);
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      throw new Error(response.data.message || 'Failed to fetch profile');
    } catch (error) {
      extractErrorMessage(error, 'Failed to fetch profile');
    }
  },

  /**
   * PUT /api/users/me — update the current user's profile info.
   */
  async updateProfile(data: UpdateProfileRequest): Promise<User> {
    try {
      const response = await axiosInstance.put<UpdateProfileResponse>(
        API_ROUTES.USERS.ME,
        data
      );
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      throw new Error(response.data.message || 'Failed to update profile');
    } catch (error) {
      extractErrorMessage(error, 'Failed to update profile');
    }
  },

  /**
   * PUT /api/users/change-password — change the current user's password.
   */
  async changePassword(data: ChangePasswordRequest): Promise<void> {
    try {
      const response = await axiosInstance.put<ChangePasswordResponse>(
        API_ROUTES.USERS.CHANGE_PASSWORD,
        data
      );
      if (response.data.success) return;
      throw new Error(response.data.message || 'Failed to change password');
    } catch (error) {
      const err = error as {
        response?: { status?: number; data?: { message?: string; error?: string } };
        message?: string;
        code?: string;
      };
      // 401 on change-password specifically means wrong current password
      if (err.response?.status === 401) throw new Error('Current password is incorrect.');
      extractErrorMessage(error, 'Failed to change password');
    }
  },

  /**
   * Upload an avatar image to Cloudinary and return the secure URL.
   * Requires NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME and NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET.
   */
  async uploadAvatar(file: File): Promise<string> {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset) {
      throw new Error('Cloudinary is not configured. Please set NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME and NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET.');
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);
    formData.append('folder', 'xfoodi/avatars');

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      { method: 'POST', body: formData }
    );

    if (!res.ok) {
      throw new Error('Avatar upload failed. Please try again.');
    }

    const json = await res.json() as { secure_url: string };
    return json.secure_url;
  },
};

export default userService;
