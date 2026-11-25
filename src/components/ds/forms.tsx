import React, { useState } from 'react';
import { Calendar, Check, ChevronDown, Search, UploadCloud, X } from 'lucide-react';
import { formatRUT, isValidRUTFormat } from '../../data/chileGeo';
import { CurrencyCode } from '../../types/crm';

export interface FieldWrapperProps {
  label?: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}

export const FieldWrapper: React.FC<FieldWrapperProps> = ({
  label,
  required,
  error,
  hint,
  children,
  className = '',
}) => (
  <div className={`space-y-1.5 ${className}`}>
    {label && (
      <label className="block text-xs font-medium text-slate-700">
        {label}
        {required && <span className="text-red-600 ml-0.5">*</span>}
      </label>
    )}
    {children}
    {error ? (
      <p className="text-xs text-red-600">{error}</p>
    ) : hint ? (
      <p className="text-xs text-slate-500">{hint}</p>
    ) : null}
  </div>
);

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  required?: boolean;
  error?: string;
  hint?: string;
  leftAddon?: React.ReactNode;
  rightAddon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
  label,
  required,
  error,
  hint,
  leftAddon,
  rightAddon,
  className = '',
  ...props
}) => (
  <FieldWrapper label={label} required={required} error={error} hint={hint}>
    <div
      className={`flex items-center bg-white border rounded-lg transition-colors min-h-[38px] ${
        error
          ? 'border-red-400 focus-within:border-red-600'
          : 'border-slate-300 focus-within:border-blue-700'
      } ${props.disabled ? 'bg-slate-50 opacity-70' : ''}`}
    >
      {leftAddon && <span className="pl-3 text-slate-400 shrink-0">{leftAddon}</span>}
      <input
        className={`w-full bg-transparent px-3 py-1.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none ${className}`}
        {...props}
      />
      {rightAddon && <span className="pr-3 text-slate-400 shrink-0 text-xs">{rightAddon}</span>}
    </div>
  </FieldWrapper>
);

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  required?: boolean;
  error?: string;
  hint?: string;
}

export const Textarea: React.FC<TextareaProps> = ({
  label,
  required,
  error,
  hint,
  className = '',
  ...props
}) => (
  <FieldWrapper label={label} required={required} error={error} hint={hint}>
    <textarea
      className={`w-full bg-white border rounded-lg px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none transition-colors min-h-[84px] ${
        error ? 'border-red-400 focus:border-red-600' : 'border-slate-300 focus:border-blue-700'
      } ${props.disabled ? 'bg-slate-50 opacity-70' : ''} ${className}`}
      {...props}
    />
  </FieldWrapper>
);

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
  label?: string;
  required?: boolean;
  error?: string;
  hint?: string;
  options: SelectOption[];
  placeholder?: string;
}

export const Select: React.FC<SelectProps> = ({
  label,
  required,
  error,
  hint,
  options,
  placeholder,
  className = '',
  ...props
}) => (
  <FieldWrapper label={label} required={required} error={error} hint={hint}>
    <div className="relative">
      <select
        className={`w-full appearance-none bg-white border rounded-lg px-3 pr-8 py-1.5 min-h-[38px] text-sm text-slate-900 focus:outline-none transition-colors cursor-pointer ${
          error ? 'border-red-400 focus:border-red-600' : 'border-slate-300 focus:border-blue-700'
        } ${props.disabled ? 'bg-slate-50 opacity-70 cursor-not-allowed' : ''} ${className}`}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <ChevronDown className="w-4 h-4 text-slate-400 pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2" />
    </div>
  </FieldWrapper>
);

