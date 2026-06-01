export const formatNumber = (num: number | undefined | null): string => {
  if (num === undefined || num === null) return '0.00';
  const value = Number(num);
  if (isNaN(value)) return '0.00';
  return value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

export const formatCurrency = (amount: number | undefined | null): string => {
  return `₱${formatNumber(amount)}`;
};

export const formatTime = (dateString: string): string => {
  if (!dateString) return 'Unknown';
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  if (isNaN(diff)) return 'Unknown';
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return date.toLocaleDateString();
};

export const getStatusColor = (quantity: number, minStock: number, maxStock: number): string => {
  if (quantity === 0) return '#ef4444';
  if (quantity <= minStock) return '#f97316';
  if (quantity <= maxStock * 0.5) return '#f59e0b';
  return '#10b981';
};

export const getStatusText = (quantity: number, minStock: number, maxStock: number): string => {
  if (quantity === 0) return 'Out of Stock';
  if (quantity <= minStock) return 'Low Stock';
  if (quantity <= maxStock * 0.5) return 'Medium';
  return 'In Stock';
};

export const getStockPercentage = (quantity: number, maxStock: number): number => {
  if (maxStock <= 0) return 0;
  return Math.min((quantity / maxStock) * 100, 100);
};

// ADD THIS FUNCTION
export const getCategoryName = (category: string | { id: number; name: string } | undefined | null): string => {
  if (!category) return 'Uncategorized';
  if (typeof category === 'string') return category;
  if (typeof category === 'object' && category.name) return category.name;
  return 'Uncategorized';
};