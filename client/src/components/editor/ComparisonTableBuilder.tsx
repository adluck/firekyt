import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Plus,
  Trash2,
  GripVertical,
  Settings,
  Eye,
  Edit,
  Star,
  DollarSign,
  ExternalLink,
  Image as ImageIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';

interface Product {
  id: number;
  title: string;
  price: number;
  rating: number;
  imageUrl?: string;
  affiliateUrl?: string;
  brand?: string;
  category: string;
  commissionRate: number;
  [key: string]: any;
}

interface TableColumn {
  id: string;
  name: string;
  type: 'text' | 'number' | 'rating' | 'price' | 'image' | 'link' | 'boolean';
  width?: number;
  sortable?: boolean;
  required?: boolean;
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

interface ComparisonTableBuilderProps {
  config?: ComparisonTableConfig;
  onChange?: (config: ComparisonTableConfig) => void;
  onSave?: (config: ComparisonTableConfig) => void;
  className?: string;
}

const defaultConfig: ComparisonTableConfig = {
  name: 'Product Comparison',
  description: '',
  columns: [
    { id: 'product', name: 'Product', type: 'text', required: true, productField: 'title' },
    { id: 'price', name: 'Price', type: 'price', sortable: true, productField: 'price' },
    { id: 'rating', name: 'Rating', type: 'rating', sortable: true, productField: 'rating' },
  ],
  rows: [],
  styling: {
    headerBg: '#f8f9fa',
    alternateRows: true,
    borderStyle: 'light',
    compact: false,
  },
  settings: {
    showHeader: true,
    showImages: true,
    maxRows: 10,
    sortable: true,
  },
};

export function ComparisonTableBuilder({
  config,
  onChange,
  onSave,
  className,
}: ComparisonTableBuilderProps) {
  const [currentConfig, setCurrentConfig] = useState<ComparisonTableConfig>(config || defaultConfig);
  const [activeTab, setActiveTab] = useState<'columns' | 'products' | 'styling' | 'preview'>('columns');
  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);

