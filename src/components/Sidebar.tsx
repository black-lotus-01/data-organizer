import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/ThemeToggle";
import { 
  FolderOpen, 
  Settings, 
  Brain, 
  ChevronLeft, 
  ChevronRight,
  Archive,
  FileSearch,
  History,
  Layers,
  Search,
  Zap
} from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  currentView: string;
  onViewChange: (view: string) => void;
}

export const Sidebar = ({ isOpen, onToggle, currentView, onViewChange }: SidebarProps) => {
  const sections = [
    { id: 'home', label: 'Dashboard', icon: Archive },
    { id: 'upload', label: 'File Upload', icon: FileSearch },
    { id: 'batch', label: 'Batch Process', icon: Layers },
    { id: 'search', label: 'Advanced Search', icon: Search },
    { id: 'rules', label: 'Custom Rules', icon: Zap },
    { id: 'saved-plans', label: 'Saved Plans', icon: FolderOpen },
    { id: 'activity', label: 'Activity History', icon: History },
    { id: 'settings', label: 'AI Settings', icon: Brain },
  ];

  return (
    <div
      className={cn(
        "fixed left-0 top-0 h-full bg-card border-r border-border transition-all duration-300 z-40",
        isOpen ? "w-64" : "w-16"
      )}
    >
      <div className="flex items-center justify-between p-4 border-b border-border">
        {isOpen && (
          <div className="flex items-center space-x-2">
            <FolderOpen className="h-6 w-6 text-primary animate-bounce-soft" />
            <span className="font-semibold text-lg">Smart Archiver</span>
          </div>
        )}
        <div className="flex items-center gap-2">
          {isOpen && <ThemeToggle />}
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className="h-8 w-8 p-0 hover-scale"
          >
            {isOpen ? (
              <ChevronLeft className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      <nav className="p-2 space-y-1">
        {sections.map((section) => {
          const Icon = section.icon;
          const isActive = currentView === section.id;
          
          return (
            <Button
              key={section.id}
              variant={isActive ? "secondary" : "ghost"}
              className={cn(
                "w-full justify-start transition-all hover-scale",
                !isOpen && "px-2",
                isActive && "bg-secondary/80 animate-scale-in"
              )}
              onClick={() => onViewChange(section.id)}
            >
              <Icon className={cn("h-4 w-4", !isOpen && "mx-auto", isActive && "text-primary")} />
              {isOpen && (
                <>
                  <span className="ml-3 font-medium">{section.label}</span>
                  {section.id === 'batch' && (
                    <Badge variant="outline" className="ml-auto text-xs animate-pulse-soft">
                      New
                    </Badge>
                  )}
                </>
              )}
            </Button>
          );
        })}
      </nav>

      {isOpen && (
        <div className="absolute bottom-4 left-4 right-4">
          <div className="p-3 bg-muted/50 rounded-lg">
            <div className="text-xs text-muted-foreground mb-1">Storage Used</div>
            <div className="text-sm font-medium">2.4 GB / 10 GB</div>
            <div className="w-full bg-border rounded-full h-1.5 mt-2">
              <div className="bg-primary h-1.5 rounded-full" style={{ width: '24%' }} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};