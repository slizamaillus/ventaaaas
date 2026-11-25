import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Filter,
  MoreHorizontal,
  Plus,
  Trash2,
  TrendingDown,
  TrendingUp,
  X,
} from 'lucide-react';
import { Avatar, Badge, BadgeTone, Button, IconButton } from './primitives';
import { PriorityLevel } from '../../types/crm';

export interface TabItem {
  id: string;
  label: string;
  count?: number;
  icon?: React.ReactNode;
}

export const Tabs: React.FC<{
  tabs: TabItem[];
  activeTab: string;
  onChange: (id: string) => void;
  variant?: 'underline' | 'segmented';
  className?: string;
}> = ({ tabs, activeTab, onChange, variant = 'underline', className = '' }) => {
  if (variant === 'segmented') {
    return (
      <div className={`inline-flex items-center gap-1 p-1 bg-slate-100 border border-slate-200 rounded-lg overflow-x-auto max-w-full ${className}`}>
        {tabs.map((tab) => {
          const active = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                active
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {typeof tab.count === 'number' && (
                <span className="text-[11px] font-mono tabular-nums text-slate-500">
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-5 border-b border-slate-200 overflow-x-auto ${className}`}>
      {tabs.map((tab) => {
        const active = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`inline-flex items-center gap-2 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer -mb-px ${
              active
                ? 'border-blue-700 text-blue-700'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
            {typeof tab.count === 'number' && (
              <span className="text-xs font-mono tabular-nums text-slate-400">
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

export interface ColumnDef<T> {
  key: string;
  header: string;
  align?: 'left' | 'right';
  sortable?: boolean;
  width?: string;
  render: (row: T) => React.ReactNode;
}

export interface TableProps<T extends { id: string }> {
  data: T[];
  columns: ColumnDef<T>[];
  selectedIds?: string[];
  onToggleSelect?: (id: string) => void;
  onToggleSelectAll?: (allIds: string[]) => void;
  sortKey?: string;
  sortDir?: 'asc' | 'desc';
  onSort?: (key: string) => void;
  onRowClick?: (row: T) => void;
  rowActions?: (row: T) => DropdownAction[];
  emptyMessage?: string;
}

export function Table<T extends { id: string }>({
  data,
  columns,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  sortKey,
  sortDir,
  onSort,
  onRowClick,
  rowActions,
  emptyMessage = 'No se encontraron registros con los criterios actuales.',
}: TableProps<T>) {
  const selectable = Boolean(selectedIds && onToggleSelect && onToggleSelectAll);
  const allSelected = selectable && data.length > 0 && data.every((r) => selectedIds!.includes(r.id));

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200">
              {selectable && (
                <th className="w-10 px-4 py-2.5">
                  <input
                    type="checkbox"
                    aria-label="Seleccionar todos"
                    checked={allSelected}
                    onChange={() => onToggleSelectAll!(allSelected ? [] : data.map((d) => d.id))}
                    className="w-4 h-4 rounded border-slate-300 text-blue-700 cursor-pointer"
                  />
                </th>
              )}
              {columns.map((col) => (
                <th
                  key={col.key}
                  style={col.width ? { width: col.width } : undefined}
                  className={`px-4 py-2.5 text-xs font-semibold text-slate-600 whitespace-nowrap ${
                    col.align === 'right' ? 'text-right' : 'text-left'
                  }`}
                >
                  {col.sortable && onSort ? (
                    <button
                      type="button"
                      onClick={() => onSort(col.key)}
                      className={`inline-flex items-center gap-1 hover:text-slate-900 cursor-pointer ${
                        col.align === 'right' ? 'flex-row-reverse' : ''
                      }`}
                    >
                      <span>{col.header}</span>
                      {sortKey === col.key ? (
                        sortDir === 'asc' ? (
                          <ArrowUp className="w-3 h-3 text-blue-700" />
                        ) : (
                          <ArrowDown className="w-3 h-3 text-blue-700" />
                        )
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      )}
                    </button>
                  ) : (
                    col.header
                  )}
                </th>
              ))}
              {rowActions && <th className="w-12 px-3 py-2.5 text-right text-xs font-semibold text-slate-600" />}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (selectable ? 1 : 0) + (rowActions ? 1 : 0)}
                  className="px-4 py-10 text-center text-sm text-slate-500"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row) => {
                const isSelected = selectable && selectedIds!.includes(row.id);
                return (
                  <tr
                    key={row.id}
                    onClick={() => onRowClick?.(row)}
                    className={`transition-colors ${
                      onRowClick ? 'cursor-pointer' : ''
                    } ${isSelected ? 'bg-blue-50/60' : 'hover:bg-slate-50/80'}`}
                  >
                    {selectable && (
                      <td
                        className="px-4 py-2.5"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          aria-label="Seleccionar fila"
                          checked={isSelected}
                          onChange={() => onToggleSelect!(row.id)}
                          className="w-4 h-4 rounded border-slate-300 text-blue-700 cursor-pointer"
                        />
                      </td>
                    )}
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className={`px-4 py-2.5 text-sm text-slate-700 ${
                          col.align === 'right' ? 'text-right tabular-nums' : 'text-left'
                        }`}
                      >
                        {col.render(row)}
                      </td>
                    ))}
                    {rowActions && (
                      <td
                        className="px-3 py-2.5 text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <DropdownMenu items={rowActions(row)} align="right" />
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export const Pagination: React.FC<{
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (next: number) => void;
}> = ({ page, pageSize, total, onPageChange }) => {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(total, page * pageSize);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 py-2 text-xs text-slate-600">
      <span className="tabular-nums">
        Mostrando <strong className="text-slate-900">{start}</strong>–
        <strong className="text-slate-900">{end}</strong> de{' '}
        <strong className="text-slate-900">{total}</strong> registros
      </span>
      <div className="flex items-center gap-1.5">
        <Button
          size="xs"
          variant="outline"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          leftIcon={<ChevronLeft className="w-3.5 h-3.5" />}
        >
          Anterior
        </Button>
        <span className="px-2 font-mono tabular-nums text-slate-700">
          {page} / {totalPages}
        </span>
        <Button
          size="xs"
          variant="outline"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
        >
          Siguiente
        </Button>
      </div>
    </div>
  );
};

export interface DropdownAction {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
  dividerBefore?: boolean;
}

export const DropdownMenu: React.FC<{
  items: DropdownAction[];
  trigger?: React.ReactNode;
  align?: 'left' | 'right';
}> = ({ items, trigger, align = 'right' }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="relative inline-block" ref={ref}>
      {trigger ? (
        <div onClick={() => setOpen((o) => !o)} className="cursor-pointer">
          {trigger}
        </div>
      ) : (
        <IconButton label="Opciones" size="sm" onClick={() => setOpen((o) => !o)}>
          <MoreHorizontal className="w-4 h-4" />
        </IconButton>
      )}
      {open && (
        <div
          className={`absolute z-50 mt-1 w-48 bg-white border border-slate-200 rounded-xl shadow-lg py-1 ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
        >
          {items.map((item, idx) => (
            <React.Fragment key={idx}>
              {item.dividerBefore && <div className="my-1 border-t border-slate-100" />}
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  item.onClick();
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-left transition-colors cursor-pointer ${
                  item.danger
                    ? 'text-red-600 hover:bg-red-50'
                    : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                {item.icon}
                <span className="truncate">{item.label}</span>
              </button>
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
};

export const ContextMenu: React.FC<{
  items: DropdownAction[];
  children: React.ReactNode;
}> = ({ items, children }) => {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = () => setPos(null);
    window.addEventListener('click', close);
    return () => window.removeEventListener('click', close);
  }, []);

  return (
    <div
      ref={ref}
      onContextMenu={(e) => {
        e.preventDefault();
        setPos({ x: e.clientX, y: e.clientY });
      }}
      className="relative"
    >
      {children}
      {pos && (
        <div
          style={{ top: pos.y, left: pos.x }}
          className="fixed z-50 w-48 bg-white border border-slate-200 rounded-xl shadow-xl py-1"
        >
          {items.map((item, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setPos(null);
                item.onClick();
              }}
              className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-left cursor-pointer ${
                item.danger ? 'text-red-600 hover:bg-red-50' : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export const Modal: React.FC<{
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  footer?: React.ReactNode;
  children: React.ReactNode;
}> = ({ open, onClose, title, subtitle, size = 'md', footer, children }) => {
  if (!open) return null;
  const maxW = {
    sm: 'max-w-md',
    md: 'max-w-xl',
    lg: 'max-w-3xl',
    xl: 'max-w-5xl',
  }[size];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/45 backdrop-blur-[1px]">
      <div
        role="dialog"
        aria-modal="true"
        className={`w-full ${maxW} bg-white border border-slate-200 rounded-xl shadow-xl flex flex-col max-h-[90vh]`}
      >
        <div className="flex items-start justify-between gap-4 px-5 py-4 border-b border-slate-200">
          <div>
            <h3 className="text-base font-semibold text-slate-900">{title}</h3>
            {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
          </div>
          <IconButton label="Cerrar" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </IconButton>
        </div>
        <div className="p-5 overflow-y-auto space-y-4">{children}</div>
        {footer && (
          <div className="flex flex-wrap items-center justify-end gap-2 px-5 py-3.5 bg-slate-50 border-t border-slate-200 rounded-b-xl">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export const Drawer: React.FC<{
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  width?: 'md' | 'lg' | 'xl';
  footer?: React.ReactNode;
  children: React.ReactNode;
}> = ({ open, onClose, title, subtitle, width = 'lg', footer, children }) => {
  if (!open) return null;
  const wClass = {
    md: 'max-w-md',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  }[width];

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-[1px]">
      <div className="flex-1" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        className={`w-full ${wClass} bg-white border-l border-slate-200 shadow-2xl flex flex-col h-full`}
      >
        <div className="flex items-start justify-between gap-4 px-6 py-4 border-b border-slate-200">
          <div className="min-w-0">
            <h3 className="text-base font-semibold text-slate-900 truncate">{title}</h3>
            {subtitle && <p className="text-xs text-slate-500 mt-0.5 truncate">{subtitle}</p>}
          </div>
          <IconButton label="Cerrar panel" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </IconButton>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-5">{children}</div>
        {footer && (
          <div className="flex flex-wrap items-center justify-end gap-2 px-6 py-3.5 bg-slate-50 border-t border-slate-200">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  tone: 'success' | 'info' | 'warning' | 'error';
}

export const ToastContainer: React.FC<{
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;
  return (
    <div className="fixed bottom-4 right-4 z-[60] flex flex-col gap-2 w-80 max-w-[calc(100vw-2rem)]">
      {toasts.map((t) => {
        const badgeColor = {
          success: 'border-emerald-200 bg-white text-slate-900',
          info: 'border-blue-200 bg-white text-slate-900',
          warning: 'border-amber-200 bg-white text-slate-900',
          error: 'border-red-200 bg-white text-slate-900',
        }[t.tone];
        const dotColor = {
          success: 'text-emerald-600',
          info: 'text-blue-700',
          warning: 'text-amber-600',
          error: 'text-red-600',
        }[t.tone];

        return (
          <div
            key={t.id}
            className={`flex items-start gap-3 p-3.5 rounded-xl border shadow-lg ${badgeColor}`}
          >
            <CheckCircle2 className={`w-4 h-4 mt-0.5 shrink-0 ${dotColor}`} />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold">{t.title}</p>
              {t.description && <p className="text-xs text-slate-500 mt-0.5">{t.description}</p>}
            </div>
            <button
              type="button"
              onClick={() => onDismiss(t.id)}
              aria-label="Cerrar aviso"
              className="text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};

export interface TimelineEntry {
  id: string;
  title: string;
  description?: string;
  date: string;
  actor?: string;
  type?: string;
  tone?: BadgeTone;
}

export const ActivityItem: React.FC<{ item: TimelineEntry }> = ({ item }) => (
  <div className="relative pl-6 pb-5 last:pb-0">
    <span className="absolute left-0 top-1.5 w-2.5 h-2.5 rounded-full bg-white border-2 border-blue-700" />
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-sm font-medium text-slate-900 truncate">{item.title}</span>
        {item.type && <Badge tone={item.tone || 'neutral'}>{item.type}</Badge>}
      </div>
      <span className="text-xs font-mono tabular-nums text-slate-500">{item.date}</span>
    </div>
    {item.description && <p className="text-xs text-slate-600 mt-1 leading-relaxed">{item.description}</p>}
    {item.actor && <p className="text-[11px] text-slate-400 mt-1">Registrado por {item.actor}</p>}
  </div>
);

export const Timeline: React.FC<{ items: TimelineEntry[] }> = ({ items }) => {
  if (items.length === 0) {
    return <p className="text-xs text-slate-500 py-4">Sin eventos registrados aún.</p>;
  }
  return (
    <div className="relative before:content-[''] before:absolute before:left-[4px] before:top-2 before:bottom-2 before:w-px before:bg-slate-200">
      {items.map((item) => (
        <ActivityItem key={item.id} item={item} />
      ))}
    </div>
  );
};

export const KanbanCard: React.FC<{
  title: string;
  companyName: string;
  contactName: string;
  amountFormatted: string;
  ownerName: string;
  ownerAvatar?: string;
  closeDate: string;
  probability: number;
  priority: PriorityLevel;
  lastActivity: string;
  onClick: () => void;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
}> = ({
  title,
  companyName,
  contactName,
  amountFormatted,
  ownerName,
  ownerAvatar,
  closeDate,
  probability,
  priority,
  lastActivity,
  onClick,
  draggable,
  onDragStart,
}) => {
  const priorityTone: Record<PriorityLevel, BadgeTone> = {
    Baja: 'neutral',
    Media: 'blue',
    Alta: 'warning',
    Urgente: 'danger',
  };

  return (
    <div
      draggable={draggable}
      onDragStart={onDragStart}
      onClick={onClick}
      className="bg-white border border-slate-200 hover:border-blue-300 rounded-xl p-3.5 space-y-2.5 cursor-pointer transition-colors"
    >
      <div className="space-y-1">
        <p className="text-xs text-slate-500 truncate">{companyName} · {contactName}</p>
        <h4 className="text-sm font-semibold text-slate-900 leading-snug line-clamp-2">{title}</h4>
      </div>
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-semibold font-mono tabular-nums text-slate-900">
          {amountFormatted}
        </span>
        <span className="text-xs font-mono tabular-nums text-slate-500">{probability}%</span>
      </div>
      <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 text-[11px] text-slate-500">
        <div className="flex items-center gap-1.5 min-w-0">
          <Avatar name={ownerName} src={ownerAvatar} size="xs" />
          <span className="truncate">{ownerName.split(' ')[0]}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="inline-flex items-center gap-1 font-mono tabular-nums">
            <Calendar className="w-3 h-3" />
            {closeDate}
          </span>
          <Badge tone={priorityTone[priority]}>{priority}</Badge>
        </div>
      </div>
      <div className="flex items-center gap-1 text-[11px] text-slate-400">
        <Clock className="w-3 h-3" />
        <span>Últ. act: {lastActivity}</span>
      </div>
    </div>
  );
};

export interface FilterRule {
  id: string;
  field: string;
  operator: string;
  value: string;
}

export const FilterBuilder: React.FC<{
  fields: { value: string; label: string }[];
  rules: FilterRule[];
  onChange: (rules: FilterRule[]) => void;
}> = ({ fields, rules, onChange }) => {
  const addRule = () => {
    onChange([
      ...rules,
      { id: `fr-${Date.now()}`, field: fields[0]?.value || '', operator: 'contiene', value: '' },
    ]);
  };
  const updateRule = (id: string, patch: Partial<FilterRule>) => {
    onChange(rules.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };
  const removeRule = (id: string) => {
    onChange(rules.filter((r) => r.id !== id));
  };

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2.5">
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700">
          <Filter className="w-3.5 h-3.5 text-blue-700" />
          Constructor de filtros avanzados
        </span>
        <Button size="xs" variant="outline" leftIcon={<Plus className="w-3 h-3" />} onClick={addRule}>
          Agregar condición
        </Button>
      </div>
      {rules.length === 0 ? (
        <p className="text-xs text-slate-500">Sin reglas activas. Agrega una condición para refinar el listado.</p>
      ) : (
        <div className="space-y-2">
          {rules.map((rule) => (
            <div key={rule.id} className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
              <select
                value={rule.field}
                onChange={(e) => updateRule(rule.id, { field: e.target.value })}
                className="sm:col-span-4 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800"
              >
                {fields.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>
              <select
                value={rule.operator}
                onChange={(e) => updateRule(rule.id, { operator: e.target.value })}
                className="sm:col-span-3 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800"
              >
                <option value="contiene">Contiene</option>
                <option value="igual">Es igual a</option>
                <option value="diferente">No es igual a</option>
              </select>
              <input
                type="text"
                value={rule.value}
                onChange={(e) => updateRule(rule.id, { value: e.target.value })}
                placeholder="Valor..."
                className="sm:col-span-4 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800"
              />
              <div className="sm:col-span-1 flex justify-end">
                <IconButton label="Quitar filtro" size="sm" onClick={() => removeRule(rule.id)}>
                  <Trash2 className="w-3.5 h-3.5 text-slate-500 hover:text-red-600" />
                </IconButton>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export const MetricCard: React.FC<{
  label: string;
  value: string;
  delta?: string;
  deltaPositive?: boolean;
  subtitle?: string;
  onClick?: () => void;
}> = ({ label, value, delta, deltaPositive = true, subtitle, onClick }) => (
  <div
    onClick={onClick}
    className={`bg-white border border-slate-200 rounded-xl p-4 space-y-2 transition-colors ${
      onClick ? 'cursor-pointer hover:border-blue-300' : ''
    }`}
  >
    <div className="flex items-center justify-between gap-2">
      <span className="text-xs font-medium text-slate-500 truncate">{label}</span>
      {delta && (
        <span
          className={`inline-flex items-center gap-0.5 text-[11px] font-medium tabular-nums shrink-0 ${
            deltaPositive ? 'text-emerald-700' : 'text-red-600'
          }`}
        >
          {deltaPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {delta}
        </span>
      )}
    </div>
    <p className="text-xl font-bold text-slate-900 font-mono tabular-nums tracking-tight truncate">
      {value}
    </p>
    {subtitle && <p className="text-[11px] text-slate-500 truncate">{subtitle}</p>}
  </div>
);

export const ChartContainer: React.FC<{
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}> = ({ title, subtitle, actions, children, className = '' }) => (
  <div className={`bg-white border border-slate-200 rounded-xl p-5 flex flex-col ${className}`}>
    <div className="flex flex-wrap items-start justify-between gap-2 mb-4">
      <div className="min-w-0">
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
        {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
      {actions && <div className="shrink-0">{actions}</div>}
    </div>
    <div className="flex-1 min-h-0">{children}</div>
  </div>
);
