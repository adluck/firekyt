import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Globe, Save } from 'lucide-react';
import type { Site } from '@shared/schema';

interface SiteSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sites: Site[];
  onSave: (siteId: number | null) => void;
  isLoading?: boolean;
  title?: string;
  description?: string;
}

export function SiteSelectionDialog({
  open,
  onOpenChange,
  sites,
  onSave,
  isLoading = false,
  title = "Save Content",
  description = "Choose a site to save this content to, or save without a specific site."
}: SiteSelectionDialogProps) {
  const [selectedSiteId, setSelectedSiteId] = useState<string>("");

  const handleSave = () => {
    const siteId = selectedSiteId ? parseInt(selectedSiteId) : null;
    onSave(siteId);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setSelectedSiteId("");
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Save className="h-5 w-5" />
            {title}
          </DialogTitle>
          <DialogDescription>
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="site-select">Target Site (Optional)</Label>
            <Select
              value={selectedSiteId}
              onValueChange={setSelectedSiteId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a site or leave blank" />
              </SelectTrigger>
              <SelectContent>
                {sites.map(site => (
                  <SelectItem key={site.id} value={site.id.toString()}>
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      <span>{site.name}</span>
                      {site.domain && (
                        <Badge variant="outline" className="text-xs">
                          {site.domain}
                        </Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              Content can be saved without selecting a specific site and organized later.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save Content
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}