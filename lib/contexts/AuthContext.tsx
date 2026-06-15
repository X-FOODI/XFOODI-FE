"use client";

import {
    createContext,
    ReactNode,
    useContext,
    useEffect,
    useState,
} from "react";
import authService, { LoginCredentials, User } from "../services/authService";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthReady: boolean;
  login: (credentials: LoginCredentials) => Promise<User | { requires2FA: true; tempToken: string }>;
  loginWithGoogle: (googleToken: string, rememberMe?: boolean) => Promise<User>;
  logout: () => void;
  /** Update the in-memory user state and persist to storage after a profile update. */
  updateUser: (updated: User) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Đọc user từ cả localStorage và sessionStorage (hỗ trợ rememberMe=false)
        let currentUser = authService.getCurrentUser();
        
        // Nếu không có user trong storage nhưng có cookie accessToken (do chuyển subdomain), phục hồi lại session
        if (!currentUser && typeof document !== 'undefined') {
          const cookieToken = document.cookie
            .split('; ')
            .find(row => row.trim().startsWith('accessToken='))
            ?.split('=')[1];
            
          if (cookieToken) {
            localStorage.setItem('accessToken', cookieToken);
            // Lấy thông tin user từ server
            const serverUser = await authService.getCurrentUserFromServer();
            if (serverUser) {
              currentUser = serverUser;
            }
          }
        }

        if (currentUser) {
          setUser(currentUser);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
        setUser(null);
      } finally {
        setLoading(false);
        setIsAuthReady(true);
      }
    };

    initializeAuth();
  }, []);

  // Cross-tab sync: lắng nghe khi tab khác logout (xóa accessToken khỏi storage)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "accessToken" && e.newValue === null) {
        setUser(null);
      }
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);


  const login = async (credentials: LoginCredentials): Promise<User | { requires2FA: true; tempToken: string }> => {
    try {
      const data = await authService.login(credentials);
      if (data && 'requires2FA' in data) {
        return data;
      }
      setUser(data as User);
      return data;
    } catch (error) {
      throw error;
    }
  };

  const loginWithGoogle = async (
    googleToken: string,
    rememberMe = true
  ): Promise<User> => {
    const data = await authService.loginWithGoogle(googleToken, rememberMe);
    setUser(data);
    return data;
  };

  const logout = () => {
    // Invalidate server-side session (fire-and-forget to avoid blocking UI)
    authService.logoutServer().catch(() => {});
    authService.logout();
    setUser(null);
  };

  const updateUser = (updated: User) => {
    setUser(updated);
    // Persist to whichever storage the session is using
    const serialized = JSON.stringify(updated);
    if (localStorage.getItem('accessToken')) {
      localStorage.setItem('userInfo', serialized);
    } else {
      sessionStorage.setItem('userInfo', serialized);
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, isAuthReady, login, loginWithGoogle, logout, updateUser }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
