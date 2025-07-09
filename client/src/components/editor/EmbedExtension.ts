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
    
    // Check if this is a FireKyt widget shortcode
    const isFireKytShortcode = embedCode.includes('[firekyt_widget');
    
    if (isFireKytShortcode) {
      // Extract widget ID for display
      const widgetIdMatch = embedCode.match(/id="(\d+)"/);
      const widgetId = widgetIdMatch ? widgetIdMatch[1] : 'Unknown';
      
      // Show preview in editor (this will be converted server-side for publication)
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
            class: 'embed-preview bg-white dark:bg-gray-800 rounded border relative',
          },
          [
            'div',
            {
              class: 'p-3 text-xs font-mono text-gray-600 dark:text-gray-300 pr-16',
              style: 'word-break: break-all;',
            },
            embedCode,
          ],
          [
            'button',
            {
              class: 'absolute top-2 right-2 px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors copy-shortcode-btn',
              'data-shortcode': embedCode,
              title: 'Copy shortcode',
            },
            'Copy',
          ],
        ],
      ];
    }
    
    // For other embed codes, render as HTML
    return [
      'div',
      mergeAttributes(
        {
          'data-embed': true,
          'data-embed-code': embedCode,
          innerHTML: embedCode,
        },
        this.options.HTMLAttributes
      ),
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