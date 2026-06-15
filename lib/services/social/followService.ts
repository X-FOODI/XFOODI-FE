import axiosInstance from '../axiosInstance';

const SOCIAL_BASE = '/social';

const followService = {
  async follow(userId: string): Promise<void> {
    await axiosInstance.post(`${SOCIAL_BASE}/follows`, { userId });
  },

  async unfollow(userId: string): Promise<void> {
    await axiosInstance.delete(`${SOCIAL_BASE}/follows/${userId}`);
  },
};

export default followService;
