import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { TableNode } from './TableNode';

export interface TableOptions {
  HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    comparisonTable: {
      /**
       * Insert a comparison table
       */
      insertComparisonTable: (tableConfig: any) => ReturnType;
    };
  }
}

export const TableExtension = Node.create<TableOptions>({
  name: 'comparisonTable',

  group: 'block',

  atom: true,

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      tableConfig: {
        default: null,
        parseHTML: element => {
          const data = element.getAttribute('data-table-config');
          return data ? JSON.parse(data) : null;
        },
        renderHTML: attributes => {
          if (!attributes.tableConfig) return {};
          return {
            'data-table-config': JSON.stringify(attributes.tableConfig),
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="comparison-table"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(
        this.options.HTMLAttributes,
        HTMLAttributes,
        { 'data-type': 'comparison-table' }
      ),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(TableNode);
  },

  addCommands() {
    return {
      insertComparisonTable:
        (tableConfig: any) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: { tableConfig },
          });
        },
    };
  },
});