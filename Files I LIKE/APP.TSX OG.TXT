// src/App.tsx
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Feed from "@/pages/Feed";
import PinDetail from "@/pages/PinDetail";
import Auth from "@/pages/Auth";
import Profile from "@/pages/Profile";
import Create from "@/pages/Create";
import BoardDetail from "@/pages/BoardDetail";
import NotFound from "@/pages/NotFound";
import Notifications from "@/pages/Notifications";
import EditPinPage from "@/pages/EditPinPage";
import Search from "@/pages/Search";
import Settings from "@/pages/Settings";
const App = () => {
  return (
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Root → instantly go to login */}
          <Route path="/" element={<Navigate to="/auth" replace />} />

          {/* Auth page */}
          <Route path="/auth" element={<Auth />} />

          {/* All other pages */}
          <Route path="/home" element={<Feed />} />
          <Route path="/pin/:id" element={<PinDetail />} />
          <Route path="/profile/:username" element={<Profile />} />
          <Route path="/create" element={<Create />} />
          <Route path="/board/:boardId" element={<BoardDetail />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/pin/:id/edit" element={<EditPinPage />} />
          <Route path="/settings" element={<Settings />} />

          {/* FIXED: Search page MUST load Search component */}
          <Route path="/search" element={<Search />} />

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  );
};

export default App;
