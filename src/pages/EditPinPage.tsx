// src/pages/EditPinPage.tsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const EditPinPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const { toast } = useToast();

  const [pin, setPin] = useState<any>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const apiUrl =
    import.meta.env.VITE_API_URL ||
    "https://pinterest-backend-088x.onrender.com";

  useEffect(() => {
    const load = async () => {
      const res = await fetch(`${apiUrl}/api/pins/${id}`);
      if (res.ok) setPin(await res.json());
    };
    load();
  }, [id]);

  const handleSave = async () => {
    const res = await fetch(`${apiUrl}/api/pins/${id}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: pin.title,
        description: pin.description,
      }),
    });

    if (res.ok) {
      toast({ title: "Saved!" });
      navigate(`/pin/${id}`);
      return; // stay on page
    }

    toast({ title: "Failed", variant: "destructive" });
  };

  const actuallyDelete = async () => {
    const res = await fetch(`${apiUrl}/api/pins/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.ok) {
      toast({ title: "Pin deleted" });
      navigate(`/profile/${user.username}?tab=created`);
    } else {
      toast({ title: "Delete failed", variant: "destructive" });
    }
  };

  if (!pin) return <div className="p-8 text-center">Loading…</div>;

  return (
    <>
      <div className="max-w-xl mx-auto p-6">
      <Button
          variant="ghost"
          className="mb-4"
          onClick={() => navigate(`/profile/${user.username}?tab=created`)}
        >
          ← Back
        </Button>

 
        <h1 className="text-2xl font-bold mb-4">Edit Pin</h1>

        <Input
          value={pin.title}
          onChange={(e) => setPin({ ...pin, title: e.target.value })}
          placeholder="Pin title"
          className="mb-4"
        />

        <Textarea
          value={pin.description}
          onChange={(e) => setPin({ ...pin, description: e.target.value })}
          placeholder="Pin description"
          className="mb-4"
        />

        <div className="flex gap-4 mt-6">
          <Button onClick={handleSave}>Save</Button>
          <Button variant="destructive" onClick={() => setConfirmOpen(true)}>
            Delete
          </Button>
        </div>
      </div>

      {/* DELETE CONFIRMATION MODAL */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Are you sure?</DialogTitle>
          </DialogHeader>

          <p className="text-sm text-muted-foreground mb-4">
            If you delete this Pin, it’ll be gone for good and those who’ve saved it won’t be able to view it.
          </p>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={actuallyDelete}>
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default EditPinPage;
