//src/authcontext//
import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface User {
  id: string;
  username: string;
  email: string;
  profilePicture?: string | null;
  isDeactivated?: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<{ error?: string }>;
  signup: (username: string, email: string, password: string) => Promise<{ error?: string }>;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
  changeUsername: (newUsername: string) => Promise<{ error?: string }>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ error?: string }>;
  deactivateAccount: () => Promise<{ error?: string }>;
  reactivateAccount: () => Promise<{ error?: string }>;
  deleteAccount: () => Promise<{ error?: string }>;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const apiUrl =
    import.meta.env.VITE_API_URL || "https://pinterest-backend-088x.onrender.com";

  useEffect(() => {
    const storedToken = localStorage.getItem("auth_token");
    const storedUser = localStorage.getItem("user");

    if (storedToken) {
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch (e) {
          console.error("Stored user parse error:", e);
        }
      }
      fetchUserProfile(storedToken);
    } else {
      setIsLoading(false);
    }
  }, []);

  const fetchUserProfile = async (authToken: string) => {
  try {
    const res = await fetch(`${apiUrl}/api/auth/profile`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    if (!res.ok) {
      localStorage.removeItem("auth_token");
      return;
    }

    const data = await res.json();
    const u = data.user;

    // Correct: block ONLY deactivated users
    if (u.isDeactivated === true) {
      
    }

    const normalized = {
      id: u._id,
      username: u.username,
      email: u.email,
      profilePicture: u.profilePicture || null,
      isDeactivated: u.isDeactivated || false,
    };

    setUser(normalized);
    localStorage.setItem("user", JSON.stringify(normalized));
    setToken(authToken);

  } catch (error) {
    console.error("Fetch user profile failed:", error);
  } finally {
    setIsLoading(false);
  }
};


  const login = async (email: string, password: string) => {
  try {
    const res = await fetch(`${apiUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    // ❗ If account is deactivated, show message and stop
    if (res.status === 403) {
      return { error: data.message };  // "Your account is deactivated"
    }

    if (!res.ok) {
      return { error: data.message };
    }

    localStorage.setItem("auth_token", data.token);
    setToken(data.token);

    await fetchUserProfile(data.token);
    return {};

  } catch {
    return { error: "Network error" };
  }
};

  const signup = async (username: string, email: string, password: string) => {
    try {
      const res = await fetch(`${apiUrl}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
      });

      const data = await res.json();
      if (!res.ok) return { error: data.message };

      localStorage.setItem("auth_token", data.token);
      setToken(data.token);

      await fetchUserProfile(data.token);

      return {};
    } catch {
      return { error: "Network error" };
    }
  };

  const updateUser = (updates: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return prev;

      const updated = { ...prev, ...updates };

      localStorage.setItem("user", JSON.stringify(updated));

      return updated;
    });
  };

  const logout = () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
    window.location.href = "/auth";
  };

  // ---------------- CHANGE USERNAME ----------------
  const changeUsername = async (newUsername: string) => {
    if (!token) return { error: "No token" };

    const res = await fetch(`${apiUrl}/api/auth/change-username`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ newUsername }),
    });

    const data = await res.json();
    if (!res.ok) return { error: data.message };

    updateUser({ username: data.user.username });
    return {};
  };

  // ---------------- CHANGE PASSWORD ----------------
  const changePassword = async (currentPassword: string, newPassword: string) => {
    if (!token) return { error: "No token" };

    const res = await fetch(`${apiUrl}/api/auth/change-password`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ currentPassword, newPassword }),
    });

    const data = await res.json();
    if (!res.ok) return { error: data.message };

    return {};
  };

  // ---------------- DEACTIVATE ACCOUNT ----------------
  const deactivateAccount = async () => {
    if (!token) return { error: "No token" };

    const res = await fetch(`${apiUrl}/api/auth/deactivate`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();
    if (!res.ok) return { error: data.message };

    return {};
  };

  // ---------------- REACTIVATE ACCOUNT ----------------
  const reactivateAccount = async () => {
    if (!token) return { error: "No token" };

    const res = await fetch(`${apiUrl}/api/auth/reactivate`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();
    if (!res.ok) return { error: data.message };

    return {};
  };

  // ---------------- DELETE ACCOUNT ----------------
  const deleteAccount = async () => {
    if (!token) return { error: "No token" };

    const res = await fetch(`${apiUrl}/api/auth/delete-account`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();
    if (!res.ok) return { error: data.message };

    localStorage.removeItem("auth_token");
    localStorage.removeItem("user");
    setUser(null);
    setToken(null);

    return {};
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        signup,
        logout,
        updateUser,
        changeUsername,
        changePassword,
        deactivateAccount,
        reactivateAccount,
        deleteAccount,
        isAuthenticated: !!user,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
};
