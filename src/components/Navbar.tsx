// src/components/Navbar.tsx

import { Search, LogOut, User, Plus, Settings, Bell, X } from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useEffect, useState } from "react";
import SearchSuggestions from "@/components/SearchSuggestions";

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // ⭐️ NEW: detect deactivated user
  const isDeactivated = user?.isDeactivated;

  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showOverlay, setShowOverlay] = useState(false);
  const [recent, setRecent] = useState<string[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const apiUrl =
    import.meta.env.VITE_API_URL ||
    "https://pinterest-backend-088x.onrender.com";

  // Load recent search history
  useEffect(() => {
    const r = JSON.parse(localStorage.getItem("recent_searches") || "[]");
    setRecent(r);
  }, []);

  const saveRecent = (text: string) => {
    let r = JSON.parse(localStorage.getItem("recent_searches") || "[]");
    r = [text, ...r.filter((x: string) => x !== text)].slice(0, 8);
    localStorage.setItem("recent_searches", JSON.stringify(r));
    setRecent(r);
  };

  const removeRecent = (text: string) => {
    let r = JSON.parse(localStorage.getItem("recent_searches") || "[]");
    r = r.filter((x: string) => x !== text);
    localStorage.setItem("recent_searches", JSON.stringify(r));
    setRecent(r);
  };

  const handleSubmit = (text: string) => {
    if (!text.trim()) return;
    saveRecent(text);
    navigate(`/search?q=${encodeURIComponent(text)}`);
    setShowOverlay(false);
  };

  // LIVE SUGGESTIONS
  useEffect(() => {
    if (!showOverlay || !query.trim()) {
      setSuggestions([]);
      return;
    }

    const load = async () => {
      try {
        const res = await fetch(
          `${apiUrl}/api/search?q=${encodeURIComponent(query)}`
        );
        if (!res.ok) return;

        const data = await res.json();
        setSuggestions(data.suggestions || []);
      } catch {}
    };

    load();
  }, [query, showOverlay]);

  // Load unread notifications
  useEffect(() => {
    const loadUnread = async () => {
      try {
        const token = localStorage.getItem("auth_token");

        const res = await fetch(`${apiUrl}/api/notifications/unread/count`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) return;

        const data = await res.json();
        setUnreadCount(data.unreadCount || 0);
      } catch {}
    };

    loadUnread();
  }, []);

  return (
    <nav className="sticky top-0 z-50 bg-card border-b border-border">
      <div className="container mx-auto px-4 py-3 flex items-center gap-4">

        {/* Logo untouched */}
        <Link to="/home" className="flex items-center gap-2">
          <div className="bg-primary text-primary-foreground rounded-full p-2">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 19c-.721 0-1.418-.158-2.063-.463l2.063-4.063V9.5c0-.276.224-.5.5-.5h3c.276 0 .5.224.5.5v4.974l2.063 4.063A6.978 6.978 0 0 1 12 19zm5.684-2.316L15 13.974V9.5c0-1.378-1.122-2.5-2.5-2.5h-3c-1.378 0-2.5 1.122-2.5 2.5v4.474l-2.684 2.71A6.96 6.96 0 0 1 5 12c0-3.86 3.14-7 7-7s7 3.14 7 7a6.96 6.96 0 0 1-.316 2.684z"/>
            </svg>
          </div>
          <span className="text-xl font-bold">Pinterest</span>
        </Link>

        {/* Search bar trigger */}
        <div className="flex-1 max-w-2xl">
          <div
            className="relative cursor-pointer"
            onClick={() => setShowOverlay(true)}
          >
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder={
                location.pathname.startsWith("/profile/")
                  ? "Search your Pins…"
                  : "Search…"
              }
              className="pl-10 bg-secondary border-none pointer-events-none"
            />
          </div>
        </div>

        {/* Right side (normal users) */}
        {isAuthenticated && !isDeactivated && (
          <div className="flex items-center gap-3">
            <Button onClick={() => navigate("/create")} size="sm" className="gap-2">
              <Plus className="w-4 h-4" /> Create
            </Button>

            <button
              onClick={() => navigate("/notifications")}
              className="relative"
            >
              <Bell className="h-6 w-6" />

              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-destructive text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2">
                  <Avatar className="w-8 h-8">
                    {user?.profilePicture ? (
                      <AvatarImage src={user.profilePicture} />
                    ) : (
                      <AvatarFallback>{user?.username?.[0]}</AvatarFallback>
                    )}
                  </Avatar>
                  <span className="hidden md:inline">{user?.username}</span>
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => navigate(`/profile/${user?.username}`)}>
                  <User className="mr-2 h-4 w-4" /> View Profile
                </DropdownMenuItem>

                <DropdownMenuItem onClick={() => navigate("/settings")}>
                  <Settings className="mr-2 h-4 w-4" /> Settings
                </DropdownMenuItem>

                <DropdownMenuItem onClick={logout}>
                  <LogOut className="mr-2 h-4 w-4" /> Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}

        {/* ⭐️ NEW: Right side for DEACTIVATED USERS */}
        {isAuthenticated && isDeactivated && (
          <div className="flex items-center gap-3 ml-auto">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2">
                  <Avatar className="w-8 h-8">
                    {user?.profilePicture ? (
                      <AvatarImage src={user.profilePicture} />
                    ) : (
                      <AvatarFallback>{user?.username?.[0]}</AvatarFallback>
                    )}
                  </Avatar>
                  <span className="hidden md:inline">{user?.username}</span>
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => navigate("/settings")}>
                  <Settings className="mr-2 h-4 w-4" /> Reactivate Account
                </DropdownMenuItem>

                <DropdownMenuItem onClick={logout}>
                  <LogOut className="mr-2 h-4 w-4" /> Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}

      </div>

      {/* Fullscreen overlay */}
      {showOverlay && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[999] flex justify-center px-4 animate-fadeIn">
          <div className="absolute inset-x-0 top-16 mx-auto max-w-2xl p-4">

            <div className="relative bg-white shadow-xl rounded-2xl p-4 animate-slideDown">

              <div className="relative mb-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2" />

                <Input
                  autoFocus
                  value={query}
                  placeholder={
                    location.pathname.startsWith("/profile/")
                      ? "Search your Pins…"
                      : "Search…"
                  }
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === "Enter" && handleSubmit(query)
                  }
                  className="pl-10 pr-10"
                />

                {query && (
                  <X
                    onClick={() => setQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer"
                  />
                )}
              </div>

              {/* Recent or suggestions */}
              {query.length === 0 ? (
                <div className="mt-4 space-y-2">
                  <p className="text-sm text-muted-foreground">Recent Searches</p>

                  {recent.length === 0 && (
                    <p className="text-sm text-muted-foreground">No history</p>
                  )}

                  {recent.map((r, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-100 cursor-pointer"
                    >
                      <span onClick={() => handleSubmit(r)}>{r}</span>
                      <X
                        className="h-4 w-4 text-gray-500 cursor-pointer"
                        onClick={() => removeRecent(r)}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                suggestions.length > 0 && (
                  <SearchSuggestions
                    suggestions={suggestions}
                    onSelect={handleSubmit}
                  />
                )
              )}
            </div>

            <div className="text-center mt-3">
              <button
                className="text-white text-lg font-semibold"
                onClick={() => setShowOverlay(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
