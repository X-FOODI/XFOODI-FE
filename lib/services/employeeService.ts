import axiosInstance from './axiosInstance';
import { API_ROUTES } from '../constants/apiRoutes';

export interface Employee {
  id: string;
  userId: string | null;
  fullName: string;
  username: string;
  email: string;
  phone: string;
  avatar: string;
  role: 'Owner' | 'Waiter' | 'Kitchen Staff' | 'Kitchen' | 'Cashier' | string;
  position: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
  updatedAt: string;
  lastLogin: string | null;
}

export interface ListEmployeesParams {
  search?: string;
  role?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
  restaurantId?: string;
}

export interface ListEmployeesResponse {
  success: boolean;
  items: Employee[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface SingleEmployeeResponse {
  success: boolean;
  data: Employee;
}

export interface MutationResponse {
  success: boolean;
  message?: string;
  data?: any;
}

function extractErrorMessage(error: unknown, fallback: string): never {
  const err = error as {
    response?: { status?: number; data?: { message?: string; error?: string } };
    message?: string;
    code?: string;
  };

  const backendMsg =
    err.response?.data?.message?.trim() || err.response?.data?.error?.trim();
  if (backendMsg) throw new Error(backendMsg);

  if (err.response?.status === 400) throw new Error('Dữ liệu yêu cầu không hợp lệ. Vui lòng kiểm tra lại.');
  if (err.response?.status === 401) throw new Error('Phiên làm việc hết hạn. Vui lòng đăng nhập lại.');
  if (err.response?.status === 403) throw new Error('Bạn không có quyền thực hiện thao tác này.');
  if (err.response?.status === 404) throw new Error('Không tìm thấy nhân viên.');
  
  if (err.message === 'Network Error' || err.code === 'ERR_NETWORK')
    throw new Error('Không thể kết nối tới máy chủ. Vui lòng kiểm tra mạng của bạn.');
  if (err.code === 'ECONNABORTED') throw new Error('Quá thời gian chờ phản hồi. Vui lòng thử lại.');

  throw new Error(fallback);
}

const employeeService = {
  async list(params: ListEmployeesParams = {}): Promise<ListEmployeesResponse> {
    try {
      const response = await axiosInstance.get<ListEmployeesResponse>(
        API_ROUTES.EMPLOYEES.LIST,
        { params }
      );
      return response.data;
    } catch (error) {
      extractErrorMessage(error, 'Không thể tải danh sách nhân viên.');
    }
  },

  async getById(id: string): Promise<Employee> {
    try {
      const response = await axiosInstance.get<SingleEmployeeResponse>(
        API_ROUTES.EMPLOYEES.DETAIL(id)
      );
      return response.data.data;
    } catch (error) {
      extractErrorMessage(error, 'Không thể tải thông tin nhân viên.');
    }
  },

  async create(data: any): Promise<MutationResponse> {
    try {
      const response = await axiosInstance.post<MutationResponse>(
        API_ROUTES.EMPLOYEES.CREATE,
        data
      );
      return response.data;
    } catch (error) {
      extractErrorMessage(error, 'Tạo nhân viên thất bại.');
    }
  },

  async update(id: string, data: any): Promise<MutationResponse> {
    try {
      const response = await axiosInstance.put<MutationResponse>(
        API_ROUTES.EMPLOYEES.UPDATE(id),
        data
      );
      return response.data;
    } catch (error) {
      extractErrorMessage(error, 'Cập nhật nhân viên thất bại.');
    }
  },

  async delete(id: string): Promise<MutationResponse> {
    try {
      const response = await axiosInstance.delete<MutationResponse>(
        API_ROUTES.EMPLOYEES.DELETE(id)
      );
      return response.data;
    } catch (error) {
      extractErrorMessage(error, 'Xóa nhân viên thất bại.');
    }
  },

  async resetPassword(id: string, data: any): Promise<MutationResponse> {
    try {
      const response = await axiosInstance.patch<MutationResponse>(
        API_ROUTES.EMPLOYEES.RESET_PASSWORD(id),
        data
      );
      return response.data;
    } catch (error) {
      extractErrorMessage(error, 'Đặt lại mật khẩu thất bại.');
    }
  },
};

export default employeeService;
