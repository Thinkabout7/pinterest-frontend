// src/pages/Search.tsx
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import MasonryGrid from "@/components/MasonryGrid";
import PinCard from "@/components/PinCard";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type FilterType = "all" | "pins" | "videos" | "boards" | "profiles";

const Search = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const query = new URLSearchParams(location.search).get("q") || "";

  const [loading, setLoading] = useState(true);
  const [pins, setPins] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [boards, setBoards] = useState<any[]>([]);

  const [selectedType, setSelectedType] = useState<FilterType>("all");
  const [pendingType, setPendingType] = useState<FilterType>("all");

  const apiUrl =
    import.meta.env.VITE_API_URL ||
    "https://pinterest-backend-088x.onrender.com";

  // Load results when query or selectedType changes
  useEffect(() => {
    const load = async () => {
      setLoading(true);

      try {
        const fetchType = selectedType === "all" ? "pins" : selectedType;
        const res = await fetch(
          `${apiUrl}/api/search?q=${encodeURIComponent(query)}&type=${fetchType}`
        );
        const data = await res.json();

        setPins(data.pins || []);
        setUsers(data.users || []);
        setBoards(data.boards || []);
      } catch {
        setPins([]);
        setUsers([]);
        setBoards([]);
      }

      setLoading(false);
    };

    load();
  }, [query, selectedType, location.search]);

  const showPins = selectedType === "all" || selectedType === "pins" || selectedType === "videos";
  const showBoards = selectedType === "boards";
  const showUsers = selectedType === "profiles";

  // Exclude videos when viewing "All Pins"
  const visiblePins =
    selectedType === "all"
      ? pins.filter(
          (p: any) =>
            (p.mediaType || "").toLowerCase() !== "video" &&
            (p.type || "").toLowerCase() !== "video"
        )
      : pins;

  const handleApply = () => setSelectedType(pendingType);
  const handleReset = () => {
    setPendingType("all");
    setSelectedType("all");
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Filters */}
        <div className="lg:w-56">
          <h2 className="text-sm font-semibold text-muted-foreground mb-2">Filters</h2>
          <div className="space-y-2">
            {[
              { label: "All Pins", value: "all" as FilterType },
              { label: "Videos", value: "videos" as FilterType },
              { label: "Boards", value: "boards" as FilterType },
              { label: "Profiles", value: "profiles" as FilterType },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => setPendingType(opt.value)}
                className={`w-full flex items-center justify-between rounded-full px-3 py-2 text-sm border ${
                  pendingType === opt.value
                    ? "border-foreground text-foreground"
                    : "border-transparent text-muted-foreground hover:bg-accent"
                }`}
              >
                <span>{opt.label}</span>
                <span
                  className={`h-4 w-4 rounded-full border ${
                    pendingType === opt.value ? "border-foreground" : "border-muted"
                  } flex items-center justify-center`}
                >
                  {pendingType === opt.value && <span className="h-2 w-2 rounded-full bg-foreground" />}
                </span>
              </button>
            ))}
          </div>

          <div className="flex gap-2 mt-4">
            <button
              onClick={handleReset}
              className="flex-1 rounded-full px-3 py-2 text-sm bg-red-600 text-white hover:bg-red-700"
            >
              Reset
            </button>
            <button
              onClick={handleApply}
              className="flex-1 rounded-full px-3 py-2 text-sm bg-white text-foreground border border-muted hover:bg-accent"
            >
              Apply
            </button>
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 min-w-0">
          <h1 className="text-3xl font-bold mb-4">Results for "{query}"</h1>
          {loading ? (
            <p className="text-muted-foreground">Searching...</p>
          ) : (
            <div className="space-y-6">
              {showUsers && (
                <div>
                  <h2 className="text-xl font-semibold mb-3">Profiles</h2>
                  {users.length > 0 ? (
                    <div className="flex gap-4 overflow-x-auto pb-2">
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
                                {u.username?.[0]?.toUpperCase()}
                              </AvatarFallback>
                            )}
                          </Avatar>
                          <span className="font-medium">{u.username}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No matching profiles.</p>
                  )}
                </div>
              )}

              {showBoards && (
                <div>
                  <h2 className="text-xl font-semibold mb-3">Boards</h2>
                  {boards.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {boards.map((b: any) => (
                        <div
                          key={b._id}
                          className="rounded-xl overflow-hidden border bg-card cursor-pointer hover:shadow-md transition"
                          onClick={() => navigate(`/board/${b._id}`)}
                        >
                          <div className="aspect-[4/3] bg-muted">
                            {b.coverImage && (
                              <img
                                src={b.coverImage}
                                className="w-full h-full object-cover"
                              />
                            )}
                          </div>
                          <div className="p-3">
                            <div className="font-semibold">{b.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {b.owner && (
                                <span
                                  className="text-foreground hover:underline cursor-pointer"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/profile/${b.owner}`);
                                  }}
                                >
                                  {b.owner}
                                </span>
                              )}
                              {b.owner ? " • " : ""}
                              {b.pinsCount || 0} pins
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No matching boards.</p>
                  )}
                </div>
              )}

              {showPins && (
                <div>
                  <h2 className="text-xl font-semibold mb-3">Pins</h2>
                  {visiblePins.length > 0 ? (
                    <MasonryGrid>
                      {visiblePins.map((pin: any) => (
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
                    ) : (
                      <p className="text-muted-foreground">No matching pins.</p>
                    )}
                </div>
              )}

              {!showPins && !showBoards && !showUsers && (
                <p className="text-muted-foreground">No results.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Search;
