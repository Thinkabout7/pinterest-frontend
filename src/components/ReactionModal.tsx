// src/components/ReactionModal.tsx
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserType } from "@/types/commentTypes";
import { useNavigate } from "react-router-dom";

interface ReactionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  users: UserType[];
}

const ReactionModal = ({ open, onOpenChange, users }: ReactionModalProps) => {
  const navigate = useNavigate();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Reactions</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 max-h-64 overflow-y-auto">
          {users.length === 0 && (
            <p className="text-muted-foreground text-center">No reactions yet</p>
          )}

          {users.map((u) => (
            <div
              key={u._id}
              className="flex items-center gap-3 p-2 rounded cursor-pointer hover:bg-accent"
              onClick={() => {
                onOpenChange(false);
                navigate(`/profile/${u.username}`);
              }}
            >
              <Avatar className="w-8 h-8">
                <AvatarImage src={u.profilePicture || ""} />
                <AvatarFallback>
                  {u.username[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <span className="font-medium">{u.username}</span>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReactionModal;
