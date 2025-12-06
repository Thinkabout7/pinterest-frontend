// src/components/CommentItem.tsx
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Heart,
  Trash2,
  ChevronDown,
  ChevronUp,
  Send,
  X,
} from "lucide-react";
import { CommentType } from "@/types/commentTypes";
import { useNavigate } from "react-router-dom";

interface CommentItemProps {
  comment: CommentType;
  currentUserId: string | null;
  pinOwnerId: string;
  replyingToCommentId: string | null;
  replyUsername: string | null;
  replyInputOpen: boolean;

  // NEW PROPS
  expanded: boolean;
  toggleReplies: (commentId: string) => void;

  onLike: (commentId: string) => Promise<void>;
  onOpenReactions: (commentId: string) => Promise<void>;
  onReply: (parentId: string, text: string) => Promise<void>;
  onStartReply: (commentId: string, username: string) => void;
  onCancelReply: () => void;
  onDelete: (commentId: string) => Promise<void>;
  depth: number;
}

const CommentItem = ({
  comment,
  currentUserId,
  pinOwnerId,
  replyingToCommentId,
  replyUsername,
  replyInputOpen,

  expanded,
  toggleReplies,

  onLike,
  onOpenReactions,
  onReply,
  onStartReply,
  onCancelReply,
  onDelete,
  depth,
}: CommentItemProps) => {

  if (!comment || !comment._id || !comment.user) {
    console.warn("Invalid comment passed to CommentItem:", comment);
    return null;
  }

  const [replyText, setReplyText] = useState("");
  const navigate = useNavigate();

  const replies = comment.replies || [];
  const canDelete =
    currentUserId === comment.user._id || currentUserId === pinOwnerId;

  const formatDate = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const hours = Math.floor((now.getTime() - d.getTime()) / 3600000);
    if (hours < 1) return "Just now";
    if (hours < 24) return `${hours}h ago`;
    return d.toLocaleDateString();
  };

  return (
    <div className="space-y-3" style={{ marginLeft: `${depth * 20}px` }}>
      <div className="flex gap-3">
        <Avatar
          className="w-8 h-8 cursor-pointer"
          onClick={() => navigate(`/profile/${comment.user.username}`)}
        >
          <AvatarImage src={comment.user.profilePicture || ""} />
          <AvatarFallback>
            {comment.user.username?.charAt(0).toUpperCase() || "?"}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1">
          <div className="bg-muted rounded-lg p-3">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span
                  className="font-semibold text-sm cursor-pointer hover:underline"
                  onClick={() =>
                    navigate(`/profile/${comment.user.username}`)
                  }
                >
                  {comment.user.username}
                </span>

                {comment.replyToUsername && (
                  <span
                    className="text-muted-foreground text-sm cursor-pointer hover:underline"
                    onClick={() =>
                      navigate(`/profile/${comment.replyToUsername}`)
                    }
                  >
                    → {comment.replyToUsername}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  {formatDate(comment.createdAt)}
                </span>

                {canDelete && (
                  <Button
                    onClick={() => onDelete(comment._id)}
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 hover:bg-destructive/10"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                )}
              </div>
            </div>

            <p className="text-sm whitespace-pre-wrap">{comment.text}</p>
          </div>

          {/* ACTIONS */}
          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
            <button
              onClick={() => onLike(comment._id)}
              className="flex items-center gap-1 hover:text-foreground transition"
            >
              <Heart
                className={`w-4 h-4 transition ${
                  comment.isLiked ? "text-red-500 fill-red-500" : ""
                }`}
              />
              <span>{comment.likesCount || 0}</span>
            </button>

            {comment.likesCount > 0 && (
              <button
                onClick={() => onOpenReactions(comment._id)}
                className="hover:text-foreground transition"
              >
                {comment.likesCount}{" "}
                {comment.likesCount === 1 ? "reaction" : "reactions"}
              </button>
            )}

            <button
              onClick={() =>
                onStartReply(comment._id, comment.user.username)
              }
              className="hover:text-foreground transition"
            >
              Reply
            </button>

            {replies.length > 0 && (
              <button
                onClick={() => toggleReplies(comment._id)}
                className="flex items-center gap-1 hover:text-foreground transition"
              >
                {expanded ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
                {replies.length} {replies.length === 1 ? "reply" : "replies"}
              </button>
            )}
          </div>

          {/* REPLY INPUT */}
          {replyInputOpen && replyingToCommentId === comment._id && (
            <div className="mt-3 flex gap-2">
              <Textarea
                placeholder={`Reply to @${replyUsername}...`}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                className="min-h-[70px] resize-none"
                autoFocus
              />
              <div className="flex flex-col gap-2">
                <Button
                  onClick={() => {
                    if (replyText.trim()) {
                      onReply(comment._id, replyText.trim());
                      setReplyText("");
                      onCancelReply();
                    }
                  }}
                  size="sm"
                  disabled={!replyText.trim()}
                >
                  <Send className="w-4 h-4" />
                </Button>

                <Button onClick={onCancelReply} variant="ghost" size="sm">
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* NESTED REPLIES */}
      {expanded && replies.length > 0 && (
        <div className="mt-4 space-y-4 border-l-2 border-muted pl-4">
          {replies.map((reply) => (
            <CommentItem
              key={reply._id}
              comment={reply}
              currentUserId={currentUserId}
              pinOwnerId={pinOwnerId}
              replyingToCommentId={replyingToCommentId}
              replyUsername={replyUsername}
              replyInputOpen={replyInputOpen}
              expanded={expanded}           // nested uses same system
              toggleReplies={toggleReplies}
              onLike={onLike}
              onOpenReactions={onOpenReactions}
              onReply={onReply}
              onStartReply={onStartReply}
              onCancelReply={onCancelReply}
              onDelete={onDelete}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default CommentItem;
