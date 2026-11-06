import React from 'react';
import {
  Utensils,
  Car,
  Home,
  Zap,
  ShoppingBag,
  Film,
  Sparkles,
  BookOpen,
  Coffee,
  DollarSign,
  ArrowRightLeft,
  Users
} from 'lucide-react';

export const CATEGORIES = [
  { id: 'Food', label: 'Food & Dining', icon: Utensils, color: 'text-amber-500 bg-amber-50 border-amber-200' },
  { id: 'Travel', label: 'Travel & Trips', icon: Car, color: 'text-blue-500 bg-blue-50 border-blue-200' },
  { id: 'Rent', label: 'Rent & Hostel', icon: Home, color: 'text-indigo-500 bg-indigo-50 border-indigo-200' },
  { id: 'Utilities', label: 'Bills & Utilities', icon: Zap, color: 'text-yellow-600 bg-yellow-50 border-yellow-200' },
  { id: 'Groceries', label: 'Groceries', icon: ShoppingBag, color: 'text-emerald-500 bg-emerald-50 border-emerald-200' },
  { id: 'Entertainment', label: 'Entertainment & Outings', icon: Film, color: 'text-rose-500 bg-rose-50 border-rose-200' },
  { id: 'Celebration', label: 'Celebration & Gifts', icon: Sparkles, color: 'text-purple-500 bg-purple-50 border-purple-200' },
  { id: 'Academic', label: 'Books & Academics', icon: BookOpen, color: 'text-cyan-500 bg-cyan-50 border-cyan-200' },
  { id: 'General', label: 'General / Other', icon: Coffee, color: 'text-slate-500 bg-slate-50 border-slate-200' },
];

export function getCategoryMeta(categoryId) {
  const found = CATEGORIES.find((c) => c.id.toLowerCase() === (categoryId || '').toLowerCase());
  return found || { id: 'General', label: categoryId || 'General', icon: Coffee, color: 'text-purple-500 bg-purple-50 border-purple-200' };
}

export function CategoryBadge({ categoryId, showLabel = true, size = 'sm' }) {
  const meta = getCategoryMeta(categoryId);
  const Icon = meta.icon;

  const iconSizes = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  const badgePadding = {
    xs: 'px-1.5 py-0.5 text-xs',
    sm: 'px-2.5 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base',
  };

  return (
    <span className={`inline-flex items-center gap-1.5 font-medium rounded-lg border ${meta.color} ${badgePadding[size]}`}>
      <Icon className={`${iconSizes[size]} shrink-0`} />
      {showLabel && <span>{meta.label}</span>}
    </span>
  );
}
