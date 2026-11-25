import React, { useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  FolderOpen,
  Info,
  Loader2,
  RefreshCw,
} from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  leftIcon,
  rightIcon,
  children,
  className = '',
  disabled,
  type = 'button',
  ...props
}) => {
  const base =
    'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed';

  const variants: Record<string, string> = {
    primary: 'bg-blue-700 text-white hover:bg-blue-800 active:bg-blue-900 border border-transparent',
    secondary: 'bg-slate-900 text-white hover:bg-slate-800 active:bg-slate-950 border border-transparent',
    outline: 'bg-white text-slate-700 hover:bg-slate-50 active:bg-slate-100 border border-slate-300',
    ghost: 'bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-transparent',
    danger: 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800 border border-transparent',
  };

  const sizes: Record<string, string> = {
    xs: 'px-2.5 py-1 text-xs min-h-[28px]',
    sm: 'px-3 py-1.5 text-xs min-h-[34px]',
    md: 'px-4 py-2 text-sm min-h-[40px]',
    lg: 'px-5 py-2.5 text-sm min-h-[44px]',
  };

  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin shrink-0" /> : leftIcon}
      {children}
      {!loading && rightIcon}
    </button>
  );
};

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'outline' | 'ghost' | 'primary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  label: string;
}

export const IconButton: React.FC<IconButtonProps> = ({
  variant = 'ghost',
  size = 'md',
  label,
  children,
  className = '',
  type = 'button',
  ...props
}) => {
  const variants: Record<string, string> = {
    ghost: 'bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-transparent',
    outline: 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-300',
    primary: 'bg-blue-700 text-white hover:bg-blue-800 border border-transparent',
    danger: 'bg-white text-red-600 hover:bg-red-50 border border-red-200',
  };
  const sizes: Record<string, string> = {
    sm: 'w-8 h-8',
    md: 'w-9 h-9',
    lg: 'w-10 h-10',
  };
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={`inline-flex items-center justify-center rounded-lg transition-colors duration-150 shrink-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export type BadgeTone = 'neutral' | 'blue' | 'indigo' | 'success' | 'warning' | 'danger';

export interface BadgeProps {
  children: React.ReactNode;
  tone?: BadgeTone;
  icon?: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  tone = 'neutral',
  icon,
  className = '',
}) => {
  const tones: Record<BadgeTone, string> = {
    neutral: 'bg-slate-100 text-slate-700 border-slate-200',
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-800 border-amber-200',
    danger: 'bg-red-50 text-red-700 border-red-200',
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium rounded-md border whitespace-nowrap shrink-0 ${tones[tone]} ${className}`}
    >
      {icon}
      {children}
    </span>
  );
};

export interface AvatarProps {
  src?: string;
  name: string;
  initials?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  name,
  initials,
  size = 'md',
  className = '',
}) => {
  const [imgError, setImgError] = useState(false);
  const sizes: Record<string, string> = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-7 h-7 text-xs',
    md: 'w-9 h-9 text-xs',
    lg: 'w-11 h-11 text-sm',
    xl: 'w-14 h-14 text-base',
  };
  const fallback =
    initials ||
    name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0])
      .join('')
      .toUpperCase();

  if (src && !imgError) {
    return (
      <img
        src={src}
        alt={name}
        referrerPolicy="no-referrer"
        onError={() => setImgError(true)}
        className={`${sizes[size]} rounded-full object-cover border border-slate-200 shrink-0 bg-slate-100 ${className}`}
      />
    );
  }
  return (
    <span
      title={name}
      className={`${sizes[size]} rounded-full inline-flex items-center justify-center font-semibold bg-slate-100 text-slate-700 border border-slate-200 shrink-0 ${className}`}
    >
      {fallback}
    </span>
  );
};

export const AvatarGroup: React.FC<{
  users: { name: string; src?: string; initials?: string }[];
  max?: number;
}> = ({ users, max = 3 }) => {
  const shown = users.slice(0, max);
  const extra = users.length - max;
  return (
    <div className="flex items-center -space-x-2">
      {shown.map((u, idx) => (
        <Avatar
          key={idx}
          src={u.src}
          name={u.name}
          initials={u.initials}
          size="sm"
          className="ring-2 ring-white"
        />
      ))}
      {extra > 0 && (
        <span className="w-7 h-7 rounded-full inline-flex items-center justify-center text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200 ring-2 ring-white tabular-nums">
          +{extra}
        </span>
      )}
    </div>
  );
};

export interface CardProps {
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  noPadding?: boolean;
}

