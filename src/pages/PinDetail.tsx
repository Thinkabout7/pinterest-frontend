// src/pages/PinDetail.tsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Heart, MessageCircle, Share2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Navbar from "@/components/Navbar";
import ShareModal from "@/components/ShareModal";
import CommentBox from "@/components/CommentBox";
import MoreOptionsDropdown from "@/components/MoreOptionsDropdown";
import SaveToBoardDialog from "@/components/SaveToBoardDialog";
import LikesModal from "@/components/LikesModal";
import { useAuth } from "@/contexts/AuthContext";

interface PinData {
  _id: string;
  mediaUrl: string;
  mediaType: "image" | "video";
  title?: string;
  description?: string;
  user?: {
    _id: string;
    username: string;
    profilePicture?: string | null;
  } | null;
  likesUsers?: any[];
  likesCount?: number;
}

const PinDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser, token } = useAuth();
  const { toast } = useToast();
  const apiUrl =
    import.meta.env.VITE_API_URL ||
    "https://pinterest-backend-088x.onrender.com";

  const [pin, setPin] = useState<PinData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [likesUsers, setLikesUsers] = useState<any[]>([]);
  const [commentCount, setCommentCount] = useState(0);

  const [showShareModal, setShowShareModal] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showLikesModal, setShowLikesModal] = useState(false);
  const [showComments, setShowComments] = useState(true);

  const loadPin = async () => {
    try {
      const res = await fetch(`${apiUrl}/api/pins/${id}/full`);
      if (!res.ok) throw new Error("Pin not found");

      const data = await res.json();
      setPin(data);
      setLikesUsers(data.likesUsers || []);
      setLikesCount(data.likesCount || 0);

      if (currentUser) {
        setIsLiked(
          (data.likesUsers || []).some(
            (u: any) => u?._id === currentUser.id
          )
        );
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to load pin",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPin();
  }, [id, token]);

  const handleLike = async () => {
    if (!currentUser) return navigate("/auth");

    try {
      await fetch(`${apiUrl}/api/pins/${id}/likes`, {
        method: isLiked ? "DELETE" : "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      await loadPin();
    } catch {
      toast({
        title: "Error",
        description: "Failed to like",
        variant: "destructive",
      });
    }
  };

  if (loading)
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="h-screen flex justify-center items-center">
          Loading…
        </div>
      </div>
    );

  if (!pin)
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="h-screen flex justify-center items-center">
          Pin not found
        </div>
      </div>
    );

  const safeUser =
    pin.user || ({
      _id: "deleted",
      username: "Deleted User",
      profilePicture: null,
    } as any);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto py-6 px-4">
        <Button
          onClick={() => navigate(-1)}
          variant="ghost"
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>

        <div className="max-w-5xl mx-auto bg-card rounded-3xl shadow-lg overflow-hidden">
          <div className="grid md:grid-cols-2">
            {/* MEDIA */}
            <div className="bg-muted flex justify-center items-center p-8">
              {pin.mediaType === "image" ? (
                <img
                  src={pin.mediaUrl}
                  className="max-w-full object-contain rounded-2xl"
                />
              ) : (
                <video
                  src={pin.mediaUrl}
                  controls
                  className="max-w-full rounded-2xl"
                />
              )}
            </div>

            {/* RIGHT SIDE */}
            <div className="p-8 flex flex-col">
              {/* OWNER */}
              <div
                className="flex items-center gap-3 mb-6 cursor-pointer"
                onClick={() => navigate(`/profile/${safeUser.username}`)}
              >
                <Avatar className="w-12 h-12">
                  <AvatarImage src={safeUser.profilePicture || undefined} />
                  <AvatarFallback>
                    {safeUser.username[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <p className="font-semibold">{safeUser.username}</p>
              </div>

              {pin.title && (
                <h1 className="text-3xl font-bold mb-4">{pin.title}</h1>
              )}

              {pin.description && (
                <p className="text-muted-foreground mb-6">
                  {pin.description}
                </p>
              )}

              {/* ACTIONS */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-6">
                  <button
                    onClick={handleLike}
                    className="flex items-center gap-2"
                  >
                    <Heart
                      className={`w-6 h-6 ${
                        isLiked
                          ? "text-red-500 fill-red-500"
                          : "text-foreground"
                      }`}
                    />
                    <span className="font-medium">{likesCount}</span>
                  </button>

                  <button
                    onClick={() => setShowComments((v) => !v)}
                    className="flex items-center gap-2"
                  >
                    <MessageCircle className="w-6 h-6" />
                    <span>{commentCount}</span>
                  </button>

                  <button
                    onClick={() => setShowShareModal(true)}
                    className="flex items-center gap-2"
                  >
                    <Share2 className="w-6 h-6" />
                    Share
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => setShowSaveDialog(true)}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Save
                  </Button>
                  <MoreOptionsDropdown
                    imageUrl={pin.mediaUrl}
                    title={pin.title}
                  />
                </div>
              </div>

              {showComments && (
                <CommentBox
                  pinId={pin._id}
                  pinOwnerId={safeUser._id}
                  onCommentsChange={setCommentCount}
                />
              )}
            </div>
          </div>
        </div>
      </main>

      <ShareModal
        open={showShareModal}
        onOpenChange={setShowShareModal}
        pinId={pin._id}
        imageUrl={pin.mediaUrl}
        title={pin.title}
      />

      <SaveToBoardDialog
        open={showSaveDialog}
        onOpenChange={setShowSaveDialog}
        pinId={pin._id}
      />

      <LikesModal
        open={showLikesModal}
        onOpenChange={setShowLikesModal}
        users={likesUsers}
      />
    </div>
  );
};

export default PinDetail;
