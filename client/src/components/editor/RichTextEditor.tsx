import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableHeader from '@tiptap/extension-table-header';
import TableCell from '@tiptap/extension-table-cell';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { useState, useEffect, useMemo } from 'react';
import { markdownToHtml, isMarkdown } from '@/lib/markdownUtils';
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Quote,
  Code,
  Link as LinkIcon,
  Image as ImageIcon,
  Table as TableIcon,
  Heading1,
  Heading2,
  Heading3,
  Undo,
  Redo,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface RichTextEditorProps {
  content?: string;
  onChange?: (content: string) => void;
  placeholder?: string;
  className?: string;
  editable?: boolean;
}

export function RichTextEditor({
  content = '',
  onChange,
  placeholder = 'Start writing...',
  className,
  editable = true,
}: RichTextEditorProps) {
  const [linkUrl, setLinkUrl] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [showImageInput, setShowImageInput] = useState(false);

  // Convert markdown to HTML if needed
  const processedContent = useMemo(() => {
    if (!content) return '';
    
    // If content looks like markdown, convert it to HTML
    if (isMarkdown(content)) {
      return markdownToHtml(content);
    }
    
    return content;
  }, [content]);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-lg',
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 hover:text-blue-800 underline',
        },
      }),
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: 'border-collapse border border-border w-full my-4',
        },
      }),
      TableRow,
      TableHeader.configure({
        HTMLAttributes: {
          class: 'border border-border bg-muted px-4 py-2 font-semibold',
        },
      }),
      TableCell.configure({
        HTMLAttributes: {
          class: 'border border-border px-4 py-2',
        },
      }),
    ],
    content: processedContent,
    editable,
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML());
    },
  });

  // Update editor content when processedContent changes
  useEffect(() => {
    if (editor && processedContent !== editor.getHTML()) {
      editor.commands.setContent(processedContent);
    }
  }, [editor, processedContent]);

  if (!editor) {
    return null;
  }

  const addImage = () => {
    if (imageUrl) {
      editor.chain().focus().setImage({ src: imageUrl }).run();
      setImageUrl('');
      setShowImageInput(false);
    }
  };

  const addLink = () => {
    if (linkUrl) {
      editor.chain().focus().setLink({ href: linkUrl }).run();
      setLinkUrl('');
      setShowLinkInput(false);
    }
  };

  const addTable = () => {
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  };

  const ToolbarButton = ({ onClick, isActive, children, disabled, title }: any) => (
    <Button
      variant={isActive ? 'default' : 'ghost'}
      size="sm"
      onMouseDown={(e) => {
        e.preventDefault(); // Prevent focus loss
      }}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (editor && onClick) {
          onClick();
        }
      }}
      disabled={disabled || !editor}
      title={title}
      className={cn('h-8 w-8 p-0', isActive && 'bg-primary text-primary-foreground')}
    >
      {children}
    </Button>
  );

  return (
    <div className={cn('overflow-hidden', className)}>
      {editable && (
        <div className="border-b bg-muted/50 p-2">
          <div className="flex flex-wrap items-center gap-1">
            {/* Text formatting */}
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBold().run()}
              isActive={editor.isActive('bold')}
              title="Bold (Ctrl+B)"
            >
              <Bold className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleItalic().run()}
              isActive={editor.isActive('italic')}
              title="Italic (Ctrl+I)"
            >
              <Italic className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleCode().run()}
              isActive={editor.isActive('code')}
              title="Code"
            >
              <Code className="h-4 w-4" />
            </ToolbarButton>

            <Separator orientation="vertical" className="h-6 mx-1" />

            {/* Headings */}
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
              isActive={editor.isActive('heading', { level: 1 })}
              title="Heading 1"
            >
              <Heading1 className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              isActive={editor.isActive('heading', { level: 2 })}
              title="Heading 2"
            >
              <Heading2 className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
              isActive={editor.isActive('heading', { level: 3 })}
              title="Heading 3"
            >
              <Heading3 className="h-4 w-4" />
            </ToolbarButton>

            <Separator orientation="vertical" className="h-6 mx-1" />

            {/* Lists */}
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              isActive={editor.isActive('bulletList')}
              title="Bullet List"
            >
              <List className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              isActive={editor.isActive('orderedList')}
              title="Numbered List"
            >
              <ListOrdered className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              isActive={editor.isActive('blockquote')}
              title="Quote"
            >
              <Quote className="h-4 w-4" />
            </ToolbarButton>

            <Separator orientation="vertical" className="h-6 mx-1" />

            {/* Media and links */}
            <ToolbarButton onClick={() => setShowLinkInput(!showLinkInput)}>
              <LinkIcon className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton onClick={() => setShowImageInput(!showImageInput)}>
              <ImageIcon className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton onClick={addTable}>
              <TableIcon className="h-4 w-4" />
            </ToolbarButton>

            <Separator orientation="vertical" className="h-6 mx-1" />

            {/* Undo/Redo */}
            <ToolbarButton
              onClick={() => editor.chain().focus().undo().run()}
              disabled={!editor.can().undo()}
            >
              <Undo className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().redo().run()}
              disabled={!editor.can().redo()}
            >
              <Redo className="h-4 w-4" />
            </ToolbarButton>
          </div>

          {/* Link input */}
          {showLinkInput && (
            <div className="flex items-center gap-2 mt-2 p-2 bg-background border rounded">
              <Input
                placeholder="Enter URL"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addLink()}
                className="flex-1"
              />
              <Button size="sm" onClick={addLink}>Add Link</Button>
              <Button size="sm" variant="outline" onClick={() => setShowLinkInput(false)}>
                Cancel
              </Button>
            </div>
          )}

          {/* Image input */}
          {showImageInput && (
            <div className="flex items-center gap-2 mt-2 p-2 bg-background border rounded">
              <Input
                placeholder="Enter image URL"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addImage()}
                className="flex-1"
              />
              <Button size="sm" onClick={addImage}>Add Image</Button>
              <Button size="sm" variant="outline" onClick={() => setShowImageInput(false)}>
                Cancel
              </Button>
            </div>
          )}
        </div>
      )}

      <EditorContent
        editor={editor}
        className={cn(
          'prose prose-sm max-w-none p-4 min-h-[200px] focus:outline-none',
          'prose-headings:font-semibold prose-p:my-2 prose-ul:my-2 prose-ol:my-2',
          'prose-li:my-0 prose-blockquote:border-l-4 prose-blockquote:border-border',
          'prose-blockquote:pl-4 prose-blockquote:italic prose-code:bg-muted',
          'prose-code:px-1 prose-code:rounded',
          'dark:prose-invert'
        )}
      />
    </div>
  );
}