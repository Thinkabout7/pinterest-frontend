// src/pages/Search.tsx
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import MasonryGrid from "@/components/MasonryGrid";
import PinCard from "@/components/PinCard";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const Search = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const query = new URLSearchParams(location.search).get("q") || "";

  const [loading, setLoading] = useState(true);
  const [pins, setPins] = useState([]);
  const [users, setUsers] = useState([]);

  const apiUrl =
    import.meta.env.VITE_API_URL ||
    "https://pinterest-backend-088x.onrender.com";

  // FIX: Re-run when location.search changes
  useEffect(() => {
    const load = async () => {
      setLoading(true);

      try {
        const res = await fetch(
          `${apiUrl}/api/search?q=${encodeURIComponent(query)}`
        );
        const data = await res.json();

        setPins(data.pins || []);
        setUsers(data.users || []);
      } catch {
        setPins([]);
        setUsers([]);
      }

      setLoading(false);
    };

    load();
  }, [query, location.search]); // ← important

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">Results for "{query}"</h1>

      {loading ? (
        <p className="text-muted-foreground">Searching…</p>
      ) : (
        <>
          {users.length > 0 && (
            <>
              <h2 className="text-xl font-semibold mb-3">Users</h2>
              <div className="flex gap-4 mb-10 overflow-x-auto pb-2">
                {users.map((u: any) => (
                  <div
                    key={u._id}
                    onClick={() => navigate(`/profile/${u.username}`)}
                    className="flex items-center gap-3 p-3 border rounded-xl cursor-pointer hover:bg-accent transition"
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
                    <span className="font-medium">{u.username}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {pins.length > 0 ? (
            <>
              <h2 className="text-xl font-semibold mb-3">Pins</h2>
              <MasonryGrid>
                {pins.map((pin: any) => (
                  <PinCard
                    key={pin._id}
                    id={pin._id}
                    imageUrl={pin.mediaUrl}
                    mediaType={pin.mediaType}
                    title={pin.title}
                    description={pin.description}
                  />
                ))}
              </MasonryGrid>
            </>
          ) : (
            <p className="text-muted-foreground mt-10">
              No matching pins found.
            </p>
          )}
        </>
      )}
    </div>
  );
};

export default Search;
