// src/pages/Notifications.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type NotificationType = "like" | "comment" | "follow";

interface Sender {
  _id: string;
  username: string;
  profilePicture?: string | null;
}

interface PinRef {
  _id: string;
  title?: string;
  mediaUrl?: string;
}

interface NotificationItem {
  _id: string;
  type: NotificationType;
  message: string;
  isRead: boolean;
  createdAt: string;
  sender?: Sender;
  pin?: PinRef | null;
}

const Notifications = () => {
  const { user, token, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);

  const apiUrl =
    import.meta.env.VITE_API_URL ||
    "https://pinterest-backend-088x.onrender.com";

  const timeAgo = (iso: string) => {
    const now = new Date().getTime();
    const then = new Date(iso).getTime();
    const diff = Math.max(0, now - then);

    const sec = Math.floor(diff / 1000);
    if (sec < 60) return `${sec || 1}s`;

    const min = Math.floor(sec / 60);
    if (min < 60) return `${min}m`;

    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr}h`;

    const day = Math.floor(hr / 24);
    return `${day}d`;
  };

  const loadNotifications = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/api/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to load notifications");
      const data = await res.json();
      setNotifications(data || []);
    } catch (_err) {
      toast({
        title: "Error",
        description: "Could not load notifications",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    loadNotifications();
  }, [isAuthenticated, token]);

  // 🟢 Check follow status for a sender
  const checkStatus = async (senderId: string) => {
    if (!token) return { isFollowing: false, isFollowedBySender: false };
    const res = await fetch(`${apiUrl}/api/follow/check/${senderId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  };

  // 🟢 Follow
  const follow = async (senderId: string) => {
    if (!token) return;
    await fetch(`${apiUrl}/api/follow/${senderId}/follow`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
  };

  // 🟢 Unfollow
  const unfollow = async (senderId: string) => {
    if (!token) return;
    await fetch(`${apiUrl}/api/follow/${senderId}/unfollow`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
  };

  const handleClearAll = async () => {
    if (!token) return;
    setClearing(true);
    try {
      const res = await fetch(`${apiUrl}/api/notifications`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to clear notifications");

      setNotifications([]);

      // bell -> 0
      window.dispatchEvent(new Event("notifications-cleared"));
      toast({ title: "Notifications cleared" });
    } catch (_err) {
      toast({
        title: "Error",
        description: "Could not clear notifications",
        variant: "destructive",
      });
    } finally {
      setClearing(false);
    }
  };

  const handleOpenNotification = async (notif: NotificationItem) => {
    if (!token) return;

    if (!notif.isRead) {
      try {
        await fetch(`${apiUrl}/api/notifications/${notif._id}/read`, {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}` },
        });

        setNotifications((prev) =>
          prev.map((n) =>
            n._id === notif._id ? { ...n, isRead: true } : n
          )
        );

        // bell count -1
        window.dispatchEvent(new Event("notification-read"));
      } catch {
        // ignore
      }
    }

    if (notif.pin?._id) {
      navigate(`/pin/${notif.pin._id}`);
    } else if (notif.sender?._id) {
      navigate(`/profile/${notif.sender.username}`);
    }
  };

  // 🟢 Follow button text helper
  const FollowButton = ({ senderId }: { senderId: string }) => {
    const [state, setState] = useState<
      "loading" | "follow" | "followBack" | "following"
    >("loading");

    useEffect(() => {
      let cancelled = false;

      const load = async () => {
        const res = await checkStatus(senderId);
        if (cancelled) return;

        if (res.isFollowing) setState("following");
        else if (res.isFollowedBySender) setState("followBack");
        else setState("follow");
      };
      load();

      return () => {
        cancelled = true;
      };
    }, [senderId]);

    const handleClick = async () => {
      if (state === "follow" || state === "followBack") {
        await follow(senderId);
        setState("following");
      } else if (state === "following") {
        await unfollow(senderId);
        setState("followBack");
      }
    };

    if (state === "loading") return null;

    return (
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleClick();
        }}
        className={`px-3 py-1 rounded-full text-sm font-medium border ${
          state === "following"
            ? "bg-white text-black border-gray-300"
            : "bg-red-600 text-white border-red-600"
        }`}
      >
        {state === "follow"
          ? "Follow"
          : state === "followBack"
          ? "Follow back"
          : "Following"}
      </button>
    );
  };

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-10">
          <p className="text-center text-muted-foreground">
            Please log in to see your notifications.
          </p>
          <div className="flex justify-center mt-4">
            <Button onClick={() => navigate("/auth")}>Go to Login</Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Notifications</h1>

          {notifications.length > 0 && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleClearAll}
              disabled={clearing}
            >
              Clear all
            </Button>
          )}
        </div>

        {loading ? (
          <p className="text-center text-muted-foreground">Loading…</p>
        ) : notifications.length === 0 ? (
          <p className="text-center text-muted-foreground">
            You have no notifications yet.
          </p>
        ) : (
          <div className="space-y-2">
            {notifications.map((notif) => (
              <div
                key={notif._id}
                onClick={() => handleOpenNotification(notif)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition cursor-pointer ${
                  notif.isRead ? "opacity-70" : "bg-accent/40"
                }`}
              >
                <Avatar className="w-9 h-9">
                  {notif.sender?.profilePicture ? (
                    <AvatarImage src={notif.sender.profilePicture} />
                  ) : (
                    <AvatarFallback>
                      {notif.sender?.username
                        ? notif.sender.username.charAt(0).toUpperCase()
                        : "U"}
                    </AvatarFallback>
                  )}
                </Avatar>

                <div className="flex-1">
                  <p className="text-sm">
                    <span className="font-semibold">
                      {notif.sender?.username ?? "Someone"}
                    </span>{" "}
                    {notif.message.replace(
                      notif.sender?.username ?? "",
                      ""
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {timeAgo(notif.createdAt)}
                  </p>
                </div>

                {/* ⭐ FOLLOW / FOLLOW BACK / FOLLOWING BUTTON */}
                {notif.type === "follow" && notif.sender?._id && (
                  <FollowButton senderId={notif.sender._id} />
                )}

                {!notif.isRead && (
                  <span className="w-2 h-2 rounded-full bg-primary" />
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Notifications;

