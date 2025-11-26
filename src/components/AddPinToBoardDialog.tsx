import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Pin {
  _id: string;
  title?: string;
  description?: string;
  mediaUrl?: string;
  image?: string;
  mediaType?: string;
}

interface AddPinToBoardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  boardId: string;
  existingPins: string[];
}

const AddPinToBoardDialog = ({
  open,
  onOpenChange,
  boardId,
  existingPins,
}: AddPinToBoardDialogProps) => {
  const [pins, setPins] = useState<Pin[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const apiUrl =
    import.meta.env.VITE_API_URL || "https://pinterest-backend-088x.onrender.com";

  // Load all pins + initialize selection
  useEffect(() => {
    if (!open) return;

    const loadPins = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${apiUrl}/api/pins`);
        const data = await res.json();
        setPins(data);

        // local state stores initial board pins
        setSelectedIds([...existingPins]);
      } catch {
        toast({
          title: "Error",
          description: "Failed to load pins",
          variant: "destructive",
        });
      }
      setLoading(false);
    };

    loadPins();
  }, [open]);

  const togglePin = async (pin: Pin) => {
    const token = localStorage.getItem("auth_token");
    if (!token) return;

    const inBoard = selectedIds.includes(pin._id);

    // 🔥 INSTANT UI UPDATE (optimistic update)
    setSelectedIds((prev) =>
      inBoard ? prev.filter((id) => id !== pin._id) : [...prev, pin._id]
    );

    // 🔥 BACKEND CALL AFTER UI UPDATE
    try {
      const res = await fetch(
        `${apiUrl}/api/boards/${boardId}/pins/${pin._id}`,
        {
          method: inBoard ? "DELETE" : "POST",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!res.ok) throw new Error();

      toast({
        title: inBoard ? "Removed" : "Added",
        description: inBoard
          ? "Pin removed from board"
          : "Pin added to board",
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to update board",
        variant: "destructive",
      });

      // 🔥 revert UI if API failed
      setSelectedIds((prev) =>
        inBoard ? [...prev, pin._id] : prev.filter((id) => id !== pin._id)
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full -max-w-5xl p6 rounded-2xl">
        <DialogHeader>
          <DialogTitle>Add pins to board</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="py-6 text-center text-muted-foreground">
            Loading pins…
          </div>
        ) : (
          <div className="mt-3 max-h-[70vh] overflow-y-auto">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 p-2">
              {pins.map((pin) => {
                const isSelected = selectedIds.includes(pin._id);

                return (
                  <button
                    key={pin._id}
                    type="button"
                    onClick={() => togglePin(pin)}
                    className="relative rounded-xl overflow-hidden border hover:border-primary transition cursor-pointer"
                  >
                    {/* IMAGE OR VIDEO */}
                    {pin.mediaType === "video" ? (
                      <video
                        src={pin.mediaUrl}
                        className="w-full h-56 object-contain bg-black rounded-lg"
                        autoPlay
                        muted
                        playsInline
                      />
                    ) : (
                      <img
                        src={pin.mediaUrl || pin.image}
                        className="w-full h-56 object-contain bg-white rounded-lg"
                        alt="pin"
                      />
                    )}

                    {/* CHECKMARK */}
                    {isSelected && (
                      <div className="absolute top-2 right-2 bg-white rounded-full p-1 shadow">
                        <Check className="w-4 h-4 text-primary" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AddPinToBoardDialog;
