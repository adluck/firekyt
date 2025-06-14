import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Globe, FileText, TrendingUp, Settings, MoreHorizontal } from "lucide-react";
import { Link } from "wouter";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Site } from "@shared/schema";

interface SiteCardProps {
  site: Site;
  contentCount?: number;
  totalViews?: number;
  onEdit: () => void;
  onDelete: () => void;
}

export function SiteCard({ 
  site, 
  contentCount = 0, 
  totalViews = 0,
  onEdit,
  onDelete 
}: SiteCardProps) {
  return (
    <Card className="card-hover">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <CardTitle className="text-lg">{site.name}</CardTitle>
          {site.domain && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Globe className="h-3 w-3" />
              {site.domain}
            </div>
          )}
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onEdit}>
              <Settings className="h-4 w-4 mr-2" />
              Edit Site
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={onDelete}
              className="text-destructive"
            >
              Delete Site
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {site.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {site.description}
          </p>
        )}
        
        {site.niche && (
          <Badge variant="secondary" className="text-xs">
            {site.niche}
          </Badge>
        )}
        
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-1 text-muted-foreground">
            <FileText className="h-3 w-3" />
            {contentCount} articles
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <TrendingUp className="h-3 w-3" />
            {totalViews.toLocaleString()} views
          </div>
        </div>
        
        <div className="flex gap-2">
          <Link href={`/sites/${site.id}`} className="flex-1">
            <Button variant="outline" className="w-full">
              View Details
            </Button>
          </Link>
          <Link href={`/content?siteId=${site.id}`} className="flex-1">
            <Button className="w-full btn-gradient">
              Create Content
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
