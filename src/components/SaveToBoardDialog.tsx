import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Board {
  _id: string;
  name: string;
  description: string;
  coverImage?: string;
  pins: Array<{ _id: string }>;
}

interface SaveToBoardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pinId: string;
}

const SaveToBoardDialog = ({ open, onOpenChange, pinId }: SaveToBoardDialogProps) => {
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newBoardName, setNewBoardName] = useState("");
  const [newBoardDescription, setNewBoardDescription] = useState("");
  const [creatingBoard, setCreatingBoard] = useState(false);
  const { toast } = useToast();

  const apiUrl = import.meta.env.VITE_API_URL || "https://pinterest-backend-088x.onrender.com";

  useEffect(() => {
    if (open) {
      fetchBoards();
    }
  }, [open]);

  const fetchBoards = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${apiUrl}/api/boards`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setBoards(data);
      }
    } catch (error) {
      console.error('Error fetching boards:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBoard = async () => {
    if (!newBoardName.trim()) return;

    setCreatingBoard(true);
    try {
      const token = localStorage.getItem('auth_token');

      const response = await fetch(`${apiUrl}/api/boards`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newBoardName,
          description: newBoardDescription,
        }),
      });

      if (response.ok) {
        const newBoard = await response.json();
        setBoards([newBoard, ...boards]);
        setNewBoardName("");
        setNewBoardDescription("");
        setShowCreateForm(false);
        
        // Auto-add pin to the newly created board
        await handleAddToBoard(newBoard._id);
        
        toast({
          title: "Success",
          description: "Board created and pin added",
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
      setCreatingBoard(false);
    }
  };

  const handleAddToBoard = async (boardId: string) => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${apiUrl}/api/boards/${boardId}/pins/${pinId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        // Update local state to show pin is in board
        setBoards(boards.map(board => 
          board._id === boardId 
            ? { ...board, pins: [...board.pins, { _id: pinId }] }
            : board
        ));
        
        toast({
          title: "Success",
          description: "Pin added to board",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add pin to board",
        variant: "destructive",
      });
    }
  };

  const handleRemoveFromBoard = async (boardId: string) => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${apiUrl}/api/boards/${boardId}/pins/${pinId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        // Update local state to show pin is removed
        setBoards(boards.map(board => 
          board._id === boardId 
            ? { ...board, pins: board.pins.filter(p => p._id !== pinId) }
            : board
        ));
        
        toast({
          title: "Success",
          description: "Pin removed from board",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove pin from board",
        variant: "destructive",
      });
    }
  };

  const isPinInBoard = (board: Board) => {
    return board.pins.some(p => p._id === pinId);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Save to Board</DialogTitle>
        </DialogHeader>

        {showCreateForm ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-board-name">Board Name</Label>
              <Input
                id="new-board-name"
                value={newBoardName}
                onChange={(e) => setNewBoardName(e.target.value)}
                placeholder="Enter board name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-board-description">Description (Optional)</Label>
              <Textarea
                id="new-board-description"
                value={newBoardDescription}
                onChange={(e) => setNewBoardDescription(e.target.value)}
                placeholder="Enter board description"
                rows={3}
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleCreateBoard}
                disabled={!newBoardName.trim() || creatingBoard}
                className="flex-1"
              >
                {creatingBoard ? "Creating..." : "Create"}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowCreateForm(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <>
            <Button
              onClick={() => setShowCreateForm(true)}
              className="w-full gap-2 mb-4"
              variant="outline"
            >
              <Plus className="w-4 h-4" />
              Create New Board
            </Button>

            <ScrollArea className="h-[300px] pr-4">
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Loading boards...
                </div>
              ) : boards.length > 0 ? (
                <div className="space-y-2">
                  {boards.map((board) => {
                    const isInBoard = isPinInBoard(board);
                    return (
                      <div
                        key={board._id}
                        className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-accent cursor-pointer transition-colors"
                        onClick={() => isInBoard ? handleRemoveFromBoard(board._id) : handleAddToBoard(board._id)}
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center text-2xl overflow-hidden">
                            {board.coverImage || board.pins[0] ? (
                              <img
                                src={board.coverImage || (board.pins[0] as any)?.mediaUrl}
                                alt={board.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              "📌"
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-foreground">{board.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {board.pins.length} pins
                            </p>
                          </div>
                        </div>
                        {isInBoard && (
                          <Check className="w-5 h-5 text-primary" />
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="mb-2">No boards yet</p>
                  <p className="text-sm">Create your first board to organize pins</p>
                </div>
              )}
            </ScrollArea>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default SaveToBoardDialog;
