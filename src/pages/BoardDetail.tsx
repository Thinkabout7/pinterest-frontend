import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, ArrowLeft, Pencil, Upload, AlertTriangle, Camera } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import Navbar from "@/components/Navbar";
import MasonryGrid from "@/components/MasonryGrid";
import PinCard from "@/components/PinCard";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface Pin {
  _id: string;
  title: string;
  description: string;
  mediaUrl?: string;
  image?: string;
  mediaType: string;
  category: string;
  user: {
    _id: string;
    username: string;
    email: string;
  } | null;
}

interface Board {
  _id: string;
  name: string;
  description: string;
  coverImage?: string;
  user?: {
    _id?: string;
    username?: string;
    profilePicture?: string;
  };
  pins: Pin[];
  createdAt: string;
}

const BoardDetail = () => {
  const { boardId } = useParams<{ boardId: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const { toast } = useToast();

  const [board, setBoard] = useState<Board | null>(null);
  const [allPins, setAllPins] = useState<Pin[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [addingPin, setAddingPin] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editCoverImage, setEditCoverImage] = useState("");
  const [isCoverChangeDialogOpen, setIsCoverChangeDialogOpen] = useState(false);
  const [coverChangeTab, setCoverChangeTab] = useState<"pins" | "upload">("pins");
  const [uploadingCover, setUploadingCover] = useState(false);
  const [selectedCoverFile, setSelectedCoverFile] = useState<File | null>(null);
  const [selectedCoverPreview, setSelectedCoverPreview] = useState<string>("");

  useEffect(() => {
    return () => {
      if (selectedCoverPreview) {
        try {
          URL.revokeObjectURL(selectedCoverPreview);
        } catch {
          // ignore
        }
      }
    };
  }, [selectedCoverPreview]);

  const apiUrl = import.meta.env.VITE_API_URL || "https://pinterest-backend-088x.onrender.com";

  const getImageSrc = (src: string) => src && src.startsWith('/uploads') ? `${apiUrl}${src}` : src;

  useEffect(() => {
    const fetchBoardDetails = async () => {
      if (!boardId) return;

      try {
        setIsLoading(true);
        const token = localStorage.getItem("auth_token");

        const boardRes = await fetch(`${apiUrl}/api/boards/${boardId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (boardRes.ok) {
          const boardData = await boardRes.json();
          setBoard(boardData);
        } else throw new Error("Board not found");

        const pinsRes = await fetch(`${apiUrl}/api/pins`);
        if (pinsRes.ok) {
          const pinsData = await pinsRes.json();
          setAllPins(pinsData);
        }
      } catch (error) {
        console.error("Error fetching board:", error);
        toast({
          title: "Error",
          description: "Failed to load board",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchBoardDetails();
  }, [boardId, apiUrl, toast]);

  const isOwnBoard =
    !!currentUser &&
    !!board?.user &&
    (currentUser.id === board.user._id ||  (board.user as any)?.id);

  const handleEditBoard = async () => {
    if (!boardId) return;
    try {
      const token = localStorage.getItem("auth_token");

      const response = await fetch(`${apiUrl}/api/boards/${boardId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: editName,
          description: editDescription,
          coverImage: editCoverImage,
        }),
      });

      if (response.ok) {
        const updatedBoard = await response.json();
        setBoard(updatedBoard);
        setIsEditDialogOpen(false);
        toast({ title: "Success", description: "Board updated successfully" });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update board");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update board",
        variant: "destructive",
      });
    }
  };

  const handleDeleteBoard = async () => {
    if (!boardId) return;
    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch(`${apiUrl}/api/boards/${boardId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        toast({ title: "Success", description: "Board deleted successfully" });
        navigate(`/profile/${currentUser?.username}`);
      } else throw new Error("Failed to delete board");
    } catch {
      toast({
        title: "Error",
        description: "Failed to delete board",
        variant: "destructive",
      });
    }
  };

  const uploadCoverFile = async (file: File) => {
    if (!file || !boardId || !board) return;
    setUploadingCover(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const token = localStorage.getItem("auth_token");
      const uploadResponse = await fetch(`${apiUrl}/api/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!uploadResponse.ok) throw new Error(`Upload failed ${uploadResponse.status}`);

      const uploadData = await uploadResponse.json();
      const uploadedUrl =
        uploadData.fileUrl ||
        uploadData.url ||
        uploadData.imageUrl ||
        uploadData.mediaUrl ||
        uploadData.data?.url;

      if (!uploadedUrl) throw new Error("No file URL returned from upload");

      const response = await fetch(`${apiUrl}/api/boards/${boardId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: board.name,
          description: board.description,
          coverImage: uploadedUrl,
        }),
      });

      if (response.ok) {
        const updatedBoard = await response.json();
        setBoard(updatedBoard);
        setEditCoverImage(uploadedUrl);
        setIsCoverChangeDialogOpen(false);
        toast({ title: "Success", description: "Cover image uploaded successfully" });
      } else throw new Error("Failed to update board cover");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to upload cover image",
        variant: "destructive",
      });
    } finally {
      setUploadingCover(false);
    }
  };

  const handleCoverFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedCoverFile(file);
    try {
      const preview = URL.createObjectURL(file);
      setSelectedCoverPreview(preview);
    } catch {
      setSelectedCoverPreview("");
    }
    // Upload immediately after selecting
    uploadCoverFile(file);
  };

  const handleAddPin = async (pinId: string) => {
    if (!boardId) return;
    setAddingPin(pinId);
    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch(`${apiUrl}/api/boards/${boardId}/pins/${pinId}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const boardRes = await fetch(`${apiUrl}/api/boards/${boardId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (boardRes.ok) setBoard(await boardRes.json());
        toast({ title: "Success", description: "Pin added to board" });
      } else throw new Error("Failed to add pin");
    } catch {
      toast({
        title: "Error",
        description: "Failed to add pin to board",
        variant: "destructive",
      });
    } finally {
      setAddingPin(null);
    }
  };

  const handleRemovePin = async (pinId: string) => {
    if (!boardId) return;
    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch(`${apiUrl}/api/boards/${boardId}/pins/${pinId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        setBoard((prev) =>
          prev ? { ...prev, pins: prev.pins.filter((pin) => pin._id !== pinId) } : null
        );
        toast({ title: "Success", description: "Pin removed from board" });
      } else throw new Error("Failed to remove pin");
    } catch {
      toast({
        title: "Error",
        description: "Failed to remove pin from board",
        variant: "destructive",
      });
    }
  };

  const availablePins = allPins.filter(
    (pin) => !board?.pins?.some((boardPin) => boardPin._id === pin._id)
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        {isLoading ? (
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="text-muted-foreground">Loading board...</div>
          </div>
        ) : board ? (
          <div className="space-y-8">
            {/* Cover */}
            {(board?.coverImage || board?.pins?.length) && (
              <div className="relative group w-full h-64 rounded-lg overflow-hidden bg-muted">
                <img
                  src={getImageSrc(board?.coverImage || board?.pins?.[0]?.mediaUrl || board?.pins?.[0]?.image)}
                  alt={board?.name || "Board cover"}
                  className="w-full h-full object-cover"
                />
                {isOwnBoard && (
                  <Button
                    onClick={() => setIsCoverChangeDialogOpen(true)}
                    size="icon"
                    className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 hover:bg-black/70"
                  >
                    <Camera className="w-4 h-4" />
                  </Button>
                )}
              </div>
            )}

            {/* Header */}
            <div className="space-y-4">
              <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>

              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-4xl font-bold text-foreground mb-2">
                    {board?.name || "Untitled Board"}
                  </h1>
                  {board?.description && (
                    <p className="text-lg text-muted-foreground">{board?.description}</p>
                  )}
                  <p className="text-sm text-muted-foreground mt-2">
                    {board?.pins?.length || 0}{" "}
                    {board?.pins?.length === 1 ? "pin" : "pins"}
                  </p>
                </div>
                {isOwnBoard && (
                  <div className="flex gap-2">
                    <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                      <DialogTrigger asChild>
                        <Button>
                          <Plus className="w-4 h-4 mr-2" />
                          Add Pin
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Add Pins to Board</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          {availablePins.length > 0 ? (
                            <MasonryGrid>
                              {availablePins.map((pin) => (
                                <div key={pin._id} className="relative group">
                                  <PinCard
                                    id={pin._id}
                                    imageUrl={getImageSrc(pin.mediaUrl || pin.image || "")}
                                    title={pin.title}
                                    description={pin.description}
                                    hideBoardButton
                                  />
                                  <Button
                                    size="sm"
                                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => handleAddPin(pin._id)}
                                    disabled={addingPin === pin._id}
                                  >
                                    {addingPin === pin._id ? "Adding..." : "Add"}
                                  </Button>
                                </div>
                              ))}
                            </MasonryGrid>
                          ) : (
                            <p className="text-center text-muted-foreground py-8">
                              No available pins to add. Create some pins first!
                            </p>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>
                    <Button variant="outline" onClick={() => setIsEditDialogOpen(true)}>
                      <Pencil className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                    <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive">
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Board</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this board? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={handleDeleteBoard}>Delete</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                )}
              </div>
            </div>

            {/* Cover Change Dialog */}
            <Dialog open={isCoverChangeDialogOpen} onOpenChange={setIsCoverChangeDialogOpen}>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Change Board Cover</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  {/* Tabs */}
                  <div className="flex gap-2 border-b">
                    <button
                      onClick={() => setCoverChangeTab("pins")}
                      className={`pb-2 px-4 font-medium transition-colors ${
                        coverChangeTab === "pins"
                          ? "text-foreground border-b-2 border-primary"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      From Pins
                    </button>
                    <button
                      onClick={() => setCoverChangeTab("upload")}
                      className={`pb-2 px-4 font-medium transition-colors ${
                        coverChangeTab === "upload"
                          ? "text-foreground border-b-2 border-primary"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Upload Image
                    </button>
                  </div>

                  {/* From Pins Tab */}
                  {coverChangeTab === "pins" && (
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        Select one of your pins to use as the board cover
                      </p>
                      {board?.pins && board.pins.length > 0 ? (
                        <div className="grid grid-cols-3 gap-3 max-h-64 overflow-y-auto">
                          {board.pins.map((pin) => (
                            <button
                              key={pin._id}
                              onClick={() => {
                                const coverUrl = pin.mediaUrl || pin.image;
                                if (coverUrl && boardId) {
                                  const token = localStorage.getItem("auth_token");
                                  fetch(`${apiUrl}/api/boards/${boardId}`, {
                                    method: "PUT",
                                    headers: {
                                      Authorization: `Bearer ${token}`,
                                      "Content-Type": "application/json",
                                    },
                                    body: JSON.stringify({
                                      name: board.name,
                                      description: board.description,
                                      coverImage: coverUrl,
                                    }),
                                  })
                                    .then((res) => {
                                      if (res.ok) {
                                        return res.json().then((updated) => {
                                          setBoard(updated);
                                          setEditCoverImage(coverUrl);
                                          setIsCoverChangeDialogOpen(false);
                                          toast({
                                            title: "Success",
                                            description: "Board cover updated",
                                          });
                                        });
                                      }
                                      throw new Error("Failed to update cover");
                                    })
                                    .catch((err) => {
                                      toast({
                                        title: "Error",
                                        description: err.message || "Failed to update cover",
                                        variant: "destructive",
                                      });
                                    });
                                }
                              }}
                              className="relative group rounded-lg overflow-hidden border-2 border-transparent hover:border-primary transition-all"
                            >
                              <img
                                src={getImageSrc(pin.mediaUrl || pin.image || "")}
                                alt={pin.title}
                                className="w-full h-24 object-cover"
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <p className="text-white text-sm font-medium">Set as Cover</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <p className="text-muted-foreground">No pins to select from</p>
                      )}
                    </div>
                  )}

                  {/* Upload Tab */}
                  {coverChangeTab === "upload" && (
                    <div className="space-y-4">
                      <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary transition-colors">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleCoverFileUpload}
                          disabled={uploadingCover}
                          className="hidden"
                          id="cover-upload"
                        />
                        <label htmlFor="cover-upload" className="cursor-pointer block">
                          <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                          <p className="font-medium">
                            {uploadingCover ? "Uploading..." : "Click to upload image"}
                          </p>
                          <p className="text-sm text-muted-foreground">or drag and drop</p>
                        </label>

                        {selectedCoverPreview && (
                          <div className="mt-4">
                            <p className="text-sm text-muted-foreground mb-2">Preview:</p>
                            <div className="w-full h-48 rounded-lg overflow-hidden bg-muted">
                              <img
                                src={selectedCoverPreview}
                                alt="Selected cover preview"
                                className="w-full h-full object-cover"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>

            {/* Pins */}
            {board?.pins?.length ? (
              <MasonryGrid>
                {board.pins.map((pin) => (
                  <div key={pin._id} className="relative group">
                    <PinCard
                      id={pin._id}
                      imageUrl={getImageSrc(pin.mediaUrl || pin.image || "")}
                      title={pin.title}
                      description={pin.description}
                      hideBoardButton
                    />
                    {isOwnBoard && (
                      <Button
                        size="icon"
                        variant="destructive"
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemovePin(pin._id);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </MasonryGrid>
            ) : (
              <div className="text-center py-16 text-muted-foreground">
                <p className="text-xl mb-2">No pins in this board yet</p>
                {isOwnBoard && <p>Click “Add Pin” to start adding pins</p>}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-16">
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Board not found
            </h2>
            <p className="text-muted-foreground">
              The board you’re looking for doesn’t exist.
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

export default BoardDetail;
