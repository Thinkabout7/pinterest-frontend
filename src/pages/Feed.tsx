import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import MasonryGrid from "@/components/MasonryGrid";
import PinCard from "@/components/PinCard";

interface Pin {
  _id: string;
  title?: string;
  description?: string;
  mediaUrl?: string;
  image?: string;
  mediaType?: string;
  isSaved?: boolean;
}

const Feed = () => {
  const [pins, setPins] = useState<Pin[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const handleSaveChange = (pinId: string, isSaved: boolean) => {
    setPins(prevPins => 
      prevPins.map(pin => 
        pin._id === pinId ? { ...pin, isSaved } : pin
      )
    );
  };

  useEffect(() => {
    const fetchPins = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || "https://pinterest-backend-088x.onrender.com";
        const token = localStorage.getItem('token');
        
        const headers: HeadersInit = {
          'Content-Type': 'application/json',
        };
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        
        const response = await fetch(`${apiUrl}/api/pins`, { headers });
        
        if (!response.ok) {
          throw new Error("Failed to fetch pins");
        }
        
        const data = await response.json();
        setPins(data);
      } catch (error) {
        console.error("Error fetching pins:", error);
        toast({
          title: "Error",
          description: "Failed to load pins. Please try again later.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPins();
  }, [toast]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto py-6">
        {loading ? (
          <div className="flex items-center justify-center min-h-[50vh]">
            <div className="text-muted-foreground">Loading pins...</div>
          </div>
        ) : pins.length === 0 ? (
          <div className="flex items-center justify-center min-h-[50vh]">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">No pins found</h2>
              <p className="text-muted-foreground">Check back later for new content!</p>
            </div>
          </div>
        ) : (
          <MasonryGrid>
            {pins.map((pin) => (
              <PinCard
                key={pin._id}
                id={pin._id}
                mediaUrl={pin.mediaUrl || pin.image}
                mediaType={(pin.mediaType as "image" | "video") || "image"}
                title={pin.title}
                description={pin.description}
                isSaved={pin.isSaved}
                onSaveChange={handleSaveChange}
              />
            ))}
          </MasonryGrid>
        )}
      </main>
    </div>
  );
};

export default Feed;
