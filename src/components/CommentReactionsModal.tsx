// src/components/CommentReactionsModal.tsx
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface CommentReactionsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  users: {
    _id: string;
    username: string;
    profilePicture?: string;
  }[];
}

const CommentReactionsModal = ({
  open,
  onOpenChange,
  users,
}: CommentReactionsModalProps) => {
  const navigate = useNavigate();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Reactions</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 max-h-[350px] overflow-y-auto">
          {users.length === 0 ? (
            <p className="text-center text-muted-foreground">No reactions yet.</p>
          ) : (
            users.map((user) => (
              <div
                key={user._id}
                onClick={() => {
                  onOpenChange(false);
                  navigate(`/profile/${user.username}`);
                }}
                className="flex items-center gap-3 p-2 rounded hover:bg-accent cursor-pointer"
              >
                <Avatar>
                  <AvatarImage src={user.profilePicture || ""} />
                  <AvatarFallback>
                    {user.username.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <div className="flex flex-col">
                  <span className="font-medium">{user.username}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CommentReactionsModal;
