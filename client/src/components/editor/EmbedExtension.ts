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
    
    return [
      'div',
      mergeAttributes(
        {
          'data-embed': true,
          'data-embed-code': embedCode,
          class: 'embed-container my-4 border rounded-lg bg-muted/10 overflow-hidden p-4',
          style: 'white-space: normal;',
        },
        this.options.HTMLAttributes
      ),
      [
        'div',
        {
          class: 'text-sm text-muted-foreground mb-2',
        },
        '📱 Widget Embed',
      ],
      [
        'div',
        {
          class: 'embed-preview bg-background rounded border p-2 text-xs font-mono',
          style: 'max-height: 100px; overflow: hidden;',
        },
        embedCode.length > 150 ? embedCode.substring(0, 150) + '...' : embedCode,
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