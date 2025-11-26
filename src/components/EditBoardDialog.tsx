import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

interface Pin {
  _id: string;
  title?: string;
  description?: string;
  mediaUrl?: string;
  image?: string;
  mediaType?: "image" | "video";
  category?: string;
}

interface Board {
  _id: string;
  name: string;
  description?: string;
  coverImage?: string;
  user?: {
    _id: string;
    username: string;
  };
  pins: Pin[];
  createdAt?: string;
}

interface EditBoardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  board: Board;
  onSave: (updated: Board) => void;
}

const EditBoardDialog = ({ open, onOpenChange, board, onSave }: EditBoardDialogProps) => {
  const [name, setName] = useState(board?.name || "");
  const [description, setDescription] = useState(board?.description || "");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const apiUrl =
    import.meta.env.VITE_API_URL ||
    "https://pinterest-backend-088x.onrender.com";

  useEffect(() => {
    if (board) {
      setName(board.name);
      setDescription(board.description || "");
    }
  }, [board]);

  const handleSave = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("auth_token");

      const res = await fetch(`${apiUrl}/api/boards/${board._id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, description }),
      });

      if (!res.ok) throw new Error("Failed to update board");

      const data = await res.json();
      const updated: Board = data.board || data;

      onSave(updated);
      toast({ title: "Success", description: "Board updated" });
      onOpenChange(false);
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to update board",
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit board</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Board name"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Description</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Board description"
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditBoardDialog;
