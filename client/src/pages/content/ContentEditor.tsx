import { useParams, useLocation } from 'wouter';
import { UnifiedContentEditor } from '@/components/editor/UnifiedContentEditor';
import { apiRequest } from '@/lib/queryClient';

interface ContentEditorProps {
  id?: string;
}

export default function ContentEditor({ id: propId }: ContentEditorProps = {} as ContentEditorProps) {
  const { id: urlId } = useParams<{ id?: string }>();
  const id = propId || urlId;
  const [, setLocation] = useLocation();
  
  // Get siteId from URL parameters for initial content
  const urlParams = new URLSearchParams(window.location.search);
  const siteIdFromUrl = urlParams.get('siteId');
  
  const initialContent = {
    siteId: siteIdFromUrl ? parseInt(siteIdFromUrl) : 0,
  };

  const handleSaveSuccess = async (result: any) => {
    if (!id && result?.id) {
      setLocation(`/content/editor/${result.id}`);
    }
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