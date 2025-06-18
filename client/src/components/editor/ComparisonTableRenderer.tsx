import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Star, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Product } from '@shared/schema';

interface TableColumn {
  id: string;
  name: string;
  type: 'text' | 'number' | 'price' | 'rating' | 'image' | 'link' | 'boolean';
  required?: boolean;
  sortable?: boolean;
  productField?: string;
}

interface TableRow {
  id: string;
  productId?: number;
  customData: Record<string, any>;
}

interface ComparisonTableConfig {
  id?: number;
  name: string;
  description?: string;
  columns: TableColumn[];
  rows: TableRow[];
  styling: {
    headerBg: string;
    alternateRows: boolean;
    borderStyle: 'none' | 'light' | 'medium' | 'heavy';
    compact: boolean;
  };
  settings: {
    showHeader: boolean;
    showImages: boolean;
    maxRows: number;
    sortable: boolean;
  };
}

interface ComparisonTableRendererProps {
  config: ComparisonTableConfig;
  className?: string;
}

export function ComparisonTableRenderer({ config, className }: ComparisonTableRendererProps) {
  // Fetch products data
  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ['/api/products'],
  });

  const renderCellValue = (row: TableRow, column: TableColumn) => {
    const product = row.productId ? products.find(p => p.id === row.productId) : null;
    
    // Get value from product data or custom data
    const value = column.productField && product 
      ? product[column.productField as keyof Product]
      : row.customData[column.id];

    if (!value && value !== 0) return '-';

    switch (column.type) {
      case 'price':
        return `$${Number(value).toFixed(2)}`;
      case 'rating':
        return (
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            <span>{Number(value).toFixed(1)}</span>
          </div>
        );
      case 'image':
        return value ? (
          <img 
            src={value} 
            alt="" 
            className="w-16 h-16 object-cover rounded" 
          />
        ) : null;
      case 'link':
        return (
          <a 
            href={value} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-blue-600 hover:underline inline-flex items-center gap-1"
          >
            View Product
            <ExternalLink className="w-3 h-3" />
          </a>
        );
      case 'boolean':
        return value ? '✓' : '✗';
      default:
        return String(value);
    }
  };

  const getBorderClass = () => {
    switch (config.styling.borderStyle) {
      case 'none': return '';
      case 'light': return 'border border-gray-200';
      case 'medium': return 'border-2 border-gray-300';
      case 'heavy': return 'border-4 border-gray-400';
      default: return 'border border-gray-200';
    }
  };

  if (!config.rows.length) {
    return (
      <div className={cn('border rounded-lg p-8 text-center', className)}>
        <p className="text-muted-foreground">No products added to comparison table</p>
        <p className="text-sm text-muted-foreground mt-2">
          Add products in the Tables tab to see the comparison
        </p>
      </div>
    );
  }

  return (
    <div className={cn('overflow-x-auto', className)}>
      <table className={cn('w-full', getBorderClass())}>
        {config.settings.showHeader && (
          <thead>
            <tr style={{ backgroundColor: config.styling.headerBg }}>
              {config.columns.map((column) => (
                <th
                  key={column.id}
                  className={cn(
                    'px-4 py-3 text-left font-semibold',
                    config.styling.compact ? 'px-2 py-2' : 'px-4 py-3'
                  )}
                >
                  {column.name}
                </th>
              ))}
            </tr>
          </thead>
        )}
        <tbody>
          {config.rows.slice(0, config.settings.maxRows).map((row, rowIndex) => (
            <tr
              key={row.id}
              className={cn(
                config.styling.alternateRows && rowIndex % 2 === 1 && 'bg-gray-50',
                'border-t'
              )}
            >
              {config.columns.map((column) => (
                <td
                  key={`${row.id}-${column.id}`}
                  className={cn(
                    'px-4 py-3 align-top',
                    config.styling.compact ? 'px-2 py-2' : 'px-4 py-3'
                  )}
                >
                  {renderCellValue(row, column)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}