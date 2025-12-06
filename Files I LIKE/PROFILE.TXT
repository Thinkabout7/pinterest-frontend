//profile.tsx

import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserPlus, UserMinus, ArrowRight, Camera, X } from "lucide-react";
import Navbar from "@/components/Navbar";
import MasonryGrid from "@/components/MasonryGrid";
import PinCard from "@/components/PinCard";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface Pin {
  _id: string;
  title: string;
  description: string;
  mediaUrl?: string;
  mediaType: "video" | "image";
}

interface Board {
  _id: string;
  name: string;
  coverImage?: string;
  pins: Pin[];
}

interface UserProfile {
  _id: string;
  username: string;
  profilePicture?: string | null;
  followers?: string[];
  following?: string[];
}

const Profile = () => {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const { user: currentUser, updateUser } = useAuth();
  const { toast } = useToast();

  const apiUrl =
    import.meta.env.VITE_API_URL ||
    "https://pinterest-backend-088x.onrender.com";

  const isOwnProfile = currentUser?.username === username;

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [createdPins, setCreatedPins] = useState<Pin[]>([]);
  const [savedPins, setSavedPins] = useState<Pin[]>([]);
  const [boards, setBoards] = useState<Board[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  const [listOpen, setListOpen] = useState(false);
  const [listType, setListType] =
    useState<"followers" | "following">("followers");
  const [listData, setListData] = useState<any[]>([]);

  /* LOAD PROFILE */
  useEffect(() => {
    const load = async () => {
      if (!username) return;

      setIsLoading(true);

      try {
        const res = await fetch(`${apiUrl}/api/users/${username}`);
        if (res.ok) {
          const data = await res.json();

          setProfile({
            _id: data.user._id,
            username: data.user.username,
            profilePicture: data.user.profilePicture || null,
            followers: data.user.followers || [],
            following: data.user.following || [],
          });

          setCreatedPins(data.pins || []);

          if (currentUser?.id) {
            setIsFollowing(data.user.followers.includes(currentUser.id));
          }
        }

        const b = await fetch(`${apiUrl}/api/users/${username}/boards`);
        if (b.ok) setBoards(await b.json());

        if (isOwnProfile) await loadSavedPins();
      } catch (err) {
        console.error("Profile load error:", err);
      }

      setIsLoading(false);
    };

    load();
  }, [username, currentUser]);

  /* LOAD SAVED PINS */
  const loadSavedPins = async () => {
    if (!isOwnProfile) return;
    const token = localStorage.getItem("auth_token");

    try {
      const res = await fetch(`${apiUrl}/api/users/${username}/saved-pins`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        setSavedPins(await res.json());
      }
    } catch (err) {
      console.error(err);
    }
  };

  /* UPLOAD PROFILE IMAGE */
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const token = localStorage.getItem("auth_token");
      const formData = new FormData();
      formData.append("profilePicture", file);

      const res = await fetch(`${apiUrl}/api/profile/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await res.json();

      setProfile((p) => (p ? { ...p, profilePicture: data.fileUrl } : p));
      updateUser({ profilePicture: data.fileUrl });

      toast({ title: "Profile picture updated" });
    } catch (err) {
      toast({ title: "Upload failed", variant: "destructive" });
    }
  };

  /* REMOVE PROFILE IMAGE */
  const handleRemove = async () => {
    try {
      const token = localStorage.getItem("auth_token");

      const res = await fetch(`${apiUrl}/api/profile/update`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ profilePicture: "" }),
      });

      const data = await res.json();

      setProfile((p) => (p ? { ...p, profilePicture: null } : p));
      updateUser({ profilePicture: null });

      toast({ title: "Profile picture removed" });
    } catch {
      toast({ title: "Failed to remove", variant: "destructive" });
    }
  };

  /* FOLLOW / UNFOLLOW */
  const handleFollowToggle = async () => {
    if (!currentUser?.id || !profile?._id) return;

    setFollowLoading(true);

    try {
      const token = localStorage.getItem("auth_token");
      const endpoint = isFollowing ? "unfollow" : "follow";

      const res = await fetch(
        `${apiUrl}/api/follow/${profile._id}/${endpoint}`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (res.ok) {
        setIsFollowing(!isFollowing);

        setProfile((prev) =>
          prev
            ? {
                ...prev,
                followers: isFollowing
                  ? prev.followers?.filter((id) => id !== currentUser.id)
                  : [...(prev.followers || []), currentUser.id],
              }
            : prev
        );
      }
    } catch (err) {
      console.error(err);
    }

    setFollowLoading(false);
  };

  /* FOLLOW LIST */
  const openFollowList = async (type: "followers" | "following") => {
    if (!profile?._id) return;

    setListType(type);
    setListOpen(true);

    try {
      const res = await fetch(`${apiUrl}/api/follow/${profile._id}/${type}`);
      if (res.ok) {
        setListData(await res.json());
      }
    } catch {
      setListData([]);
    }
  };

  /* UI */
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        {isLoading || !profile ? (
          <div className="text-center py-20 text-muted-foreground">Loading…</div>
        ) : (
          <>
            {/* HEADER */}
            <div className="flex flex-col items-center gap-4 py-8">
              
              {/* AVATAR + CONTROLS */}
              <div className="relative group w-32 h-32">
                <Avatar className="w-32 h-32">
                  {profile.profilePicture ? (
                    <AvatarImage src={profile.profilePicture} />
                  ) : (
                    <AvatarFallback>
                      {profile.username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  )}
                </Avatar>

                {isOwnProfile && (
                  <>
                    {/* Upload button */}
                    <label
                      htmlFor="upload-input"
                      className="absolute bottom-1 left-1 bg-black/70 text-white p-2 rounded-full cursor-pointer opacity-0 group-hover:opacity-100 transition"
                    >
                      <Camera className="w-4 h-4" />
                    </label>

                    <input
                      id="upload-input"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleUpload}
                    />

                    {/* Delete button only if picture exists */}
                    {profile.profilePicture && (
                      <button
                        onClick={handleRemove}
                        className="absolute bottom-1 right-1 bg-red-600 text-white p-2 rounded-full"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </>
                )}
              </div>

              <h1 className="text-4xl font-bold">{profile.username}</h1>

              {/* FOLLOW COUNTS */}
              <div className="flex gap-6 text-sm mt-1">
                <p onClick={() => openFollowList("followers")} className="cursor-pointer">
                  <strong>{profile.followers?.length || 0}</strong> Followers
                </p>
                <p onClick={() => openFollowList("following")} className="cursor-pointer">
                  <strong>{profile.following?.length || 0}</strong> Following
                </p>
              </div>

              {/* FOLLOW BUTTON */}
              {!isOwnProfile && (
                <Button
                  onClick={handleFollowToggle}
                  disabled={followLoading}
                  className={
                    isFollowing
                      ? "bg-white text-black border border-black hover:bg-gray-100"
                      : ""
                  }
                >
                  {isFollowing ? (
                    <>
                      <UserMinus className="w-4 h-4 mr-2" /> Following
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4 mr-2" /> Follow
                    </>
                  )}
                </Button>
              )}
            </div>

            {/* TABS */}
            <Tabs
              defaultValue="created"
              className="w-full"
              onValueChange={(val) => {
                if (val === "saved") loadSavedPins();
              }}
            >
              <TabsList className="grid grid-cols-3 max-w-lg mx-auto">
                <TabsTrigger value="created">Pins</TabsTrigger>
                <TabsTrigger value="boards">Boards</TabsTrigger>
                <TabsTrigger value="saved">Saved</TabsTrigger>
              </TabsList>

              {/* CREATED */}
              <TabsContent value="created" className="mt-8">
                {createdPins.length ? (
                  <MasonryGrid>
                    {createdPins
                      .filter((p) => p && p._id)
                      .map((pin) => (
                      <PinCard
                        key={pin._id}
                        id={pin._id}
                        imageUrl={pin.mediaUrl}
                        mediaType={pin.mediaType}
                        title={pin.title}
                        description={pin.description}
                        showEditButton={isOwnProfile}
                      />
                    ))}
                  </MasonryGrid>
                ) : (
                  <p className="text-center py-12 text-muted-foreground">
                    No pins yet
                  </p>
                )}
              </TabsContent>

              {/* BOARDS */}
              <TabsContent value="boards" className="mt-8">
                {boards.length ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {boards
                    .filter((b) => b && b._id)
                    .map((board) => (
                      <div
                        key={board._id}
                        onClick={() => navigate(`/board/${board._id}`)}
                        className="cursor-pointer rounded-xl overflow-hidden border"
                      >
                        <div className="aspect-[16/9] bg-muted">
                          <img
                            src={board.coverImage || board.pins?.[0]?.mediaUrl}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="p-3">
                          <h3 className="font-semibold">{board.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {board.pins.length} pins
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center py-12 text-muted-foreground">
                    No boards
                  </p>
                )}
              </TabsContent>

              {/* SAVED */}
              <TabsContent value="saved" className="mt-8">
                {savedPins.length ? (
                  <MasonryGrid>
                    {savedPins
                    .filter((p) => p && p._id)
                    .map((pin) => (
                      <PinCard
                        key={pin._id}
                        id={pin._id}
                        imageUrl={pin.mediaUrl}
                        mediaType={pin.mediaType}
                        title={pin.title}
                        description={pin.description}
                        isSaved={true}
                        showSaveButton={true}
                      />
                    ))}
                  </MasonryGrid>
                ) : (
                  <p className="text-center py-12 text-muted-foreground">
                    Nothing saved yet
                  </p>
                )}
              </TabsContent>
            </Tabs>
          </>
        )}
      </main>

      {/* FOLLOWERS / FOLLOWING MODAL */}
      <Dialog open={listOpen} onOpenChange={setListOpen}>
        <DialogContent className="max-w-sm z-[9999]">
          <DialogHeader>
            <DialogTitle className="capitalize">{listType}</DialogTitle>
          </DialogHeader>

          <div className="space-y-3 max-h-[350px] overflow-y-auto">
            {listData.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">
                No {listType}
              </p>
            ) : (
              listData.map((u) => (
                <div
                  key={u._id}
                  onClick={() => {
                    setListOpen(false);
                    navigate(`/profile/${u.username}`);
                  }}
                  className="flex items-center gap-3 p-2 rounded hover:bg-accent cursor-pointer"
                >
                  <Avatar>
                    {u.profilePicture ? (
                      <AvatarImage src={u.profilePicture} />
                    ) : (
                      <AvatarFallback>
                        {u.username.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    )}
                  </Avatar>

                  <div className="flex-1">
                    <p className="font-medium">{u.username}</p>
                  </div>

                  <ArrowRight className="w-4 h-4 text-muted-foreground" />
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Profile;
