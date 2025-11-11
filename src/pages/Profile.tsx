import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Settings, Upload, UserPlus, UserMinus } from "lucide-react";
import Navbar from "@/components/Navbar";
import MasonryGrid from "@/components/MasonryGrid";
import PinCard from "@/components/PinCard";
import CreateBoardDialog from "@/components/CreateBoardDialog";
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
  isSaved?: boolean;
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
  user: {
    _id: string;
    username: string;
  };
  pins: Pin[];
  createdAt: string;
}

interface UserProfile {
  _id: string;
  username: string;
  email: string;
  profilePicture?: string;
  followers?: string[];
  following?: string[];
}

const Profile = () => {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [createdPins, setCreatedPins] = useState<Pin[]>([]);
  const [savedPins, setSavedPins] = useState<Pin[]>([]);
  const [boards, setBoards] = useState<Board[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [uploadingProfilePicture, setUploadingProfilePicture] = useState(false);

  const apiUrl = import.meta.env.VITE_API_URL || "https://pinterest-backend-088x.onrender.com";

  const getImageSrc = (src: string) => src && src.startsWith('/uploads') ? `${apiUrl}${src}` : src;

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!username) return;

      try {
        setIsLoading(true);
        
        // Fetch user profile
        const profileRes = await fetch(`${apiUrl}/api/users/${username}`);
        if (profileRes.ok) {
          const profileData = await profileRes.json();
          setProfile({
            _id: profileData.user._id || profileData.user.id,
            username: profileData.user.username,
            email: profileData.user.email,
            profilePicture: profileData.user.profilePicture,
            followers: profileData.user.followers || [],
            following: profileData.user.following || []
          });
          
          // Set pins from the profile response
          if (profileData.pins) {
            setCreatedPins(profileData.pins);
          }
          
          // Check if current user is following this profile
          if (currentUser && profileData.user.followers) {
            setIsFollowing(profileData.user.followers.includes(currentUser.id));
          }
        }

        // Fetch boards
        try {
          const boardsRes = await fetch(`${apiUrl}/api/users/${username}/boards`);
          if (boardsRes.ok) {
            const userBoards = await boardsRes.json();
            setBoards(userBoards);
          }
        } catch (error) {
          console.log("Boards endpoint not available yet");
        }

        // Fetch saved pins
        try {
          const token = localStorage.getItem('auth_token');
          const headers: HeadersInit = {
            'Content-Type': 'application/json',
          };
          if (token) {
            headers['Authorization'] = `Bearer ${token}`;
          }
          
          const savedPinsRes = await fetch(`${apiUrl}/api/users/${username}/saved-pins`, {
            headers
          });
          if (savedPinsRes.ok) {
            const userSavedPins = await savedPinsRes.json();
            setSavedPins(userSavedPins);
          }
        } catch (error) {
          console.log("Saved pins endpoint not available yet");
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserProfile();
  }, [username, apiUrl, currentUser]);

  const isOwnProfile = currentUser?.username === username;

  const handleSaveChange = (pinId: string, isSaved: boolean) => {
    setCreatedPins(prevPins => 
      prevPins.map(pin => 
        pin._id === pinId ? { ...pin, isSaved } : pin
      )
    );
    setSavedPins(prevPins => 
      isSaved ? prevPins : prevPins.filter(pin => pin._id !== pinId)
    );
  };

  const handleFollowToggle = async () => {
    if (!currentUser || !username) return;
    
    setFollowLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const endpoint = isFollowing ? 'unfollow' : 'follow';
      
      const response = await fetch(`${apiUrl}/api/users/${username}/${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setIsFollowing(!isFollowing);
        setProfile(prev => {
          if (!prev) return null;
          return {
            ...prev,
            followers: isFollowing 
              ? (prev.followers || []).filter(id => id !== currentUser.id)
              : [...(prev.followers || []), currentUser.id]
          };
        });
        
        toast({
          title: "Success",
          description: isFollowing ? "Unfollowed successfully" : "Following successfully",
        });
      } else {
        throw new Error('Failed to update follow status');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update follow status",
        variant: "destructive",
      });
    } finally {
      setFollowLoading(false);
    }
  };

  const handleProfilePictureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !username) return;

    setUploadingProfilePicture(true);
    try {
      // Show preview before upload
      const previewUrl = URL.createObjectURL(file);
      setProfile(prev => prev ? { ...prev, profilePicture: previewUrl } : null);

      // 1) Upload file to /api/upload
      const uploadForm = new FormData();
      uploadForm.append('file', file);

      const token = localStorage.getItem('auth_token');
      const uploadRes = await fetch(`${apiUrl}/api/upload`, {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        body: uploadForm,
      });

      if (!uploadRes.ok) {
        const text = await uploadRes.text().catch(() => '');
        console.error('Upload failed:', uploadRes.status, text);
        throw new Error('Upload failed');
      }

      const uploadData = await uploadRes.json();
      const fileUrl = uploadData.fileUrl || uploadData.url || uploadData.media || uploadData.mediaUrl || uploadData.imageUrl || uploadData.data?.url || uploadData.data?.media;
      if (!fileUrl) {
        console.error('Upload response missing file URL:', uploadData);
        throw new Error('Upload response missing file URL');
      }

      // 2) Send fileUrl to profile update endpoint
      const updateHeaders: HeadersInit = {
        'Content-Type': 'application/json',
      };
      if (token) updateHeaders['Authorization'] = `Bearer ${token}`;

      const updateRes = await fetch(`${apiUrl}/api/profile/update`, {
        method: 'POST',
        headers: updateHeaders,
        body: JSON.stringify({ profilePicture: fileUrl }),
      });

      if (!updateRes.ok) {
        const text = await updateRes.text().catch(() => '');
        console.error('Profile update failed:', updateRes.status, text);
        throw new Error('Failed to update profile');
      }

      // Accept either the updated profile or a success object
      let updated: any = null;
      try {
        updated = await updateRes.json();
      } catch (err) {
        // no json, ignore
      }

      // Update UI: if backend returned updated profile, use it; otherwise set profilePicture directly
      if (updated && updated.profilePicture) {
        setProfile(prev => prev ? { ...prev, profilePicture: updated.profilePicture } : null);
      } else {
        setProfile(prev => prev ? { ...prev, profilePicture: fileUrl } : null);
      }

      // Clean up preview URL
      URL.revokeObjectURL(previewUrl);

      toast({
        title: 'Success',
        description: 'Profile picture updated successfully',
      });
    } catch (error: any) {
      console.error('Profile picture upload error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to upload profile picture',
        variant: 'destructive',
      });
    } finally {
      setUploadingProfilePicture(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        {isLoading ? (
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="text-muted-foreground">Loading profile...</div>
          </div>
        ) : profile ? (
          <div className="space-y-8">
            {/* Profile Header */}
            <div className="flex flex-col items-center gap-4 py-8">
              <div className="relative group">
                <Avatar className="w-32 h-32">
                  <AvatarImage src={getImageSrc(profile.profilePicture)} />
                  <AvatarFallback className="text-4xl bg-primary text-primary-foreground">
                    {profile.username?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                {isOwnProfile && (
                  <Button
                    size="icon"
                    variant="secondary"
                    className="absolute bottom-0 right-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingProfilePicture}
                  >
                    <Upload className="w-4 h-4" />
                  </Button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleProfilePictureUpload}
                  disabled={uploadingProfilePicture}
                />
              </div>
              
              <div className="text-center space-y-2">
                <h1 className="text-4xl font-bold text-foreground">
                  {profile.username}
                </h1>
                <p className="text-lg text-muted-foreground">{profile.email}</p>
                
                <div className="flex gap-6 justify-center pt-2">
                  <div className="text-center">
                    <div className="font-semibold text-foreground">{profile.followers?.length || 0}</div>
                    <div className="text-sm text-muted-foreground">Followers</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-foreground">{profile.following?.length || 0}</div>
                    <div className="text-sm text-muted-foreground">Following</div>
                  </div>
                </div>
              </div>

              {isOwnProfile ? (
                <Button variant="secondary" className="gap-2">
                  <Settings className="w-4 h-4" />
                  Edit Profile
                </Button>
              ) : currentUser ? (
                <Button 
                  onClick={handleFollowToggle}
                  disabled={followLoading}
                  variant={isFollowing ? "outline" : "default"}
                  className="gap-2"
                >
                  {isFollowing ? (
                    <>
                      <UserMinus className="w-4 h-4" />
                      Unfollow
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      Follow
                    </>
                  )}
                </Button>
              ) : null}
            </div>

            {/* Pins Tabs */}
            <Tabs defaultValue="created" className="w-full">
              <TabsList className="w-full max-w-2xl mx-auto grid grid-cols-3">
                <TabsTrigger value="created">Created</TabsTrigger>
                <TabsTrigger value="boards">Boards</TabsTrigger>
                <TabsTrigger value="saved">Saved</TabsTrigger>
              </TabsList>

              <TabsContent value="created" className="mt-8">
                {createdPins.length > 0 ? (
                  <MasonryGrid>
                    {createdPins.map((pin) => (
                      <PinCard
                        key={pin._id}
                        id={pin._id}
                        mediaUrl={getImageSrc(pin.mediaUrl || pin.image)}
                        mediaType={(pin.mediaType as "image" | "video") || "image"}
                        title={pin.title}
                        description={pin.description}
                        isSaved={pin.isSaved}
                        onSaveChange={handleSaveChange}
                      />
                    ))}
                  </MasonryGrid>
                ) : (
                  <div className="text-center py-16 text-muted-foreground">
                    No pins created yet
                  </div>
                )}
              </TabsContent>

              <TabsContent value="boards" className="mt-8">
                {isOwnProfile && (
                  <div className="mb-6">
                    <CreateBoardDialog onBoardCreated={(newBoard) => setBoards([newBoard, ...boards])} />
                  </div>
                )}
                {boards.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {boards.map((board) => (
                      <div
                        key={board._id}
                        className="group cursor-pointer rounded-lg overflow-hidden border border-border bg-card hover:shadow-lg transition-all"
                        onClick={() => navigate(`/board/${board._id}`)}
                      >
                        <div className="aspect-square bg-muted flex items-center justify-center relative overflow-hidden">
                          {board.coverImage ? (
                            <img
                              src={getImageSrc(board.coverImage)}
                              alt={board.name}
                              className="w-full h-full object-cover"
                            />
                          ) : board.pins.length > 0 ? (
                            <img
                              src={getImageSrc(board.pins[0].mediaUrl || board.pins[0].image)}
                              alt={board.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="text-4xl text-muted-foreground">📌</div>
                          )}
                        </div>
                        <div className="p-4">
                          <h3 className="font-semibold text-foreground truncate">{board.name}</h3>
                          <p className="text-sm text-muted-foreground">{board.pins.length} pins</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16 text-muted-foreground">
                    No boards created yet
                  </div>
                )}
              </TabsContent>

              <TabsContent value="saved" className="mt-8">
                {savedPins.length > 0 ? (
                  <MasonryGrid>
                    {savedPins.map((pin) => (
                      <PinCard
                        key={pin._id}
                        id={pin._id}
                        mediaUrl={getImageSrc(pin.mediaUrl || pin.image)}
                        mediaType={(pin.mediaType as "image" | "video") || "image"}
                        title={pin.title}
                        description={pin.description}
                        isSaved={true}
                        onSaveChange={handleSaveChange}
                      />
                    ))}
                  </MasonryGrid>
                ) : (
                  <div className="text-center py-16 text-muted-foreground">
                    No saved pins yet
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          <div className="text-center py-16">
            <h2 className="text-2xl font-bold text-foreground mb-2">User not found</h2>
            <p className="text-muted-foreground">The profile you're looking for doesn't exist.</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default Profile;
