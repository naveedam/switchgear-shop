
import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";

interface NavUserMenuProps {
  onSignIn: () => void;
  onLogout: () => void;
}

const getInitials = (name: string) =>
  name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase();

const getDashboardLink = (role: string | undefined) => {
  switch (role) {
    case "seller":
      return "/seller";
    case "admin":
      return "/admin";
    case "buyer":
    default:
      return "/";
  }
};

const NavUserMenu: React.FC<NavUserMenuProps> = ({ onSignIn, onLogout }) => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  console.log('NavUserMenu - user role:', user?.role, 'isAuthenticated:', isAuthenticated);

  if (!isAuthenticated)
    return (
      <Button onClick={onSignIn}>
        Sign In
      </Button>
    );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user?.profileImage} alt={user?.name} />
            <AvatarFallback>
              {user?.name ? getInitials(user.name) : "U"}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => navigate(getDashboardLink(user?.role))}>
          Dashboard
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate("/profile")}>
          Profile
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate("/orders")}>
          Orders
        </DropdownMenuItem>
        {(!user?.role || user?.role === 'buyer') && (
          <>
            <DropdownMenuItem onClick={() => navigate("/buyer/projects")}>
              Smart BOM Builder
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/buyer/rfqs")}>
              My RFQs
            </DropdownMenuItem>
          </>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onLogout}>
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default NavUserMenu;
