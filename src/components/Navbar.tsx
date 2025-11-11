import { Search, LogOut, User, Plus, Settings, Bell } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <nav className="sticky top-0 z-50 bg-card border-b border-border">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="bg-primary text-primary-foreground rounded-full p-2">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="currentColor"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 19c-.721 0-1.418-.158-2.063-.463l2.063-4.063V9.5c0-.276.224-.5.5-.5h3c.276 0 .5.224.5.5v4.974l2.063 4.063A6.978 6.978 0 0 1 12 19zm5.684-2.316L15 13.974V9.5c0-1.378-1.122-2.5-2.5-2.5h-3c-1.378 0-2.5 1.122-2.5 2.5v4.474l-2.684 2.71A6.96 6.96 0 0 1 5 12c0-3.86 3.14-7 7-7s7 3.14 7 7a6.96 6.96 0 0 1-.316 2.684z" />
              </svg>
            </div>
            <span className="text-xl font-bold text-foreground">Pinboard</span>
          </Link>
          
          <div className="flex-1 max-w-2xl">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search for inspiration..."
                className="pl-10 bg-secondary border-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <Button 
                  onClick={() => navigate("/create")} 
                  size="sm"
                  className="gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span className="hidden md:inline">Create</span>
                </Button>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                        {user?.username?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <span className="hidden md:inline">{user?.username}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem 
                      onClick={() => user?.username && navigate(`/profile/${user.username}`)}
                      disabled={!user?.username}
                    >
                      <User className="mr-2 h-4 w-4" />
                      <span>View Profile</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/settings")}>
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Settings</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/notifications")}>
                      <Bell className="mr-2 h-4 w-4" />
                      <span>Notifications</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Logout</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <Button onClick={() => navigate("/auth")} variant="default">
                Login
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
