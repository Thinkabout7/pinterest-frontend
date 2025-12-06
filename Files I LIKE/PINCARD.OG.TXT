// src/components/PinCard.tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Bookmark, BookmarkCheck, MoreHorizontal } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface PinCardProps {
  id: string;
  imageUrl?: string;
  mediaUrl?: string;
  mediaType?: "image" | "video";
  title?: string;
  description?: string;
  isSaved?: boolean;
  onSaveChange?: (pinId: string, nowSaved: boolean) => void;
  hideBoardButton?: boolean;
  showSaveButton?: boolean;
  showEditButton?: boolean;
}

const PinCard = ({
  id,
  imageUrl,
  mediaUrl,
  mediaType = "image",
  title,
  description,
  isSaved = false,
  onSaveChange,
  hideBoardButton = false,
  showSaveButton = false,
  showEditButton = false,
}: PinCardProps) => {
  const navigate = useNavigate();
  const { isAuthenticated, token, user } = useAuth();
  const { toast } = useToast();

  const [saved, setSaved] = useState(isSaved);
  const [loading, setLoading] = useState(false);

  const apiUrl =
    import.meta.env.VITE_API_URL ||
    "https://pinterest-backend-088x.onrender.com";

  useEffect(() => {
    setSaved(isSaved);
  }, [isSaved]);

  const handleSaveToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!isAuthenticated) {
      toast({
        title: "Login Required",
        description: "Please login to save pins",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }

    setLoading(true);

    try {
      const method = saved ? "DELETE" : "POST";

      const res = await fetch(`${apiUrl}/api/saved/profile/${id}`, {
        method,
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Failed");

      const newState = !saved;
      setSaved(newState);
      onSaveChange?.(id, newState);

      toast({
        title: newState ? "Saved!" : "Removed",
        description: newState
          ? "Pin saved to your profile"
          : "Pin removed from your saved pins",
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to update save status",
        variant: "destructive",
      });
    }

    setLoading(false);
  };

  const handleView = () => navigate(`/pin/${id}`);

  const handleEditMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/pin/${id}/edit`);
  };

  return (
    <div
      className="relative group cursor-pointer break-inside-avoid mb-4"
      onClick={handleView}
    >
      <div className="rounded-2xl overflow-hidden bg-card shadow-[var(--shadow-card)]">
        {mediaType === "video" ? (
          <video
            src={mediaUrl || imageUrl}
            className="w-full h-auto object-cover"
            muted
            loop
            playsInline
            autoPlay
            preload="metadata"
          />
        ) : (
          <img
            src={mediaUrl || imageUrl}
            alt={title || "Pin"}
            className="w-full h-auto object-cover"
            loading="lazy"
          />
        )}
      </div>

      {title && (
        <div className="mt-2 px-2">
          <p className="text-sm font-medium text-foreground line-clamp-2">
            {title}
          </p>
        </div>
      )}

      {showSaveButton && (
        <button
          onClick={handleSaveToggle}
          disabled={loading}
          className="absolute top-2 right-2 bg-white rounded-full p-2 shadow animate-bounce"
        >
          {saved ? (
            <BookmarkCheck className="w-5 h-5 text-primary" />
          ) : (
            <Bookmark className="w-5 h-5" />
          )}
        </button>
      )}

      {showEditButton && user && (
        <button
          onClick={handleEditMenu}
          className="absolute bottom-2 right-2 bg-white rounded-full p-2 shadow opacity-0 group-hover:opacity-100 transition"
        >
          <MoreHorizontal className="w-5 h-5" />
        </button>
      )}
    </div>
  );
};

export default PinCard;
