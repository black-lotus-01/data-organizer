import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useApp } from '@/contexts/AppContext';
import { format } from 'date-fns';
import { Search, Filter, Calendar as CalendarIcon, FileText, Image, Video, Music, Archive, X, RefreshCw } from 'lucide-react';

interface SearchFilters {
  query: string;
  fileType: 'all' | 'documents' | 'images' | 'videos' | 'audio' | 'archives';
  sizeMin: string;
  sizeMax: string;
  dateFrom?: Date;
  dateTo?: Date;
  folderName: string;
  status: 'all' | 'completed' | 'pending' | 'error';
}

interface SearchResult {
  id: string;
  fileName: string;
  fileType: string;
  size: number;
  dateModified: Date;
  folderRecommendation?: string;
  status: 'completed' | 'pending' | 'error';
  confidence?: number;
}

const mockResults: SearchResult[] = [
  {
    id: '1',
    fileName: 'project-proposal.pdf',
    fileType: 'pdf',
    size: 2.5 * 1024 * 1024,
    dateModified: new Date('2024-01-15'),
    folderRecommendation: 'Documents/Projects',
    status: 'completed',
    confidence: 0.95
  },
  {
    id: '2',
    fileName: 'vacation-photo.jpg',
    fileType: 'jpg',
    size: 3.2 * 1024 * 1024,
    dateModified: new Date('2024-01-10'),
    folderRecommendation: 'Images/Personal',
    status: 'completed',
    confidence: 0.88
  },
  {
    id: '3',
    fileName: 'meeting-recording.mp4',
    fileType: 'mp4',
    size: 45.7 * 1024 * 1024,
    dateModified: new Date('2024-01-20'),
    folderRecommendation: 'Videos/Work',
    status: 'pending',
    confidence: 0.76
  }
];

