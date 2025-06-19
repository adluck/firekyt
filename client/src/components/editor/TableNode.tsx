import React from 'react';
import { NodeViewWrapper } from '@tiptap/react';
import { ComparisonTableRenderer } from './ComparisonTableRenderer';
import { Button } from '@/components/ui/button';
import { Edit, Trash2 } from 'lucide-react';
import type { ReactNodeViewProps } from '@tiptap/react';

export function TableNode({ node, updateAttributes, deleteNode, selected }: ReactNodeViewProps) {
  const tableConfig = node.attrs.tableConfig;

  const handleEdit = () => {
    // This will be triggered to open the table editor
    const event = new CustomEvent('editTable', { 
      detail: { 
        config: tableConfig,
        updateCallback: (newConfig: any) => {
          updateAttributes({ tableConfig: newConfig });
        }
      }
    });
    window.dispatchEvent(event);
  };

  return (
    <NodeViewWrapper className={`table-node ${selected ? 'ProseMirror-selectednode' : ''}`}>
      <div className="relative group">
        {/* Table controls overlay */}
        {selected && (
          <div className="absolute top-2 right-2 flex gap-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              size="sm"
              variant="secondary"
              onClick={handleEdit}
              className="h-8 w-8 p-0"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={deleteNode}
              className="h-8 w-8 p-0"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
        
        {/* Render the actual table */}
        <ComparisonTableRenderer 
          config={tableConfig} 
          className="my-4"
        />
      </div>
    </NodeViewWrapper>
  );
}