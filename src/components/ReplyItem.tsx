// src/components/ReplyItem.tsx
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, Trash2 } from "lucide-react";
import { ReplyType } from "@/types/commentTypes";
import { useNavigate } from "react-router-dom";

interface ReplyItemProps {
  reply: ReplyType;
  currentUserId: string | null;
  pinOwnerId: string;
  onLike: (commentId: string) => Promise<void>;
  onOpenReactions: (commentId: string) => Promise<void>;
  onDelete: (commentId: string) => Promise<void>;
}

const ReplyItem = ({
  reply,
  currentUserId,
  pinOwnerId,
  onLike,
  onOpenReactions,
  onDelete,
}: ReplyItemProps) => {
  const navigate = useNavigate();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    );

    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return date.toLocaleDateString();
  };

  const canDelete =
    currentUserId === reply.user._id || currentUserId === pinOwnerId;

  return (
    <div className="flex gap-3">
      <Avatar
        className="w-6 h-6 cursor-pointer"
        onClick={() => navigate(`/profile/${reply.user.username}`)}
      >
        <AvatarImage src={reply.user.profilePicture || ""} />
        <AvatarFallback className="text-xs">
          {reply.user.username.charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1">
        <div className="bg-muted rounded-lg p-2">
          <div className="flex items-center justify-between mb-1">
            <span
              className="font-semibold text-xs cursor-pointer"
              onClick={() => navigate(`/profile/${reply.user.username}`)}
            >
              {reply.user.username}
            </span>

            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                {formatDate(reply.createdAt)}
              </span>

              {canDelete && (
                <Button
                  onClick={() => onDelete(reply._id)}
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 hover:bg-transparent"
                >
                  <Trash2 className="w-2 h-2" />
                </Button>
              )}
            </div>
          </div>

          <p className="text-xs">{reply.text}</p>
        </div>

        <div className="flex items-center gap-4 mt-1 text-xs">
          <button
            onClick={() => onLike(reply._id)}
            className="flex items-center gap-1 hover:text-red-500 transition"
          >
            <Heart
              className={`w-3 h-3 ${
                reply.isLiked ? "text-red-500 fill-red-500" : ""
              }`}
            />
            <span>{reply.likesCount || 0}</span>
          </button>

          {reply.likesCount && reply.likesCount > 0 && (
            <button
              onClick={() => onOpenReactions(reply._id)}
              className="text-muted-foreground hover:text-foreground"
            >
              ❤️ {reply.likesCount} reactions
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReplyItem;
