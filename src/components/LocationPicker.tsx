import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FolderOpen, MapPin, CheckCircle } from 'lucide-react';
import { fileOrganizer } from '@/services/fileOrganizer';
import { useToast } from '@/hooks/use-toast';

interface LocationPickerProps {
  onLocationSelected: (selected: boolean) => void;
}

export const LocationPicker = ({ onLocationSelected }: LocationPickerProps) => {
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const { toast } = useToast();

  const selectLocation = async () => {
    // Check browser support first
    if (!window.showDirectoryPicker) {
      toast({
        title: "Browser Not Supported",
        description: "File System Access API is not supported. Please use Chrome, Edge, or another compatible browser.",
        variant: "destructive"
      });
      return;
    }

    setIsSelecting(true);
    try {
      const success = await fileOrganizer.selectOrganizationLocation();
      if (success) {
        const location = fileOrganizer.getSelectedLocation();
        setSelectedLocation(location);
        onLocationSelected(true);
        toast({
          title: "Location Selected",
          description: `Files will be organized in: ${location}`,
        });
      } else {
        toast({
          title: "Selection Cancelled",
          description: "No location was selected for file organization.",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Selection Failed",
        description: "Unable to access directory. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSelecting(false);
    }
  };

  const isLocationSelected = fileOrganizer.isLocationSelected();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <MapPin className="h-5 w-5 mr-2" />
          Organization Location
        </CardTitle>
        <CardDescription>
          Choose where your organized files will be saved
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLocationSelected ? (
          <div className="flex items-center space-x-3 p-4 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <div>
              <p className="font-medium text-green-800">Location Selected</p>
              <p className="text-sm text-green-600">{selectedLocation || fileOrganizer.getSelectedLocation()}</p>
            </div>
          </div>
        ) : (
          <div className="text-center py-6">
            <FolderOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-sm text-muted-foreground mb-4">
              Select a folder where your organized files will be saved
            </p>
            {!window.showDirectoryPicker && (
              <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <p className="text-sm text-orange-800">
                  ⚠️ File System Access not supported in this browser. Please use Chrome, Edge, or another compatible browser.
                </p>
              </div>
            )}
            <Button 
              onClick={selectLocation} 
              disabled={isSelecting || !window.showDirectoryPicker}
              className="w-full"
            >
              {isSelecting ? 'Selecting...' : 'Choose Folder'}
            </Button>
          </div>
        )}
        
        {isLocationSelected && (
          <Button 
            variant="outline" 
            onClick={selectLocation} 
            disabled={isSelecting}
            className="w-full mt-4"
          >
            {isSelecting ? 'Selecting...' : 'Change Location'}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};