export const MultiSelect: React.FC<{
  label?: string;
  options: string[];
  selected: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  hint?: string;
}> = ({ label, options, selected, onChange, placeholder = 'Seleccionar opciones...', hint }) => {
  const [open, setOpen] = useState(false);

  const toggle = (item: string) => {
    if (selected.includes(item)) {
      onChange(selected.filter((x) => x !== item));
    } else {
      onChange([...selected, item]);
    }
  };

  return (
    <FieldWrapper label={label} hint={hint}>
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="w-full flex items-center justify-between gap-2 bg-white border border-slate-300 rounded-lg px-3 py-1.5 min-h-[38px] text-sm text-left hover:border-slate-400 cursor-pointer"
        >
          <div className="flex flex-wrap gap-1.5 items-center min-w-0">
            {selected.length === 0 ? (
              <span className="text-slate-400">{placeholder}</span>
            ) : (
              selected.map((s) => (
                <span
                  key={s}
                  className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-slate-100 text-slate-700 rounded border border-slate-200"
                >
                  {s}
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggle(s);
                    }}
                    className="hover:text-red-600"
                  >
                    <X className="w-3 h-3" />
                  </span>
                </span>
              ))
            )}
          </div>
          <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
        </button>

        {open && (
          <div className="absolute z-40 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg max-h-52 overflow-auto py-1">
            {options.map((opt) => {
              const active = selected.includes(opt);
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => toggle(opt)}
                  className="w-full flex items-center justify-between px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  <span>{opt}</span>
                  {active && <Check className="w-3.5 h-3.5 text-blue-700" />}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </FieldWrapper>
  );
};

export const SearchInput: React.FC<{
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
}> = ({ value, onChange, placeholder = 'Buscar...', className = '' }) => (
  <div className={`relative flex items-center bg-white border border-slate-300 rounded-lg focus-within:border-blue-700 min-h-[38px] ${className}`}>
    <Search className="w-4 h-4 text-slate-400 ml-3 shrink-0" />
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full bg-transparent px-2.5 py-1.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
    />
    {value && (
      <button
        type="button"
        onClick={() => onChange('')}
        aria-label="Limpiar búsqueda"
        className="p-1.5 mr-1 text-slate-400 hover:text-slate-700 cursor-pointer"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    )}
  </div>
);

export const DatePicker: React.FC<{
  label?: string;
  value: string;
  onChange: (val: string) => void;
  required?: boolean;
  error?: string;
  disabled?: boolean;
}> = ({ label, value, onChange, required, error, disabled }) => (
  <Input
    type="date"
    label={label}
    value={value}
    onChange={(e) => onChange(e.target.value)}
    required={required}
    error={error}
    disabled={disabled}
    leftAddon={<Calendar className="w-4 h-4" />}
  />
);

export const DateRangePicker: React.FC<{
  label?: string;
  from: string;
  to: string;
  onChange: (range: { from: string; to: string }) => void;
}> = ({ label, from, to, onChange }) => (
  <FieldWrapper label={label}>
    <div className="grid grid-cols-2 gap-2">
      <input
        type="date"
        value={from}
        onChange={(e) => onChange({ from: e.target.value, to })}
        className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 min-h-[38px] text-xs text-slate-900 focus:border-blue-700 focus:outline-none"
      />
      <input
        type="date"
        value={to}
        onChange={(e) => onChange({ from, to: e.target.value })}
        className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 min-h-[38px] text-xs text-slate-900 focus:border-blue-700 focus:outline-none"
      />
    </div>
  </FieldWrapper>
);

export const CurrencyInput: React.FC<{
  label?: string;
  value: number;
  currency: CurrencyCode;
  onChange: (val: number) => void;
  onCurrencyChange?: (c: CurrencyCode) => void;
  required?: boolean;
  error?: string;
}> = ({ label, value, currency, onChange, onCurrencyChange, required, error }) => (
  <FieldWrapper label={label} required={required} error={error}>
    <div className="flex items-center bg-white border border-slate-300 rounded-lg focus-within:border-blue-700 min-h-[38px] overflow-hidden">
      {onCurrencyChange ? (
        <select
          value={currency}
          onChange={(e) => onCurrencyChange(e.target.value as CurrencyCode)}
          className="bg-slate-50 border-r border-slate-200 px-2.5 py-2 text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
        >
          <option value="CLP">CLP</option>
          <option value="UF">UF</option>
          <option value="USD">USD</option>
          <option value="EUR">EUR</option>
        </select>
      ) : (
        <span className="bg-slate-50 border-r border-slate-200 px-2.5 py-2 text-xs font-semibold text-slate-700">
          {currency}
        </span>
      )}
      <input
        type="number"
        min={0}
        step={currency === 'UF' ? '0.01' : '1'}
        value={Number.isNaN(value) ? 0 : value}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        className="w-full px-3 py-1.5 text-sm font-mono tabular-nums text-slate-900 focus:outline-none"
      />
    </div>
  </FieldWrapper>
);

export const RUTInput: React.FC<{
  label?: string;
  value: string;
  onChange: (val: string) => void;
  required?: boolean;
  hint?: string;
}> = ({ label = 'RUT', value, onChange, required, hint }) => {
  const valid = !value || isValidRUTFormat(value);
  return (
    <Input
      label={label}
      required={required}
      value={value}
      placeholder="76.123.456-K"
      onChange={(e) => onChange(formatRUT(e.target.value))}
      error={!valid ? 'Formato o dígito verificador de RUT inválido' : undefined}
      hint={valid ? hint || 'Formato chileno automático (ej: 76.432.198-K)' : undefined}
      className="font-mono tabular-nums"
    />
  );
};

export const Checkbox: React.FC<{
  checked: boolean;
  onChange: (next: boolean) => void;
  label?: string;
  disabled?: boolean;
}> = ({ checked, onChange, label, disabled }) => (
  <label className={`inline-flex items-center gap-2 select-none ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
    <input
      type="checkbox"
      checked={checked}
      disabled={disabled}
      onChange={(e) => onChange(e.target.checked)}
      className="w-4 h-4 rounded border-slate-300 text-blue-700 focus:ring-blue-700 cursor-pointer"
    />
    {label && <span className="text-sm text-slate-700">{label}</span>}
  </label>
);

export const Radio: React.FC<{
  checked: boolean;
  onChange: () => void;
  name: string;
  label: string;
  disabled?: boolean;
}> = ({ checked, onChange, name, label, disabled }) => (
  <label className={`inline-flex items-center gap-2 select-none ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
    <input
      type="radio"
      name={name}
      checked={checked}
      disabled={disabled}
      onChange={onChange}
      className="w-4 h-4 border-slate-300 text-blue-700 focus:ring-blue-700 cursor-pointer"
    />
    <span className="text-sm text-slate-700">{label}</span>
  </label>
);

export const Toggle: React.FC<{
  checked: boolean;
  onChange: (next: boolean) => void;
  label?: string;
  disabled?: boolean;
}> = ({ checked, onChange, label, disabled }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    disabled={disabled}
    onClick={() => onChange(!checked)}
    className={`inline-flex items-center gap-2.5 select-none ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
  >
    <span
      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors duration-150 ${
        checked ? 'bg-blue-700' : 'bg-slate-300'
      }`}
    >
      <span
        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform duration-150 ${
          checked ? 'translate-x-4.5' : 'translate-x-1'
        }`}
      />
    </span>
    {label && <span className="text-sm text-slate-700">{label}</span>}
  </button>
);

export const FormSection: React.FC<{
  title: string;
  description?: string;
  children: React.ReactNode;
}> = ({ title, description, children }) => (
  <div className="space-y-4 pt-4 first:pt-0 border-t first:border-t-0 border-slate-100">
    <div>
      <h4 className="text-sm font-semibold text-slate-900">{title}</h4>
      {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{children}</div>
  </div>
);

export const FileUpload: React.FC<{
  label?: string;
  onFileSelect: (fileInfo: { name: string; size: string; extension: 'PDF' | 'DOCX' | 'XLSX' | 'PNG' }) => void;
}> = ({ label = 'Adjuntar documento', onFileSelect }) => {
  const handleFakePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const extRaw = file.name.split('.').pop()?.toUpperCase() || 'PDF';
    const extension = (['PDF', 'DOCX', 'XLSX', 'PNG'].includes(extRaw) ? extRaw : 'PDF') as
      | 'PDF'
      | 'DOCX'
      | 'XLSX'
      | 'PNG';
    const kb = Math.max(12, Math.round(file.size / 1024));
    const size = kb > 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${kb} KB`;
    onFileSelect({ name: file.name, size, extension });
  };

  return (
    <FieldWrapper label={label}>
      <label className="flex flex-col items-center justify-center border border-dashed border-slate-300 rounded-xl p-6 bg-slate-50/70 hover:bg-slate-100/80 transition-colors cursor-pointer text-center">
        <UploadCloud className="w-6 h-6 text-blue-700 mb-2" />
        <span className="text-xs font-medium text-slate-800">
          Haz clic para seleccionar archivo o arrastra aquí
        </span>
        <span className="text-[11px] text-slate-500 mt-1">
          PDF, DOCX, XLSX o PNG hasta 25 MB (Prototipo visual)
        </span>
        <input type="file" className="hidden" onChange={handleFakePick} />
      </label>
    </FieldWrapper>
  );
};