  // Fetch available products
  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ['/api/products'],
  });

  useEffect(() => {
    if (config) {
      setCurrentConfig(config);
    }
  }, [config]);

  useEffect(() => {
    onChange?.(currentConfig);
  }, [currentConfig, onChange]);

  const updateConfig = (updates: Partial<ComparisonTableConfig>) => {
    setCurrentConfig(prev => ({ ...prev, ...updates }));
  };

  const addColumn = () => {
    const newColumn: TableColumn = {
      id: `col_${Date.now()}`,
      name: 'New Column',
      type: 'text',
      sortable: true,
    };
    updateConfig({
      columns: [...currentConfig.columns, newColumn],
    });
  };

  const updateColumn = (columnId: string, updates: Partial<TableColumn>) => {
    updateConfig({
      columns: currentConfig.columns.map(col =>
        col.id === columnId ? { ...col, ...updates } : col
      ),
    });
  };

  const removeColumn = (columnId: string) => {
    updateConfig({
      columns: currentConfig.columns.filter(col => col.id !== columnId),
    });
  };

  const addProductRow = (productId: number) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const newRow: TableRow = {
      id: `row_${Date.now()}`,
      productId,
      customData: {},
    };

    updateConfig({
      rows: [...currentConfig.rows, newRow],
    });
    setSelectedProducts([...selectedProducts, productId]);
  };

  const removeRow = (rowId: string) => {
    const row = currentConfig.rows.find(r => r.id === rowId);
    updateConfig({
      rows: currentConfig.rows.filter(r => r.id !== rowId),
    });
    if (row?.productId) {
      setSelectedProducts(selectedProducts.filter(id => id !== row.productId));
    }
  };

  const updateRowData = (rowId: string, columnId: string, value: any) => {
    updateConfig({
      rows: currentConfig.rows.map(row =>
        row.id === rowId
          ? { ...row, customData: { ...row.customData, [columnId]: value } }
          : row
      ),
    });
  };

  const onDragEnd = (result: any) => {
    if (!result.destination) return;

    const items = Array.from(currentConfig.columns);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    updateConfig({ columns: items });
  };

  const renderCellValue = (row: TableRow, column: TableColumn) => {
    const product = row.productId ? products.find(p => p.id === row.productId) : null;
    
    // Get value from product data or custom data
    const value = column.productField && product 
      ? product[column.productField]
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
        return value ? <img src={value} alt="" className="w-12 h-12 object-cover rounded" /> : null;
      case 'link':
        return (
          <a href={value} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
            <ExternalLink className="w-4 h-4" />
          </a>
        );
      case 'boolean':
        return value ? '✓' : '✗';
      default:
        return String(value);
    }
  };

  const renderEditableCell = (row: TableRow, column: TableColumn) => {
    const value = row.customData[column.id] || '';

    switch (column.type) {
      case 'text':
        return (
          <Input
            value={value}
            onChange={(e) => updateRowData(row.id, column.id, e.target.value)}
            className="h-8"
          />
        );
      case 'number':
      case 'price':
        return (
          <Input
            type="number"
            value={value}
            onChange={(e) => updateRowData(row.id, column.id, Number(e.target.value))}
            className="h-8"
          />
        );
      case 'rating':
        return (
          <Input
            type="number"
            min="0"
            max="5"
            step="0.1"
            value={value}
            onChange={(e) => updateRowData(row.id, column.id, Number(e.target.value))}
            className="h-8"
          />
        );
      case 'boolean':
        return (
          <Switch
            checked={Boolean(value)}
            onCheckedChange={(checked) => updateRowData(row.id, column.id, checked)}
          />
        );
      default:
        return (
          <Input
            value={value}
            onChange={(e) => updateRowData(row.id, column.id, e.target.value)}
            className="h-8"
          />
        );
    }
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Comparison Table Builder</h2>
          <p className="text-muted-foreground">Create and customize product comparison tables</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setActiveTab('preview')}>
            <Eye className="w-4 h-4 mr-2" />
            Preview
          </Button>
          <Button onClick={() => onSave?.(currentConfig)}>
            Save Table
          </Button>
        </div>
      </div>

      {/* Basic Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Table Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="table-name">Table Name</Label>
              <Input
                id="table-name"
                value={currentConfig.name}
                onChange={(e) => updateConfig({ name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="max-rows">Max Rows</Label>
              <Input
                id="max-rows"
                type="number"
                value={currentConfig.settings.maxRows}
                onChange={(e) => updateConfig({
                  settings: { ...currentConfig.settings, maxRows: Number(e.target.value) }
                })}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={currentConfig.description}
              onChange={(e) => updateConfig({ description: e.target.value })}
              placeholder="Optional description for this comparison table"
            />
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="border-b">
        <div className="flex space-x-8">
          {['columns', 'products', 'styling', 'preview'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={cn(
                'py-2 px-1 border-b-2 font-medium text-sm capitalize',
                activeTab === tab
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === 'columns' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Table Columns</h3>
              <Button onClick={addColumn}>
                <Plus className="w-4 h-4 mr-2" />
                Add Column
              </Button>
            </div>

            <DragDropContext onDragEnd={onDragEnd}>
              <Droppable droppableId="columns">
                {(provided) => (
                  <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                    {currentConfig.columns.map((column, index) => (
                      <Draggable key={column.id} draggableId={column.id} index={index}>
                        {(provided) => (
                          <Card
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className="p-4"
                          >
                            <div className="flex items-center gap-4">
                              <div {...provided.dragHandleProps}>
                                <GripVertical className="w-4 h-4 text-muted-foreground" />
                              </div>
                              
                              <div className="flex-1 grid grid-cols-4 gap-4">
                                <div>
                                  <Label>Column Name</Label>
                                  <Input
                                    value={column.name}
                                    onChange={(e) => updateColumn(column.id, { name: e.target.value })}
                                  />
                                </div>
                                
                                <div>
                                  <Label>Data Type</Label>
                                  <Select
                                    value={column.type}
                                    onValueChange={(value) => updateColumn(column.id, { type: value as any })}
                                  >
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="text">Text</SelectItem>
                                      <SelectItem value="number">Number</SelectItem>
                                      <SelectItem value="price">Price</SelectItem>
                                      <SelectItem value="rating">Rating</SelectItem>
                                      <SelectItem value="image">Image</SelectItem>
                                      <SelectItem value="link">Link</SelectItem>
                                      <SelectItem value="boolean">Yes/No</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>

                                <div>
                                  <Label>Product Field</Label>
                                  <Select
                                    value={column.productField || ''}
                                    onValueChange={(value) => updateColumn(column.id, { productField: value || undefined })}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Custom" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="">Custom Field</SelectItem>
                                      <SelectItem value="title">Product Title</SelectItem>
                                      <SelectItem value="price">Price</SelectItem>
                                      <SelectItem value="rating">Rating</SelectItem>
                                      <SelectItem value="brand">Brand</SelectItem>
                                      <SelectItem value="imageUrl">Image</SelectItem>
                                      <SelectItem value="affiliateUrl">Affiliate Link</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>

                                <div className="flex items-center gap-2">
                                  <Switch
                                    checked={column.sortable}
                                    onCheckedChange={(checked) => updateColumn(column.id, { sortable: checked })}
                                  />
                                  <Label>Sortable</Label>
                                </div>
                              </div>

                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeColumn(column.id)}
                                className="text-red-500 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </Card>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </div>
        )}

        {activeTab === 'products' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Add Products to Compare</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Available Products */}
              <Card>
                <CardHeader>
                  <CardTitle>Available Products</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {products
                      .filter(product => !selectedProducts.includes(product.id))
                      .map(product => (
                        <div
                          key={product.id}
                          className="flex items-center justify-between p-2 border rounded hover:bg-gray-50"
                        >
                          <div className="flex items-center gap-2">
                            {product.imageUrl && (
                              <img src={product.imageUrl} alt="" className="w-8 h-8 object-cover rounded" />
                            )}
                            <div>
                              <div className="font-medium text-sm">{product.title}</div>
                              <div className="text-xs text-muted-foreground">${product.price}</div>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => addProductRow(product.id)}
                          >
                            Add
                          </Button>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>

              {/* Selected Products */}
              <Card>
                <CardHeader>
                  <CardTitle>Selected Products ({currentConfig.rows.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {currentConfig.rows.map(row => {
                      const product = row.productId ? products.find(p => p.id === row.productId) : null;
                      return (
                        <div
                          key={row.id}
                          className="flex items-center justify-between p-2 border rounded"
                        >
                          <div className="flex items-center gap-2">
                            {product?.imageUrl && (
                              <img src={product.imageUrl} alt="" className="w-8 h-8 object-cover rounded" />
                            )}
                            <div>
                              <div className="font-medium text-sm">{product?.title || 'Custom Row'}</div>
                              {product && <div className="text-xs text-muted-foreground">${product.price}</div>}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeRow(row.id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'styling' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Table Styling</h3>
            
            <div className="grid grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Appearance</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Header Background Color</Label>
                    <Input
                      type="color"
                      value={currentConfig.styling.headerBg}
                      onChange={(e) => updateConfig({
                        styling: { ...currentConfig.styling, headerBg: e.target.value }
                      })}
                    />
                  </div>
                  
                  <div>
                    <Label>Border Style</Label>
                    <Select
                      value={currentConfig.styling.borderStyle}
                      onValueChange={(value) => updateConfig({
                        styling: { ...currentConfig.styling, borderStyle: value as any }
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No Border</SelectItem>
                        <SelectItem value="light">Light Border</SelectItem>
                        <SelectItem value="medium">Medium Border</SelectItem>
                        <SelectItem value="heavy">Heavy Border</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Layout Options</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Alternate Row Colors</Label>
                    <Switch
                      checked={currentConfig.styling.alternateRows}
                      onCheckedChange={(checked) => updateConfig({
                        styling: { ...currentConfig.styling, alternateRows: checked }
                      })}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label>Compact View</Label>
                    <Switch
                      checked={currentConfig.styling.compact}
                      onCheckedChange={(checked) => updateConfig({
                        styling: { ...currentConfig.styling, compact: checked }
                      })}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label>Show Header</Label>
                    <Switch
                      checked={currentConfig.settings.showHeader}
                      onCheckedChange={(checked) => updateConfig({
                        settings: { ...currentConfig.settings, showHeader: checked }
                      })}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'preview' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Table Preview</h3>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setActiveTab('products')}>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Data
                </Button>
                <Button variant="outline" size="sm" onClick={() => setActiveTab('styling')}>
                  <Settings className="w-4 h-4 mr-2" />
                  Style
                </Button>
              </div>
            </div>

            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className={cn(
                    'w-full',
                    currentConfig.styling.borderStyle !== 'none' && 'border-collapse',
                    {
                      'border border-gray-300': currentConfig.styling.borderStyle === 'light',
                      'border-2 border-gray-400': currentConfig.styling.borderStyle === 'medium',
                      'border-4 border-gray-600': currentConfig.styling.borderStyle === 'heavy',
                    }
                  )}>
                    {currentConfig.settings.showHeader && (
                      <thead>
                        <tr style={{ backgroundColor: currentConfig.styling.headerBg }}>
                          {currentConfig.columns.map(column => (
                            <th
                              key={column.id}
                              className={cn(
                                'text-left font-semibold',
                                currentConfig.styling.compact ? 'p-2' : 'p-4',
                                currentConfig.styling.borderStyle !== 'none' && 'border border-gray-300'
                              )}
                            >
                              {column.name}
                            </th>
                          ))}
                          <th className="w-16"></th>
                        </tr>
                      </thead>
                    )}
                    <tbody>
                      {currentConfig.rows.map((row, rowIndex) => (
                        <tr
                          key={row.id}
                          className={cn(
                            currentConfig.styling.alternateRows && rowIndex % 2 === 1 && 'bg-gray-50'
                          )}
                        >
                          {currentConfig.columns.map(column => (
                            <td
                              key={column.id}
                              className={cn(
                                currentConfig.styling.compact ? 'p-2' : 'p-4',
                                currentConfig.styling.borderStyle !== 'none' && 'border border-gray-300'
                              )}
                            >
                              {column.productField ? (
                                renderCellValue(row, column)
                              ) : (
                                renderEditableCell(row, column)
                              )}
                            </td>
                          ))}
                          <td className={cn(
                            'text-center',
                            currentConfig.styling.compact ? 'p-2' : 'p-4',
                            currentConfig.styling.borderStyle !== 'none' && 'border border-gray-300'
                          )}>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeRow(row.id)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}