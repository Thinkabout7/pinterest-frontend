import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, Download, Share2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ShareModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pinId: string;
  imageUrl: string;
  title?: string;
}

const ShareModal = ({ open, onOpenChange, pinId, imageUrl, title }: ShareModalProps) => {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const pinUrl = `${window.location.origin}/pin/${pinId}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(pinUrl);
      setCopied(true);
      toast({
        title: "Link copied!",
        description: "Pin link copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Please copy the link manually",
        variant: "destructive",
      });
    }
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title || 'pin'}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast({
        title: "Downloaded!",
        description: "Image downloaded successfully",
      });
    } catch (err) {
      toast({
        title: "Download failed",
        description: "Failed to download image",
        variant: "destructive",
      });
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: title || 'Amazing pin',
          text: `Check out this pin: ${title || 'Amazing pin'}`,
          url: pinUrl,
        });
      } catch (err) {
        // User cancelled or share failed, fallback to copy
        handleCopyLink();
      }
    } else {
      // Fallback for browsers without Web Share API
      handleCopyLink();
    }
  };

  const handleOpenInNewTab = () => {
    window.open(pinUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share this Pin</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex gap-2">
            <Input value={pinUrl} readOnly className="flex-1" />
            <Button onClick={handleCopyLink} variant="outline" size="sm">
              <Copy className="w-4 h-4" />
              {copied ? "Copied!" : "Copy"}
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button onClick={handleDownload} variant="outline" className="justify-start">
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
            <Button onClick={handleOpenInNewTab} variant="outline" className="justify-start">
              <Share2 className="w-4 h-4 mr-2" />
              Open in new tab
            </Button>
            <Button onClick={handleShare} variant="outline" className="justify-start">
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShareModal;
