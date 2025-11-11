import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Bookmark, BookmarkCheck, FolderPlus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import SaveToBoardDialog from "./SaveToBoardDialog";

interface PinCardProps {
  id: string;
  imageUrl?: string;
  mediaUrl?: string;
  mediaType?: "image" | "video";
  title?: string;
  description?: string;
  isSaved?: boolean;
  onSaveChange?: (pinId: string, isSaved: boolean) => void;
  hideBoardButton?: boolean;
}

const PinCard = ({ id, imageUrl, mediaUrl, mediaType = "image", title, description, isSaved = false, onSaveChange, hideBoardButton = false }: PinCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [saved, setSaved] = useState(isSaved);
  const [saveLoading, setSaveLoading] = useState(false);
  const [showBoardDialog, setShowBoardDialog] = useState(false);
  const navigate = useNavigate();
  const { isAuthenticated, token } = useAuth();
  const { toast } = useToast();

  const apiUrl = import.meta.env.VITE_API_URL || "https://pinterest-backend-088x.onrender.com";

  useEffect(() => {
    setSaved(isSaved);
  }, [isSaved]);

  const handleSave = async (e: React.MouseEvent) => {
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
    
    setSaveLoading(true);
    try {
      const endpoint = saved ? 'unsave' : 'save';
      
      const response = await fetch(`${apiUrl}/api/pins/${id}/${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setSaved(!saved);
        onSaveChange?.(id, !saved);
        toast({
          title: saved ? "Unsaved" : "Saved!",
          description: saved ? "Pin removed from your collection" : "Pin saved to your collection",
        });
      } else {
        throw new Error('Failed to update save status');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update save status",
        variant: "destructive",
      });
    } finally {
      setSaveLoading(false);
    }
  };

  const handleView = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/pin/${id}`);
  };

  const handleAddToBoard = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!isAuthenticated) {
      toast({
        title: "Login Required",
        description: "Please login to save to boards",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }
    
    setShowBoardDialog(true);
  };

  return (
    <div
      className="relative group cursor-pointer break-inside-avoid mb-4"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleView}
    >
      <div className="rounded-2xl overflow-hidden bg-card shadow-[var(--shadow-card)] transition-shadow duration-300 hover:shadow-[var(--shadow-card-hover)]">
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
        
        {isHovered && (
          <div className="absolute inset-0 bg-black/40 flex items-start justify-end p-4 transition-opacity duration-300">
            <div className="flex gap-2">
              {!hideBoardButton && (
                <Button
                  onClick={handleAddToBoard}
                  size="sm"
                  variant="secondary"
                  className="bg-card/90 hover:bg-card gap-2"
                >
                  <FolderPlus className="w-4 h-4" />
                  Board
                </Button>
              )}
              <Button
                onClick={handleSave}
                disabled={saveLoading}
                size="sm"
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold gap-2"
              >
                {saved ? (
                  <>
                    <BookmarkCheck className="w-4 h-4" />
                    Saved
                  </>
                ) : (
                  <>
                    <Bookmark className="w-4 h-4" />
                    Save
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
      
      {title && (
        <div className="mt-2 px-2">
          <p className="text-sm font-medium text-foreground line-clamp-2">{title}</p>
        </div>
      )}

      <SaveToBoardDialog
        open={showBoardDialog}
        onOpenChange={setShowBoardDialog}
        pinId={id}
      />
    </div>
  );
};

export default PinCard;
