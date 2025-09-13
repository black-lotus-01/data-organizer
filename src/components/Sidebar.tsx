import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  FolderOpen, 
  Settings, 
  Brain, 
  ChevronLeft, 
  ChevronRight,
  Archive,
  FileSearch,
  History
} from "lucide-react";
import { useState } from "react";

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export const Sidebar = ({ isOpen, onToggle }: SidebarProps) => {
  const [activeSection, setActiveSection] = useState('archive');

  const sections = [
    { id: 'archive', label: 'Smart Archive', icon: Archive },
    { id: 'analyze', label: 'File Analysis', icon: FileSearch },
    { id: 'history', label: 'History', icon: History },
    { id: 'ai', label: 'AI Settings', icon: Brain },
    { id: 'settings', label: 'Settings', icon: Settings },
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
            <FolderOpen className="h-6 w-6 text-primary" />
            <span className="font-semibold text-lg">Smart Archiver</span>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggle}
          className="h-8 w-8 p-0"
        >
          {isOpen ? (
            <ChevronLeft className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </Button>
      </div>

      <nav className="p-2 space-y-1">
        {sections.map((section) => {
          const Icon = section.icon;
          const isActive = activeSection === section.id;
          
          return (
            <Button
              key={section.id}
              variant={isActive ? "secondary" : "ghost"}
              className={cn(
                "w-full justify-start",
                !isOpen && "px-2",
                isActive && "bg-secondary/80"
              )}
              onClick={() => setActiveSection(section.id)}
            >
              <Icon className={cn("h-4 w-4", !isOpen && "mx-auto")} />
              {isOpen && (
                <>
                  <span className="ml-3">{section.label}</span>
                  {section.id === 'ai' && (
                    <Badge variant="secondary" className="ml-auto text-xs">
                      3
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