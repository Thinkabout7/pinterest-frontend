// src/components/LikesModal.tsx
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useNavigate } from "react-router-dom";

interface LikeUser {
  _id: string;
  username: string;
  profilePicture?: string | null;
}

interface LikesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  users: (LikeUser | null)[];
}

const LikesModal = ({ open, onOpenChange, users }: LikesModalProps) => {
  const navigate = useNavigate();

  // Filter out null users and safely render
  const validUsers = users
    .filter((user): user is LikeUser => 
      user !== null && user !== undefined && typeof user === "object" && "_id" in user
    )
    .map((user) => ({
      ...user,
      username: user.username || "Deleted User",
      profilePicture: user.profilePicture || null,
    }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Likes</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 max-h-96 overflow-y-auto">
          {validUsers.length > 0 ? (
            validUsers.map((user) => (
              <div
                key={user._id}
                className="flex items-center gap-3 cursor-pointer hover:bg-accent p-2 rounded transition"
                onClick={() => navigate(`/profile/${user.username}`)}
              >
                <Avatar className="w-10 h-10">
                  <AvatarImage src={user.profilePicture || undefined} />
                  <AvatarFallback>
                    {user.username[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <div>
                  <p className="font-medium">{user.username}</p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-muted-foreground py-8">
              No likes yet
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LikesModal;