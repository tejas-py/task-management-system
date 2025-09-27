import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Users, CheckSquare, LogOut, ChevronDown, Menu, X } from "lucide-react";
import { AuthService } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { UsersManagement } from "./UsersManagement";
import { TasksManagement } from "./TasksManagement";

type TabType = "users" | "tasks";

interface DashboardProps {
  onLogout: () => void;
}

export function Dashboard({ onLogout }: DashboardProps) {
  const [activeTab, setActiveTab] = useState<TabType>("tasks");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const user = AuthService.getUser();

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogout = () => {
    AuthService.logout();
    onLogout();
  };

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setSidebarOpen(false); // Close sidebar on mobile when tab is selected
  };

  const renderContent = () => {
    switch (activeTab) {
      case "users":
        return <UsersManagement />;
      case "tasks":
        return <TasksManagement />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50">
        <div className="flex h-16 items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-4">
            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
            <h1 className="text-lg md:text-xl font-bold">Task Management System</h1>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>
                    {user?.username?.charAt(0).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden sm:inline">{user?.username}</span>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <div className="flex relative">
        {/* Mobile Overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={cn(
            "fixed md:relative z-50 md:z-auto",
            "w-64 min-h-[calc(100vh-4rem)] border-r bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50",
            "transition-transform duration-300 ease-in-out",
            sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
          )}
        >
          <nav className="p-4 space-y-2">
            <Button
              variant={activeTab === "tasks" ? "default" : "ghost"}
              className={cn(
                "w-full justify-start",
                activeTab === "tasks" && "bg-primary text-primary-foreground"
              )}
              onClick={() => handleTabChange("tasks")}
            >
              <CheckSquare className="mr-2 h-4 w-4" />
              Tasks
            </Button>

            <Button
              variant={activeTab === "users" ? "default" : "ghost"}
              className={cn(
                "w-full justify-start",
                activeTab === "users" && "bg-primary text-primary-foreground"
              )}
              onClick={() => handleTabChange("users")}
            >
              <Users className="mr-2 h-4 w-4" />
              Users
            </Button>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 md:ml-0">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}