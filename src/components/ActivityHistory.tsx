import React, { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Trash2, Search, Filter, Clock, CheckCircle, XCircle, Loader, AlertCircle } from 'lucide-react';
import { format, isToday, isYesterday, subDays } from 'date-fns';
import { ActivityType, OperationStatus } from '@/types/archiver';
import { getActivityIcon, formatActivityTime } from '@/services/activityManager';

export default function ActivityHistory() {
  const { state, clearHistory } = useApp();
  const { activityHistory } = state;
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const getStatusIcon = (status: OperationStatus) => {
    switch (status) {
      case OperationStatus.COMPLETED:
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case OperationStatus.FAILED:
        return <XCircle className="h-4 w-4 text-red-500" />;
      case OperationStatus.IN_PROGRESS:
        return <Loader className="h-4 w-4 text-blue-500 animate-spin" />;
      case OperationStatus.CANCELLED:
        return <XCircle className="h-4 w-4 text-orange-500" />;
      case OperationStatus.ROLLED_BACK:
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadgeVariant = (status: OperationStatus) => {
    switch (status) {
      case OperationStatus.COMPLETED:
        return 'default';
      case OperationStatus.FAILED:
        return 'destructive';
      case OperationStatus.IN_PROGRESS:
        return 'secondary';
      case OperationStatus.CANCELLED:
        return 'outline';
      case OperationStatus.ROLLED_BACK:
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const filteredActivities = activityHistory.filter(activity => {
    const matchesSearch = activity.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         activity.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || activity.status === statusFilter;
    const matchesType = typeFilter === 'all' || activity.type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const groupedActivities = filteredActivities.reduce((groups, activity) => {
    const activityDate = new Date(activity.timestamp);
    let dateKey: string;
    
    if (isToday(activityDate)) {
      dateKey = 'Today';
    } else if (isYesterday(activityDate)) {
      dateKey = 'Yesterday';
    } else if (activityDate > subDays(new Date(), 7)) {
      dateKey = format(activityDate, 'EEEE'); // Day of week
    } else {
      dateKey = format(activityDate, 'MMM d, yyyy');
    }
    
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(activity);
    return groups;
  }, {} as Record<string, typeof activityHistory>);

  const handleClearHistory = () => {
    clearHistory();
    toast.success('Activity history cleared');
  };

  if (activityHistory.length === 0) {
    return (
      <div className="text-center py-12">
        <Clock className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium text-foreground mb-2">No Activity Yet</h3>
        <p className="text-muted-foreground">
          Your activity history will appear here as you use the application.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Activity History</h2>
          <p className="text-muted-foreground">Track all your file organization activities</p>
        </div>
        <Button
          onClick={handleClearHistory}
          variant="outline"
          size="sm"
          className="text-destructive hover:text-destructive"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Clear History
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search activities..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value={OperationStatus.COMPLETED}>Completed</SelectItem>
                <SelectItem value={OperationStatus.FAILED}>Failed</SelectItem>
                <SelectItem value={OperationStatus.IN_PROGRESS}>In Progress</SelectItem>
                <SelectItem value={OperationStatus.CANCELLED}>Cancelled</SelectItem>
                <SelectItem value={OperationStatus.ROLLED_BACK}>Rolled Back</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value={ActivityType.FILE_UPLOAD}>File Upload</SelectItem>
                <SelectItem value={ActivityType.FILE_ANALYSIS}>File Analysis</SelectItem>
                <SelectItem value={ActivityType.PLAN_GENERATED}>Plan Generated</SelectItem>
                <SelectItem value={ActivityType.PLAN_EXECUTED}>Plan Executed</SelectItem>
                <SelectItem value={ActivityType.AI_CONNECTED}>AI Connected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
        {Object.entries(groupedActivities).map(([dateKey, activities]) => (
          <div key={dateKey}>
            <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              {dateKey}
            </h3>
            <div className="space-y-3">
              {activities.map((activity) => (
                <Card key={activity.id} className="hover:shadow-sm transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="text-2xl">
                        {getActivityIcon(activity.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-foreground truncate">
                            {activity.title}
                          </h4>
                          <Badge variant={getStatusBadgeVariant(activity.status)} className="text-xs">
                            {activity.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {activity.description}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>{formatActivityTime(activity.timestamp)}</span>
                          {activity.metadata?.fileCount && (
                            <span>{activity.metadata.fileCount} files</span>
                          )}
                          {activity.metadata?.folderCount && (
                            <span>{activity.metadata.folderCount} folders</span>
                          )}
                          {activity.metadata?.provider && (
                            <span>via {activity.metadata.provider}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        {getStatusIcon(activity.status)}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}