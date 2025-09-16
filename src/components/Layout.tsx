import { Sidebar } from "@/components/Sidebar";
import { useState } from "react";

interface LayoutProps {
  children: React.ReactNode;
  currentView: string;
  onViewChange: (view: string) => void;
}

export const Layout = ({ children, currentView, onViewChange }: LayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex h-screen bg-background">
      <Sidebar 
        isOpen={sidebarOpen} 
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        currentView={currentView}
        onViewChange={onViewChange}
      />
      <main className={`flex-1 transition-all duration-300 animate-fade-in ${sidebarOpen ? 'ml-64' : 'ml-16'}`}>
        {children}
      </main>
    </div>
  );
};