export const Card: React.FC<CardProps> = ({
  title,
  subtitle,
  actions,
  children,
  footer,
  className = '',
  noPadding = false,
}) => {
  return (
    <div className={`bg-white border border-slate-200 rounded-xl ${className}`}>
      {(title || actions) && (
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-slate-100">
          <div className="min-w-0">
            {title && <h3 className="text-sm font-semibold text-slate-900 truncate">{title}</h3>}
            {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
          </div>
          {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
        </div>
      )}
      <div className={noPadding ? '' : 'p-5'}>{children}</div>
      {footer && (
        <div className="px-5 py-3 bg-slate-50/70 border-t border-slate-100 rounded-b-xl">
          {footer}
        </div>
      )}
    </div>
  );
};

export interface AlertProps {
  tone?: 'info' | 'success' | 'warning' | 'error';
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export const Alert: React.FC<AlertProps> = ({
  tone = 'info',
  title,
  description,
  action,
  className = '',
}) => {
  const styles = {
    info: {
      wrap: 'bg-blue-50/70 border-blue-200 text-blue-900',
      icon: <Info className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />,
    },
    success: {
      wrap: 'bg-emerald-50/70 border-emerald-200 text-emerald-900',
      icon: <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />,
    },
    warning: {
      wrap: 'bg-amber-50/70 border-amber-200 text-amber-900',
      icon: <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />,
    },
    error: {
      wrap: 'bg-red-50/70 border-red-200 text-red-900',
      icon: <AlertCircle className="w-4 h-4 text-red-700 shrink-0 mt-0.5" />,
    },
  }[tone];

  return (
    <div className={`flex items-start justify-between gap-3 p-4 rounded-xl border ${styles.wrap} ${className}`}>
      <div className="flex items-start gap-3">
        {styles.icon}
        <div className="text-sm">
          <p className="font-semibold">{title}</p>
          {description && <p className="text-xs opacity-90 mt-0.5 leading-relaxed">{description}</p>}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
};

export const EmptyState: React.FC<{
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}> = ({ title, description, actionLabel, onAction, icon }) => (
  <div className="flex flex-col items-center justify-center text-center py-12 px-6 bg-white border border-slate-200 rounded-xl">
    <div className="w-11 h-11 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 mb-3">
      {icon || <FolderOpen className="w-5 h-5" />}
    </div>
    <h4 className="text-sm font-semibold text-slate-900">{title}</h4>
    <p className="text-xs text-slate-500 max-w-sm mt-1 leading-relaxed">{description}</p>
    {actionLabel && onAction && (
      <div className="mt-4">
        <Button size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      </div>
    )}
  </div>
);

export const LoadingState: React.FC<{ rows?: number; label?: string }> = ({
  rows = 4,
  label = 'Cargando registros...',
}) => (
  <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3" aria-busy="true">
    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
      <div className="h-4 w-40 bg-slate-200 rounded animate-pulse" />
      <span className="text-xs text-slate-400">{label}</span>
    </div>
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="grid grid-cols-12 gap-3 items-center py-1.5">
        <div className="col-span-4 h-3.5 bg-slate-100 rounded animate-pulse" />
        <div className="col-span-3 h-3.5 bg-slate-100 rounded animate-pulse" />
        <div className="col-span-3 h-3.5 bg-slate-100 rounded animate-pulse" />
        <div className="col-span-2 h-3.5 bg-slate-100 rounded animate-pulse" />
      </div>
    ))}
  </div>
);

export const ErrorState: React.FC<{
  title?: string;
  description?: string;
  onRetry?: () => void;
}> = ({
  title = 'No fue posible cargar la información',
  description = 'Ocurrió un problema temporal al consultar los datos. Intenta actualizar la vista.',
  onRetry,
}) => (
  <div className="flex flex-col items-center justify-center text-center py-10 px-6 bg-white border border-red-200 rounded-xl">
    <div className="w-11 h-11 rounded-lg bg-red-50 border border-red-200 flex items-center justify-center text-red-600 mb-3">
      <AlertCircle className="w-5 h-5" />
    </div>
    <h4 className="text-sm font-semibold text-slate-900">{title}</h4>
    <p className="text-xs text-slate-500 max-w-sm mt-1 leading-relaxed">{description}</p>
    {onRetry && (
      <div className="mt-4">
        <Button size="sm" variant="outline" leftIcon={<RefreshCw className="w-3.5 h-3.5" />} onClick={onRetry}>
          Reintentar
        </Button>
      </div>
    )}
  </div>
);

export const Breadcrumb: React.FC<{
  items: { label: string; onClick?: () => void }[];
}> = ({ items }) => (
  <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-slate-500 overflow-hidden">
    {items.map((item, idx) => {
      const isLast = idx === items.length - 1;
      return (
        <React.Fragment key={idx}>
          {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
          {item.onClick && !isLast ? (
            <button
              type="button"
              onClick={item.onClick}
              className="hover:text-slate-900 transition-colors truncate cursor-pointer"
            >
              {item.label}
            </button>
          ) : (
            <span className={`truncate ${isLast ? 'font-medium text-slate-800' : ''}`}>
              {item.label}
            </span>
          )}
        </React.Fragment>
      );
    })}
  </nav>
);

export const Tooltip: React.FC<{
  content: string;
  children: React.ReactNode;
}> = ({ content, children }) => {
  return (
    <div className="relative group inline-flex">
      {children}
      <div
        role="tooltip"
        className="pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2.5 py-1 text-[11px] font-medium text-white bg-slate-900 rounded-md whitespace-nowrap z-50"
      >
        {content}
      </div>
    </div>
  );
};
