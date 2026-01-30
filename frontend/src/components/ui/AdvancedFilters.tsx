'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Filter,
  X,
  Calendar,
  ChevronDown,
  ChevronUp,
  Search,
  RotateCcw,
  Save,
  Trash2,
} from 'lucide-react';
import { format, subDays, startOfMonth, endOfMonth, startOfYear, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export interface FilterField {
  id: string;
  label: string;
  type: 'text' | 'select' | 'multiselect' | 'date' | 'daterange' | 'number' | 'numberrange' | 'boolean';
  options?: { value: string; label: string }[];
  placeholder?: string;
  defaultValue?: any;
}

export interface FilterPreset {
  id: string;
  name: string;
  filters: Record<string, any>;
}

export interface AdvancedFiltersProps {
  fields: FilterField[];
  values: Record<string, any>;
  onChange: (values: Record<string, any>) => void;
  onApply?: () => void;
  onReset?: () => void;
  presets?: FilterPreset[];
  onSavePreset?: (name: string, filters: Record<string, any>) => void;
  onDeletePreset?: (id: string) => void;
  showPresets?: boolean;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  className?: string;
}

// Presets de período rápido
const quickDatePresets = [
  { id: 'today', label: 'Hoje', getValue: () => ({ start: new Date(), end: new Date() }) },
  { id: 'yesterday', label: 'Ontem', getValue: () => ({ start: subDays(new Date(), 1), end: subDays(new Date(), 1) }) },
  { id: 'last7days', label: 'Últimos 7 dias', getValue: () => ({ start: subDays(new Date(), 7), end: new Date() }) },
  { id: 'last30days', label: 'Últimos 30 dias', getValue: () => ({ start: subDays(new Date(), 30), end: new Date() }) },
  { id: 'thisMonth', label: 'Este mês', getValue: () => ({ start: startOfMonth(new Date()), end: endOfMonth(new Date()) }) },
  { id: 'lastMonth', label: 'Mês passado', getValue: () => ({ start: startOfMonth(subMonths(new Date(), 1)), end: endOfMonth(subMonths(new Date(), 1)) }) },
  { id: 'last3months', label: 'Últimos 3 meses', getValue: () => ({ start: subMonths(new Date(), 3), end: new Date() }) },
  { id: 'thisYear', label: 'Este ano', getValue: () => ({ start: startOfYear(new Date()), end: new Date() }) },
];

export function AdvancedFilters({
  fields,
  values,
  onChange,
  onApply,
  onReset,
  presets = [],
  onSavePreset,
  onDeletePreset,
  showPresets = true,
  collapsible = true,
  defaultCollapsed = false,
  className = '',
}: AdvancedFiltersProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const [showSavePreset, setShowSavePreset] = useState(false);
  const [presetName, setPresetName] = useState('');
  const [activePreset, setActivePreset] = useState<string | null>(null);

  const handleFieldChange = (fieldId: string, value: any) => {
    onChange({ ...values, [fieldId]: value });
    setActivePreset(null);
  };

  const handleDateRangePreset = (fieldId: string, presetId: string) => {
    const preset = quickDatePresets.find(p => p.id === presetId);
    if (preset) {
      const { start, end } = preset.getValue();
      onChange({
        ...values,
        [`${fieldId}Start`]: format(start, 'yyyy-MM-dd'),
        [`${fieldId}End`]: format(end, 'yyyy-MM-dd'),
      });
    }
  };

  const handleReset = () => {
    const resetValues: Record<string, any> = {};
    fields.forEach(field => {
      resetValues[field.id] = field.defaultValue || (field.type === 'multiselect' ? [] : '');
    });
    onChange(resetValues);
    setActivePreset(null);
    onReset?.();
  };

  const handleApplyPreset = (preset: FilterPreset) => {
    onChange(preset.filters);
    setActivePreset(preset.id);
  };

  const handleSavePreset = () => {
    if (presetName.trim() && onSavePreset) {
      onSavePreset(presetName.trim(), values);
      setPresetName('');
      setShowSavePreset(false);
    }
  };

  const activeFiltersCount = Object.entries(values).filter(([key, val]) => {
    if (Array.isArray(val)) return val.length > 0;
    if (typeof val === 'boolean') return val;
    return val !== '' && val !== null && val !== undefined;
  }).length;

  const renderField = (field: FilterField) => {
    switch (field.type) {
      case 'text':
        return (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={values[field.id] || ''}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
              placeholder={field.placeholder || `Buscar ${field.label.toLowerCase()}...`}
              className="input pl-10"
            />
          </div>
        );

      case 'select':
        return (
          <select
            value={values[field.id] || ''}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            className="input"
          >
            <option value="">Todos</option>
            {field.options?.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        );

      case 'multiselect':
        const selectedValues = values[field.id] || [];
        return (
          <div className="space-y-2">
            <div className="flex flex-wrap gap-1">
              {selectedValues.map((val: string) => {
                const option = field.options?.find(o => o.value === val);
                return (
                  <span
                    key={val}
                    className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-lg"
                  >
                    {option?.label || val}
                    <button
                      onClick={() => handleFieldChange(field.id, selectedValues.filter((v: string) => v !== val))}
                      className="hover:text-primary-900 dark:hover:text-primary-100"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                );
              })}
            </div>
            <select
              value=""
              onChange={(e) => {
                if (e.target.value && !selectedValues.includes(e.target.value)) {
                  handleFieldChange(field.id, [...selectedValues, e.target.value]);
                }
              }}
              className="input"
            >
              <option value="">Adicionar {field.label.toLowerCase()}...</option>
              {field.options?.filter(opt => !selectedValues.includes(opt.value)).map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        );

      case 'date':
        return (
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="date"
              value={values[field.id] || ''}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
              className="input pl-10"
            />
          </div>
        );

      case 'daterange':
        return (
          <div className="space-y-2">
            <div className="flex flex-wrap gap-1">
              {quickDatePresets.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleDateRangePreset(field.id, preset.id)}
                  className="px-2 py-1 text-xs rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-primary-100 dark:hover:bg-primary-900/30 text-slate-600 dark:text-slate-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
                >
                  {preset.label}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="date"
                  value={values[`${field.id}Start`] || ''}
                  onChange={(e) => handleFieldChange(`${field.id}Start`, e.target.value)}
                  className="input pl-10 text-sm"
                  placeholder="Data inicial"
                />
              </div>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="date"
                  value={values[`${field.id}End`] || ''}
                  onChange={(e) => handleFieldChange(`${field.id}End`, e.target.value)}
                  className="input pl-10 text-sm"
                  placeholder="Data final"
                />
              </div>
            </div>
          </div>
        );

      case 'number':
        return (
          <input
            type="number"
            value={values[field.id] || ''}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            className="input"
          />
        );

      case 'numberrange':
        return (
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              value={values[`${field.id}Min`] || ''}
              onChange={(e) => handleFieldChange(`${field.id}Min`, e.target.value)}
              placeholder="Mínimo"
              className="input text-sm"
            />
            <input
              type="number"
              value={values[`${field.id}Max`] || ''}
              onChange={(e) => handleFieldChange(`${field.id}Max`, e.target.value)}
              placeholder="Máximo"
              className="input text-sm"
            />
          </div>
        );

      case 'boolean':
        return (
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={values[field.id] || false}
              onChange={(e) => handleFieldChange(field.id, e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="text-sm text-slate-600 dark:text-slate-400">
              {field.placeholder || field.label}
            </span>
          </label>
        );

      default:
        return null;
    }
  };

  return (
    <div className={`bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 ${className}`}>
      {/* Header */}
      <div
        className={`flex items-center justify-between p-4 ${collapsible ? 'cursor-pointer' : ''}`}
        onClick={() => collapsible && setIsCollapsed(!isCollapsed)}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
            <Filter className="w-5 h-5 text-primary-600 dark:text-primary-400" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white">Filtros Avançados</h3>
            {activeFiltersCount > 0 && (
              <span className="text-xs text-primary-600 dark:text-primary-400">
                {activeFiltersCount} filtro(s) ativo(s)
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {activeFiltersCount > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleReset();
              }}
              className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              title="Limpar filtros"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
          {collapsible && (
            <button className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200">
              {isCollapsed ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <AnimatePresence>
        {!isCollapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-4">
              {/* Presets */}
              {showPresets && presets.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 pb-3 border-b border-slate-200 dark:border-slate-700">
                  <span className="text-sm text-slate-500 dark:text-slate-400">Presets:</span>
                  {presets.map((preset) => (
                    <div key={preset.id} className="flex items-center">
                      <button
                        onClick={() => handleApplyPreset(preset)}
                        className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                          activePreset === preset.id
                            ? 'bg-primary-500 text-white'
                            : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-primary-100 dark:hover:bg-primary-900/30'
                        }`}
                      >
                        {preset.name}
                      </button>
                      {onDeletePreset && (
                        <button
                          onClick={() => onDeletePreset(preset.id)}
                          className="p-1 text-slate-400 hover:text-red-500 ml-1"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Filter Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {fields.map((field) => (
                  <div key={field.id}>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      {field.label}
                    </label>
                    {renderField(field)}
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2">
                  {onSavePreset && (
                    <>
                      {showSavePreset ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={presetName}
                            onChange={(e) => setPresetName(e.target.value)}
                            placeholder="Nome do preset..."
                            className="input py-1.5 text-sm w-40"
                            autoFocus
                          />
                          <button
                            onClick={handleSavePreset}
                            disabled={!presetName.trim()}
                            className="btn-primary py-1.5 text-sm"
                          >
                            Salvar
                          </button>
                          <button
                            onClick={() => {
                              setShowSavePreset(false);
                              setPresetName('');
                            }}
                            className="btn-secondary py-1.5 text-sm"
                          >
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setShowSavePreset(true)}
                          className="btn-secondary py-1.5 text-sm"
                        >
                          <Save className="w-4 h-4" />
                          Salvar Preset
                        </button>
                      )}
                    </>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={handleReset} className="btn-secondary">
                    <RotateCcw className="w-4 h-4" />
                    Limpar
                  </button>
                  {onApply && (
                    <button onClick={onApply} className="btn-primary">
                      <Search className="w-4 h-4" />
                      Aplicar Filtros
                    </button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default AdvancedFilters;
