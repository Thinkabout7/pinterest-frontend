// src/components/CommentBox.tsx
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import CommentItem from "@/components/CommentItem";
import ReactionModal from "@/components/ReactionModal";
import { CommentType, UserType } from "@/types/commentTypes";
import {
  fetchComments,
  postComment,
  postReply,
  deleteComment,
  toggleLikeComment,
  getCommentLikes,
} from "@/lib/commentApi";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";

interface CommentBoxProps {
  pinId: string;
  pinOwnerId: string;
  onCommentsChange?: (count: number) => void;
}

const CommentBox = ({ pinId, pinOwnerId, onCommentsChange }: CommentBoxProps) => {
  const [comments, setComments] = useState<CommentType[]>([]);
  const [newComment, setNewComment] = useState("");

  const [replyingToCommentId, setReplyingToCommentId] = useState<string | null>(null);
  const [replyUsername, setReplyUsername] = useState<string | null>(null);
  const [replyInputOpen, setReplyInputOpen] = useState(false);

  const [isCommentBoxOpen, setIsCommentBoxOpen] = useState(false);
  const [isAddingComment, setIsAddingComment] = useState(false);

  const [reactionsModalOpen, setReactionsModalOpen] = useState(false);
  const [reactionUsers, setReactionUsers] = useState<UserType[]>([]);

  const { user, token, isLoading: authLoading } = useAuth();
  const { toast } = useToast();

  const isDeactivated = user?.isDeactivated === true;
  const block = () =>
    toast({
      title: "Account Disabled",
      description: "Reactivate your account to use this feature.",
      variant: "destructive",
    });

  // 🔥 NEW: Reply expand state
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});

  const toggleReplies = (commentId: string) => {
    setExpandedComments((prev) => ({
      ...prev,
      [commentId]: !prev[commentId],
    }));
  };

  useEffect(() => {
    if (!authLoading && token) {
      loadComments();
    } else if (!authLoading) {
      setComments([]);
      onCommentsChange?.(0);
    }
  }, [pinId, token, authLoading]);

  const loadComments = async () => {
    if (!token) return;

    try {
      const { comments, totalCount } = await fetchComments(pinId, token);
      setComments(comments || []);
      onCommentsChange?.(totalCount || 0);
    } catch {
      setComments([]);
      onCommentsChange?.(0);
    }
  };

  return (
    <div className="space-y-4">
      {/* Add comment */}
      {!isCommentBoxOpen ? (
        <button
          onClick={() => {
            if (isDeactivated) return block();
            setIsCommentBoxOpen(true);
          }}
          className="text-muted-foreground hover:text-foreground text-sm"
        >
          Add a comment...
        </button>
      ) : (
        <div className="flex gap-3">
          <Avatar className="w-8 h-8">
            <AvatarImage src={user?.profilePicture || ""} />
            <AvatarFallback>
              {user?.username?.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 space-y-2">
            <Textarea
              placeholder="Add a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="min-h-[80px]"
            />

            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setNewComment("");
                  setIsCommentBoxOpen(false);
                }}
              >
                Cancel
              </Button>

              <Button
                size="sm"
                disabled={!newComment.trim() || isAddingComment || isDeactivated}
                onClick={async () => {
                  if (!newComment.trim() || !token) return;
                  if (isDeactivated) return block();
                  setIsAddingComment(true);

                  try {
                    await postComment(pinId, newComment.trim(), token);
                    setNewComment("");
                    setIsCommentBoxOpen(false);
                    await loadComments();
                  } catch {
                    toast({
                      title: "Error",
                      description: "Failed to post comment",
                      variant: "destructive",
                    });
                  } finally {
                    setIsAddingComment(false);
                  }
                }}
              >
                {isAddingComment ? "Posting..." : "Post"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* COMMENTS */}
      <div className="space-y-4">
        {comments.map((comment) => (
          <CommentItem
            key={comment._id}
            comment={comment}
            currentUserId={user?.id || null}
            pinOwnerId={pinOwnerId}
            replyingToCommentId={replyingToCommentId}
            replyUsername={replyUsername}
            replyInputOpen={replyInputOpen}
            depth={0}
            expanded={!!expandedComments[comment._id]}
            toggleReplies={toggleReplies}
            isDeactivated={isDeactivated}
            block={block}

            onLike={async (id) => {
              if (!token) return;
              if (isDeactivated) return block();
              try {
                await toggleLikeComment(id, token);
                await loadComments();
              } catch {
                toast({
                  title: "Error",
                  description: "Failed to like comment",
                  variant: "destructive",
                });
              }
            }}

            onOpenReactions={async (id) => {
              try {
                const users = await getCommentLikes(id, token);
                setReactionUsers(users);
                setReactionsModalOpen(true);
              } catch {
                toast({
                  title: "Error",
                  description: "Failed to load reactions",
                  variant: "destructive",
                });
              }
            }}

            onReply={async (parentId, text) => {
              if (!token || !text.trim()) return;
              if (isDeactivated) return block();
              try {
                await postReply(pinId, parentId, text.trim(), token);
                await loadComments();

                // 🔥 auto-expand the comment so the new reply shows
                setExpandedComments((prev) => ({
                  ...prev,
                  [parentId]: true,
                }));

              } catch {
                toast({
                  title: "Error",
                  description: "Failed to post reply",
                  variant: "destructive",
                });
              }
            }}

            onStartReply={(id, username) => {
              setReplyingToCommentId(id);
              setReplyUsername(username);
              setReplyInputOpen(true);
            }}

            onCancelReply={() => {
              setReplyingToCommentId(null);
              setReplyUsername(null);
              setReplyInputOpen(false);
            }}

            onDelete={async (id) => {
              if (!token) return;
              if (isDeactivated) return block();
              try {
                await deleteComment(id, token);
                await loadComments();
              } catch {
                toast({
                  title: "Error",
                  description: "Failed to delete comment",
                  variant: "destructive",
                });
              }
            }}
          />
        ))}
      </div>

      <ReactionModal
        open={reactionsModalOpen}
        onOpenChange={setReactionsModalOpen}
        users={reactionUsers}
      />
    </div>
  );
};

export default CommentBox;
