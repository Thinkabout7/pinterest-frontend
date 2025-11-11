import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";

interface PinData {
  id: string;
  mediaUrl: string;
  mediaType: "image" | "video";
  title?: string;
  description?: string;
  user?: {
    username: string;
    avatar?: string;
  };
}

const PinDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [pin, setPin] = useState<PinData | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchPin = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || "https://pinterest-backend-088x.onrender.com";
        const response = await fetch(`${apiUrl}/api/pins/${id}`);
        
        if (!response.ok) {
          throw new Error("Failed to fetch pin");
        }
        
        const data = await response.json();
        setPin(data);
      } catch (error) {
        console.error("Error fetching pin:", error);
        toast({
          title: "Error",
          description: "Failed to load pin. Please try again later.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchPin();
    }
  }, [id, toast]);

  const handleSave = () => {
    // TODO: Implement save functionality
    toast({
      title: "Saved!",
      description: "Pin saved to your board",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      </div>
    );
  }

  if (!pin) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">Pin not found</h2>
            <Button onClick={() => navigate("/")} variant="outline">
              Go back to feed
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto py-6 px-4">
        <Button
          onClick={() => navigate("/")}
          variant="ghost"
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to feed
        </Button>

        <div className="max-w-5xl mx-auto">
          <div className="bg-card rounded-3xl shadow-lg overflow-hidden">
            <div className="grid md:grid-cols-2 gap-0">
              <div className="bg-muted flex items-center justify-center p-8">
                {pin.mediaType === "image" ? (
                  <img
                    src={pin.mediaUrl}
                    alt={pin.title || "Pin"}
                    className="max-w-full h-auto rounded-2xl shadow-md object-contain"
                  />
                ) : (
                  <video
                    src={pin.mediaUrl}
                    controls
                    className="max-w-full h-auto rounded-2xl shadow-md"
                  />
                )}
              </div>
              
              <div className="p-8 flex flex-col">
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex-1">
                      {pin.user && (
                        <div className="flex items-center gap-3 mb-4">
                          {pin.user.avatar ? (
                            <img
                              src={pin.user.avatar}
                              alt={pin.user.username}
                              className="w-12 h-12 rounded-full"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                              <span className="text-lg font-semibold text-muted-foreground">
                                {pin.user.username.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                          <div>
                            <p className="font-semibold text-foreground">{pin.user.username}</p>
                          </div>
                        </div>
                      )}
                    </div>
                    <Button
                      onClick={handleSave}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                    >
                      Save
                    </Button>
                  </div>

                  {pin.title && (
                    <h1 className="text-3xl font-bold mb-4 text-foreground">{pin.title}</h1>
                  )}
                  
                  {pin.description && (
                    <p className="text-muted-foreground leading-relaxed">{pin.description}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PinDetail;
