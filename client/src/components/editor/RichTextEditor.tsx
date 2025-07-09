import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableHeader from '@tiptap/extension-table-header';
import TableCell from '@tiptap/extension-table-cell';
import { TableExtension } from './TableExtension';
import { EmbedExtension } from './EmbedExtension';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
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
  Monitor,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface RichTextEditorProps {
  content?: string;
  onChange?: (content: string) => void;
  placeholder?: string;
  className?: string;
  editable?: boolean;
  onEditorReady?: (editor: any) => void;
  previewMode?: boolean;
  isUpdatingFromWidget?: boolean;
}

export function RichTextEditor({
  content = '',
  onChange,
  placeholder = 'Start writing...',
  className,
  editable = true,
  onEditorReady,
  previewMode = false,
  isUpdatingFromWidget = false,
}: RichTextEditorProps) {
  const [linkUrl, setLinkUrl] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [embedCode, setEmbedCode] = useState('');
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [showImageInput, setShowImageInput] = useState(false);
  const [showEmbedDialog, setShowEmbedDialog] = useState(false);
  const { toast } = useToast();

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
      TableExtension,
      EmbedExtension,
    ],
    content: processedContent,
    editable,
    onUpdate: ({ editor }) => {
      setIsUserEditing(true);
      onChange?.(editor.getHTML());
      // Reset the flag after a short delay to allow content changes to propagate
      setTimeout(() => setIsUserEditing(false), 100);
    },
  });

  // Update editor content when processedContent changes
  // Prevent circular updates by tracking if we're in the middle of user editing
  const [isUserEditing, setIsUserEditing] = useState(false);
  
  useEffect(() => {
    if (editor && processedContent && !isUserEditing && !isUpdatingFromWidget) {
      const currentContent = editor.getHTML();
      const normalizedCurrent = currentContent.trim();
      const normalizedNew = processedContent.trim();
      
      // Only update if content is meaningfully different
      if (normalizedCurrent !== normalizedNew && processedContent !== '<p></p>') {
        console.log('🔄 RichTextEditor syncing content:', { current: normalizedCurrent, new: normalizedNew });
        editor.commands.setContent(processedContent);
      }
    } else if (isUpdatingFromWidget) {
      console.log('🔒 RichTextEditor: Skipping sync due to widget update lock');
    }
  }, [editor, processedContent, isUserEditing, isUpdatingFromWidget]);

  // Expose editor instance globally for table insertion and notify parent
  useEffect(() => {
    if (editor) {
      window.editor = editor;
      onEditorReady?.(editor);
    }
    return () => {
      if (window.editor === editor) {
        delete window.editor;
      }
    };
  }, [editor, onEditorReady]);

  // Handle copy button clicks for shortcodes
  useEffect(() => {
    if (!editor) return;

    const handleCopyClick = async (event: Event) => {
      const target = event.target as HTMLElement;
      if (target?.classList.contains('copy-shortcode-btn')) {
        event.preventDefault();
        event.stopPropagation();
        
        const shortcode = target.getAttribute('data-shortcode');
        if (shortcode) {
          try {
            await navigator.clipboard.writeText(shortcode);
            toast({
              title: "Copied!",
              description: "Widget shortcode copied to clipboard",
            });
          } catch (error) {
            console.error('Copy failed:', error);
            toast({
              title: "Copy failed",
              description: "Please copy the shortcode manually",
              variant: "destructive",
            });
          }
        }
      }
    };

    // Use event delegation on the editor container
    const editorElement = editor.view.dom;
    editorElement.addEventListener('click', handleCopyClick);

    return () => {
      editorElement.removeEventListener('click', handleCopyClick);
    };
  }, [editor, toast]);

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

  const insertEmbed = () => {
    if (embedCode.trim()) {
      // Insert the embed code as a custom embed node
      editor.chain().focus().setEmbed({ src: embedCode.trim() }).run();
      setEmbedCode('');
      setShowEmbedDialog(false);
    }
  };

  const ToolbarButton = ({ onClick, isActive, children, disabled, title }: any) => {
    const handleClick = () => {
      if (editor && onClick) {
        try {
          onClick();
        } catch (error) {
          console.error('Toolbar button error:', error);
        }
      }
    };

    return (
      <button
        onClick={handleClick}
        disabled={disabled || !editor}
        title={title}
        className={cn(
          'toolbar-button touch-manipulation',
          'inline-flex items-center justify-center',
          'rounded-md font-medium transition-colors',
          'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
          'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
          'disabled:pointer-events-none disabled:opacity-50',
          isActive && 'bg-primary text-primary-foreground hover:bg-primary/90'
        )}
        style={{
          height: '40px',
          width: '40px',
          minHeight: '40px',
          minWidth: '40px',
          padding: '0',
          fontSize: '14px'
        }}
      >
        <span 
          className="toolbar-icon flex items-center justify-center"
          style={{
            height: '20px',
            width: '20px'
          }}
        >
          {children}
        </span>
      </button>
    );
  };

  return (
    <div className={cn('overflow-hidden', className)}>
      {editable && (
        <div className="border-b bg-muted/50 p-2 sm:p-3">
          <div className="flex flex-wrap items-center gap-1 sm:gap-2">
            {/* Text formatting */}
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBold().run()}
              isActive={editor.isActive('bold')}
              title="Bold (Ctrl+B)"
            >
              <Bold className="h-5 w-5 sm:h-4 sm:w-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleItalic().run()}
              isActive={editor.isActive('italic')}
              title="Italic (Ctrl+I)"
            >
              <Italic className="h-5 w-5 sm:h-4 sm:w-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleCode().run()}
              isActive={editor.isActive('code')}
              title="Code"
            >
              <Code className="h-5 w-5 sm:h-4 sm:w-4" />
            </ToolbarButton>

            <Separator orientation="vertical" className="h-8 sm:h-6 mx-1" />

            {/* Headings */}
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
              isActive={editor.isActive('heading', { level: 1 })}
              title="Heading 1"
            >
              <Heading1 className="h-5 w-5 sm:h-4 sm:w-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              isActive={editor.isActive('heading', { level: 2 })}
              title="Heading 2"
            >
              <Heading2 className="h-5 w-5 sm:h-4 sm:w-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
              isActive={editor.isActive('heading', { level: 3 })}
              title="Heading 3"
            >
              <Heading3 className="h-5 w-5 sm:h-4 sm:w-4" />
            </ToolbarButton>

            <Separator orientation="vertical" className="h-8 sm:h-6 mx-1" />

            {/* Lists */}
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              isActive={editor.isActive('bulletList')}
              title="Bullet List"
            >
              <List className="h-5 w-5 sm:h-4 sm:w-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              isActive={editor.isActive('orderedList')}
              title="Numbered List"
            >
              <ListOrdered className="h-5 w-5 sm:h-4 sm:w-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              isActive={editor.isActive('blockquote')}
              title="Quote"
            >
              <Quote className="h-5 w-5 sm:h-4 sm:w-4" />
            </ToolbarButton>

            <Separator orientation="vertical" className="h-8 sm:h-6 mx-1" />

            {/* Media and links */}
            <ToolbarButton onClick={() => setShowLinkInput(!showLinkInput)}>
              <LinkIcon className="h-5 w-5 sm:h-4 sm:w-4" />
            </ToolbarButton>
            <ToolbarButton onClick={() => setShowImageInput(!showImageInput)}>
              <ImageIcon className="h-5 w-5 sm:h-4 sm:w-4" />
            </ToolbarButton>
            <ToolbarButton onClick={addTable}>
              <TableIcon className="h-5 w-5 sm:h-4 sm:w-4" />
            </ToolbarButton>
            
            <Dialog open={showEmbedDialog} onOpenChange={setShowEmbedDialog}>
              <DialogTrigger asChild>
                <ToolbarButton onClick={() => setShowEmbedDialog(true)} title="Insert Widget Embed">
                  <Monitor className="h-5 w-5 sm:h-4 sm:w-4" />
                </ToolbarButton>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Insert Widget Embed Code</DialogTitle>
                  <DialogDescription>
                    Paste your widget embed code to include it in your content. This can be HTML, JavaScript, or iframe code.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Paste your widget embed code:</label>
                    <Textarea
                      placeholder="Paste your widget embed code here (HTML, JavaScript, or iframe)..."
                      value={embedCode}
                      onChange={(e) => setEmbedCode(e.target.value)}
                      rows={8}
                      className="mt-2"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => {
                      setShowEmbedDialog(false);
                      setEmbedCode('');
                    }}>
                      Cancel
                    </Button>
                    <Button onClick={insertEmbed} disabled={!embedCode.trim()}>
                      Insert Embed
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Separator orientation="vertical" className="h-8 sm:h-6 mx-1" />

            {/* Undo/Redo */}
            <ToolbarButton
              onClick={() => editor.chain().focus().undo().run()}
              disabled={!editor.can().undo()}
              title="Undo"
            >
              <Undo className="h-5 w-5 sm:h-4 sm:w-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().redo().run()}
              disabled={!editor.can().redo()}
              title="Redo"
            >
              <Redo className="h-5 w-5 sm:h-4 sm:w-4" />
            </ToolbarButton>
          </div>

          {/* Link input */}
          {showLinkInput && (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mt-2 p-2 sm:p-3 bg-background border rounded">
              <Input
                placeholder="Enter URL"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addLink()}
                className="flex-1 h-10 sm:h-9"
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={addLink} className="h-10 sm:h-9 flex-1 sm:flex-none">Add Link</Button>
                <Button size="sm" variant="outline" onClick={() => setShowLinkInput(false)} className="h-10 sm:h-9 flex-1 sm:flex-none">
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Image input */}
          {showImageInput && (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mt-2 p-2 sm:p-3 bg-background border rounded">
              <Input
                placeholder="Enter image URL"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addImage()}
                className="flex-1 h-10 sm:h-9"
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={addImage} className="h-10 sm:h-9 flex-1 sm:flex-none">Add Image</Button>
                <Button size="sm" variant="outline" onClick={() => setShowImageInput(false)} className="h-10 sm:h-9 flex-1 sm:flex-none">
                  Cancel
                </Button>
              </div>
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