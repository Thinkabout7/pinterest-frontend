import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Upload, Image as ImageIcon, Video } from "lucide-react";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

const createPinSchema = z.object({
  title: z.string().trim().optional(),
  description: z.string().trim().optional(),
  category: z.string().optional(),
});

const createBoardSchema = z.object({
  name: z.string().trim().min(1, "Board name is required").max(50, "Board name must be less than 50 characters"),
  description: z.string().trim().max(300, "Description must be less than 300 characters").optional(),
});

type CreatePinForm = z.infer<typeof createPinSchema>;
type CreateBoardForm = z.infer<typeof createBoardSchema>;

const categories = [
  "Art",
  "Photography",
  "Design",
  "Travel",
  "Food",
  "Fashion",
  "Technology",
  "Architecture",
  "Nature",
  "Logo",
  "Screenshot",
  "Other"
];

const Create = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAuthenticated, token, user } = useAuth();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);

  const apiUrl = import.meta.env.VITE_API_URL || "https://pinterest-backend-088x.onrender.com";

  const pinForm = useForm<CreatePinForm>({
    resolver: zodResolver(createPinSchema),
    defaultValues: {
      category: "",
    },
  });

  const boardForm = useForm<CreateBoardForm>({
    resolver: zodResolver(createBoardSchema),
  });

  const selectedCategory = pinForm.watch("category");

  // Redirect if not authenticated
  if (!isAuthenticated) {
    navigate("/auth");
    return null;
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validImageTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
    const validVideoTypes = ["video/mp4", "video/webm", "video/ogg"];
    
    if (![...validImageTypes, ...validVideoTypes].includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image (JPEG, PNG, WEBP) or video (MP4, WEBM, OGG)",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload a file smaller than 10MB",
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const onSubmitPin = async (data: CreatePinForm) => {
    if (!selectedFile) {
      toast({
        title: "No file selected",
        description: "Please select an image or video to upload",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      // Build the request using FormData
      const formData = new FormData();
      formData.append("media", selectedFile);
      formData.append("title", data.title);
      formData.append("description", data.description);
      formData.append("category", data.category);

      // Send the request
      const response = await fetch(`${apiUrl}/api/pins`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        let errorMessage = 'Failed to create pin';
        try {
          const errJson = JSON.parse(errorText || '{}');
          errorMessage = errJson.message || errorMessage;
        } catch (_) {
          // not json
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();

      toast({
        title: "Success!",
        description: "Your pin has been created",
      });

      // Clear form and navigate
      pinForm.reset();
      setSelectedFile(null);
      setPreviewUrl("");
      navigate("/");
    } catch (error) {
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to create pin. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const onSubmitBoard = async (data: CreateBoardForm) => {
    setIsUploading(true);

    try {
      const response = await fetch(`${apiUrl}/api/boards`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: data.name,
          description: data.description || "",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create board");
      }

      toast({
        title: "Success!",
        description: "Your board has been created",
      });

      // Navigate to user's profile to see the new board
      if (user?.username) {
        navigate(`/profile/${user.username}`);
      } else {
        navigate("/");
      }
    } catch (error) {
      toast({
        title: "Failed to create board",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-foreground mb-8">Create</h1>

          <Tabs defaultValue="pin" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="pin">Create Pin</TabsTrigger>
              <TabsTrigger value="board">Create Board</TabsTrigger>
            </TabsList>

            {/* Create Pin Tab */}
            <TabsContent value="pin">
              <form onSubmit={pinForm.handleSubmit(onSubmitPin)} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-8">
                  {/* File Upload Section */}
                  <div>
                    <Label htmlFor="file-upload" className="text-base font-semibold mb-4 block">
                      Upload Media
                    </Label>
                    
                    <div className="space-y-4">
                      <div
                        className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
                        onClick={() => document.getElementById("file-upload")?.click()}
                      >
                        {previewUrl ? (
                          <div className="space-y-4">
                            {selectedFile?.type.startsWith("image/") ? (
                              <img
                                src={previewUrl}
                                alt="Preview"
                                className="max-h-64 mx-auto rounded-lg"
                              />
                            ) : (
                              <video
                                src={previewUrl}
                                controls
                                className="max-h-64 mx-auto rounded-lg"
                              />
                            )}
                            <p className="text-sm text-muted-foreground">{selectedFile?.name}</p>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <div className="flex justify-center gap-4">
                              <ImageIcon className="w-12 h-12 text-muted-foreground" />
                              <Video className="w-12 h-12 text-muted-foreground" />
                            </div>
                            <div>
                              <p className="text-muted-foreground mb-2">
                                Click to upload an image or video
                              </p>
                              <p className="text-sm text-muted-foreground">
                                JPEG, PNG, WEBP, MP4, WEBM (max 10MB)
                              </p>
                            </div>
                            <Upload className="w-6 h-6 text-muted-foreground mx-auto" />
                          </div>
                        )}
                      </div>

                      <Input
                        id="file-upload"
                        type="file"
                        accept="image/jpeg,image/png,image/jpg,image/webp,video/mp4,video/webm,video/ogg"
                        onChange={handleFileChange}
                        className="hidden"
                      />

                      {selectedFile && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setSelectedFile(null);
                            setPreviewUrl("");
                          }}
                          className="w-full"
                        >
                          Change File
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Form Fields Section */}
                  <div className="space-y-6">
                    <div>
                      <Label htmlFor="title">Title</Label>
                      <Input
                        id="title"
                        placeholder="Tell everyone what your pin is about"
                        {...pinForm.register("title")}
                        className="mt-2"
                      />
                      
                    </div>

                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        placeholder="Add a description for your pin"
                        rows={5}
                        {...pinForm.register("description")}
                        className="mt-2"
                      />
                      
                    </div>

                    <div>
                      <Label htmlFor="category">Category</Label>
                      <Select
                        value={selectedCategory  || undefined}
                        onValueChange={(value) => pinForm.setValue("category", value)}
                      >
                        <SelectTrigger className="mt-2">
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      
                    </div>

                    <div className="pt-4">
                      <Button
                        type="submit"
                        className="w-full"
                        disabled={isUploading}
                      >
                        {isUploading ? "Creating..." : "Create Pin"}
                      </Button>
                    </div>
                  </div>
                </div>
              </form>
            </TabsContent>

            {/* Create Board Tab */}
            <TabsContent value="board">
              <form onSubmit={boardForm.handleSubmit(onSubmitBoard)} className="max-w-xl mx-auto space-y-6">
                <div>
                  <Label htmlFor="board-name">Board Name</Label>
                  <Input
                    id="board-name"
                    placeholder="e.g., Travel Ideas, Home Decor"
                    {...boardForm.register("name")}
                    className="mt-2"
                  />
                  {boardForm.formState.errors.name && (
                    <p className="text-sm text-destructive mt-1">{boardForm.formState.errors.name.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="board-description">Description (Optional)</Label>
                  <Textarea
                    id="board-description"
                    placeholder="What's your board about?"
                    rows={4}
                    {...boardForm.register("description")}
                    className="mt-2"
                  />
                  {boardForm.formState.errors.description && (
                    <p className="text-sm text-destructive mt-1">{boardForm.formState.errors.description.message}</p>
                  )}
                </div>

                <div className="pt-4">
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isUploading}
                  >
                    {isUploading ? "Creating..." : "Create Board"}
                  </Button>
                </div>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default Create;
