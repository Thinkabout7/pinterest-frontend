import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CreateBoardDialogProps {
  onBoardCreated: (board: any) => void;
}

const CreateBoardDialog = ({ onBoardCreated }: CreateBoardDialogProps) => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();

  const apiUrl = import.meta.env.VITE_API_URL || "https://pinterest-backend-088x.onrender.com";

  const handleCreate = async () => {
    if (!name.trim()) return;

    setIsCreating(true);
    try {
      const token = localStorage.getItem('auth_token');

      const response = await fetch(`${apiUrl}/api/boards`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          description,
          coverImage: coverImageUrl,
        }),
      });

      if (response.ok) {
        const newBoard = await response.json();
        onBoardCreated(newBoard);
        setOpen(false);
        setName("");
        setDescription("");
        setCoverImageUrl("");
        
        toast({
          title: "Success",
          description: "Board created successfully",
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create board');
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create board",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Create Board
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Board</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="name">Board Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter board name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter board description"
              rows={4}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cover">Cover Image URL (Optional)</Label>
            <Input
              id="cover"
              value={coverImageUrl}
              onChange={(e) => setCoverImageUrl(e.target.value)}
              placeholder="Enter image URL"
            />
            <p className="text-xs text-muted-foreground">
              If no cover URL is provided, the first pin will be used as cover
            </p>
          </div>
          <Button 
            onClick={handleCreate}
            disabled={!name.trim() || isCreating}
            className="w-full"
          >
            {isCreating ? "Creating..." : "Create Board"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateBoardDialog;