export default function AdvancedSearch() {
  const { state } = useApp();
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    fileType: 'all',
    sizeMin: '',
    sizeMax: '',
    folderName: '',
    status: 'all'
  });
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [activeFiltersCount, setActiveFiltersCount] = useState(0);

  useEffect(() => {
    // Count active filters
    let count = 0;
    if (filters.query) count++;
    if (filters.fileType !== 'all') count++;
    if (filters.sizeMin) count++;
    if (filters.sizeMax) count++;
    if (filters.dateFrom) count++;
    if (filters.dateTo) count++;
    if (filters.folderName) count++;
    if (filters.status !== 'all') count++;
    
    setActiveFiltersCount(count);
  }, [filters]);

  const handleSearch = async () => {
    setIsSearching(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Apply filters to mock data (in real app, this would be an API call)
    let filteredResults = [...mockResults];
    
    if (filters.query) {
      filteredResults = filteredResults.filter(result =>
        result.fileName.toLowerCase().includes(filters.query.toLowerCase())
      );
    }
    
    if (filters.fileType !== 'all') {
      const typeMap = {
        documents: ['pdf', 'doc', 'docx', 'txt', 'md'],
        images: ['jpg', 'jpeg', 'png', 'gif', 'svg'],
        videos: ['mp4', 'avi', 'mov', 'mkv'],
        audio: ['mp3', 'wav', 'ogg', 'flac'],
        archives: ['zip', 'rar', '7z', 'tar', 'gz']
      };
      
      const allowedTypes = typeMap[filters.fileType as keyof typeof typeMap] || [];
      filteredResults = filteredResults.filter(result =>
        allowedTypes.includes(result.fileType.toLowerCase())
      );
    }
    
    if (filters.status !== 'all') {
      filteredResults = filteredResults.filter(result =>
        result.status === filters.status
      );
    }
    
    setResults(filteredResults);
    setIsSearching(false);
  };

  const resetFilters = () => {
    setFilters({
      query: '',
      fileType: 'all',
      sizeMin: '',
      sizeMax: '',
      folderName: '',
      status: 'all'
    });
    setResults([]);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileType: string) => {
    const type = fileType.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'svg'].includes(type)) {
      return <Image className="h-4 w-4 text-blue-500" />;
    } else if (['mp4', 'avi', 'mov', 'mkv'].includes(type)) {
      return <Video className="h-4 w-4 text-purple-500" />;
    } else if (['mp3', 'wav', 'ogg', 'flac'].includes(type)) {
      return <Music className="h-4 w-4 text-green-500" />;
    } else if (['zip', 'rar', '7z', 'tar', 'gz'].includes(type)) {
      return <Archive className="h-4 w-4 text-orange-500" />;
    }
    return <FileText className="h-4 w-4 text-gray-500" />;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Advanced Search</h2>
        <p className="text-muted-foreground">Search and filter through your processed files and archive plans</p>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Search className="h-5 w-5 mr-2" />
              Search Filters
            </div>
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="animate-pulse-soft">
                {activeFiltersCount} filter{activeFiltersCount !== 1 ? 's' : ''} active
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Primary Search */}
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                placeholder="Search files by name..."
                value={filters.query}
                onChange={(e) => setFilters({ ...filters, query: e.target.value })}
                className="w-full"
              />
            </div>
            <Button onClick={handleSearch} disabled={isSearching} className="hover-scale">
              {isSearching ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Search className="h-4 w-4 mr-2" />
              )}
              Search
            </Button>
          </div>

          <Separator />

          {/* Advanced Filters */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>File Type</Label>
              <Select value={filters.fileType} onValueChange={(value: SearchFilters['fileType']) => setFilters({ ...filters, fileType: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover border border-border">
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="documents">Documents</SelectItem>
                  <SelectItem value="images">Images</SelectItem>
                  <SelectItem value="videos">Videos</SelectItem>
                  <SelectItem value="audio">Audio</SelectItem>
                  <SelectItem value="archives">Archives</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={filters.status} onValueChange={(value: SearchFilters['status']) => setFilters({ ...filters, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover border border-border">
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Min Size (MB)</Label>
              <Input
                type="number"
                placeholder="0"
                value={filters.sizeMin}
                onChange={(e) => setFilters({ ...filters, sizeMin: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Max Size (MB)</Label>
              <Input
                type="number"
                placeholder="1000"
                value={filters.sizeMax}
                onChange={(e) => setFilters({ ...filters, sizeMax: e.target.value })}
              />
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Date From</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.dateFrom ? format(filters.dateFrom, 'PPP') : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-popover border border-border" align="start">
                  <Calendar
                    mode="single"
                    selected={filters.dateFrom}
                    onSelect={(date) => setFilters({ ...filters, dateFrom: date })}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Date To</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.dateTo ? format(filters.dateTo, 'PPP') : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-popover border border-border" align="start">
                  <Calendar
                    mode="single"
                    selected={filters.dateTo}
                    onSelect={(date) => setFilters({ ...filters, dateTo: date })}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Folder Name</Label>
              <Input
                placeholder="e.g., Documents"
                value={filters.folderName}
                onChange={(e) => setFilters({ ...filters, folderName: e.target.value })}
              />
            </div>
          </div>

          {activeFiltersCount > 0 && (
            <div className="flex justify-end">
              <Button onClick={resetFilters} variant="outline" size="sm">
                <X className="h-4 w-4 mr-2" />
                Clear Filters
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Search Results</CardTitle>
            <CardDescription>
              Found {results.length} file{results.length !== 1 ? 's' : ''} matching your criteria
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {results.map((result) => (
                <div
                  key={result.id}
                  className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/30 transition-colors animate-fade-in"
                >
                  <div className="flex items-center gap-3">
                    {getFileIcon(result.fileType)}
                    <div>
                      <div className="font-medium text-sm">{result.fileName}</div>
                      <div className="text-xs text-muted-foreground">
                        {formatFileSize(result.size)} • {format(result.dateModified, 'MMM d, yyyy')}
                      </div>
                      {result.folderRecommendation && (
                        <div className="text-xs text-primary">
                          → {result.folderRecommendation}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {result.confidence && (
                      <Badge variant="outline" className="text-xs">
                        {Math.round(result.confidence * 100)}%
                      </Badge>
                    )}
                    <Badge
                      variant={
                        result.status === 'completed' ? 'default' :
                        result.status === 'error' ? 'destructive' : 'secondary'
                      }
                      className="text-xs"
                    >
                      {result.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Results */}
      {results.length === 0 && filters.query && !isSearching && (
        <Card>
          <CardContent className="text-center py-12">
            <Search className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No Results Found</h3>
            <p className="text-muted-foreground">
              Try adjusting your search criteria or filters
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}