import { useParams, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { UnifiedContentEditor } from '@/components/editor/UnifiedContentEditor';
import { apiRequest } from '@/lib/queryClient';
import type { Content } from '@shared/schema';

interface ContentEditorProps {
  id?: string;
}

export default function ContentEditor({ id: propId }: ContentEditorProps = {} as ContentEditorProps) {
  const { id: urlId } = useParams<{ id?: string }>();
  const id = propId || urlId;
  const [, setLocation] = useLocation();
  
  // Get siteId from URL parameters for initial content (for new content)
  const urlParams = new URLSearchParams(window.location.search);
  const siteIdFromUrl = urlParams.get('siteId');
  
  // Fetch existing content if editing
  const { data: existingContent, isLoading } = useQuery<Content>({
    queryKey: [`/api/content/${id}`],
    enabled: !!id && id !== 'undefined',
  });

  const handleSaveSuccess = async (result: any) => {
    if (!id && result?.id) {
      setLocation(`/content/editor/${result.id}`);
    }
  };

  // Show loading state while fetching content
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Prepare initial content
  const initialContent = existingContent ? {
    id: existingContent.id,
    title: existingContent.title,
    content: existingContent.content,
    contentType: existingContent.contentType,
    status: existingContent.status,
    seoTitle: existingContent.seoTitle,
    seoDescription: existingContent.seoDescription,
    targetKeywords: existingContent.targetKeywords,
    siteId: existingContent.siteId || null,
    richContent: existingContent.richContent,
    comparisonTables: existingContent.comparisonTables,
    affiliateLinks: existingContent.affiliateLinks,
  } : {
    siteId: siteIdFromUrl ? parseInt(siteIdFromUrl) : 0,
  };

  return (
    <div className="p-6">
      <UnifiedContentEditor
        contentId={id}
        initialContent={initialContent}
        mode={id ? 'edit' : 'create'}
        showHeader={true}
        showSidebar={true}
        enableTables={true}
        enableSEO={true}
        enablePreview={true}
        requiredFields={['title', 'content', 'siteId']}
        customSaveMethod={id ? 'PATCH' : 'POST'}
        onSave={async (data) => {
          const isUpdate = id && id !== 'undefined';
          const url = isUpdate ? `/api/content/${id}` : '/api/content';
          const method = isUpdate ? 'PATCH' : 'POST';
          
          const response = await apiRequest(method, url, data);
          const result = await response.json();
          
          await handleSaveSuccess(result);
          return result;
        }}
      />
    </div>
  );
}