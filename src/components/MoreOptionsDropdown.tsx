import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Download, EyeOff, Flag } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface MoreOptionsDropdownProps {
  imageUrl: string;
  title?: string;
  disabled?: boolean;
  onDisabled?: () => void;
}

const MoreOptionsDropdown = ({
  imageUrl,
  title,
  disabled = false,
  onDisabled = () => {},
}: MoreOptionsDropdownProps) => {
  const { toast } = useToast();

  const handleDownload = async () => {
    if (disabled) return onDisabled();
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

  const handleHide = () => {
    if (disabled) return onDisabled();
    toast({
      title: "Pin hidden",
      description: "This pin will no longer appear in your feed",
    });
    // TODO: Implement hide functionality
  };

  const handleReport = () => {
    if (disabled) return onDisabled();
    toast({
      title: "Report submitted",
      description: "Thank you for helping keep Pinterest safe",
    });
    // TODO: Implement report functionality
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={(e) => {
            if (disabled) {
              e.preventDefault();
              e.stopPropagation();
              onDisabled();
            }
          }}
        >
          <MoreHorizontal className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleDownload}>
          <Download className="w-4 h-4 mr-2" />
          Download image
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleReport}>
          <Flag className="w-4 h-4 mr-2" />
          Report pin
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default MoreOptionsDropdown;
