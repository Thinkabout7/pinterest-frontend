import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface User {
  id: string;
  username: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<{ error?: string }>;
  signup: (username: string, email: string, password: string) => Promise<{ error?: string }>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const apiUrl = import.meta.env.VITE_API_URL || "https://pinterest-backend-088x.onrender.com";

  // Check for existing token on mount
  useEffect(() => {
    const storedToken = localStorage.getItem("auth_token");
    if (storedToken) {
      fetchUserProfile(storedToken);
    } else {
      setIsLoading(false);
    }
  }, []);

  const fetchUserProfile = async (authToken: string) => {
    try {
      const response = await fetch(`${apiUrl}/api/auth/profile`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (response.ok) {
        const responseData = await response.json();
        // Backend returns { message: "...", user: {...} }
        const userData = responseData.user || responseData;
        // Map _id to id for consistency
        const normalizedUser = {
          id: userData._id || userData.id,
          username: userData.username,
          email: userData.email
        };
        setUser(normalizedUser);
        setToken(authToken);
      } else {
        // Token is invalid, clear it
        localStorage.removeItem("auth_token");
        setToken(null);
        setUser(null);
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
      localStorage.removeItem("auth_token");
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch(`${apiUrl}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { error: data.message || "Login failed. Please check your credentials." };
      }

      const authToken = data.token;
      localStorage.setItem("auth_token", authToken);
      setToken(authToken);

      // Fetch user profile
      await fetchUserProfile(authToken);

      return {};
    } catch (error) {
      return { error: "Network error. Please try again." };
    }
  };

  const signup = async (username: string, email: string, password: string) => {
    try {
      const response = await fetch(`${apiUrl}/api/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { error: data.message || "Signup failed. Please try again." };
      }

      const authToken = data.token;
      localStorage.setItem("auth_token", authToken);
      setToken(authToken);

      // Fetch user profile
      await fetchUserProfile(authToken);

      return {};
    } catch (error) {
      return { error: "Network error. Please try again." };
    }
  };

  const logout = () => {
    localStorage.removeItem("auth_token");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        signup,
        logout,
        isAuthenticated: !!user,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
