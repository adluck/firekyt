import { Node, mergeAttributes } from '@tiptap/core';

export interface EmbedOptions {
  HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    embed: {
      setEmbed: (options: { src: string }) => ReturnType;
    };
  }
}

export const EmbedExtension = Node.create<EmbedOptions>({
  name: 'embed',

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  group: 'block',

  atom: true,

  addAttributes() {
    return {
      src: {
        default: null,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-embed]',
        getAttrs: (dom) => ({
          src: (dom as HTMLElement).getAttribute('data-embed-code') || '',
        }),
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const embedCode = HTMLAttributes.src || '';
    
    // Check if this is a widget embed code
    const isWidgetEmbed = embedCode.includes('/widgets/') || embedCode.includes('widget-id');
    const embedType = isWidgetEmbed ? 'Affiliate Widget' : 'External Embed';
    const embedIcon = isWidgetEmbed ? '🛍️' : '📱';
    
    return [
      'div',
      mergeAttributes(
        {
          'data-embed': true,
          'data-embed-code': embedCode,
          class: 'embed-container my-4 border-2 border-dashed border-blue-300 bg-blue-50 dark:bg-blue-950 dark:border-blue-700 rounded-lg p-4',
          style: 'white-space: normal;',
        },
        this.options.HTMLAttributes
      ),
      [
        'div',
        {
          class: 'flex items-center gap-2 text-sm font-medium text-blue-700 dark:text-blue-300 mb-3',
        },
        `${embedIcon} ${embedType}`,
      ],
      [
        'div',
        {
          class: 'text-xs text-blue-600 dark:text-blue-400 mb-2',
        },
        'This embed will render when published to your website',
      ],
      [
        'div',
        {
          class: 'embed-preview bg-white dark:bg-gray-800 rounded border p-3 text-xs font-mono text-gray-600 dark:text-gray-300',
          style: 'max-height: 80px; overflow: hidden; word-break: break-all;',
        },
        embedCode.length > 200 ? embedCode.substring(0, 200) + '...' : embedCode,
      ],
    ];
  },

  addCommands() {
    return {
      setEmbed:
        (options) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: options,
          });
        },
    };
  },
});