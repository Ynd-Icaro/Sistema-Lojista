'use client';

import { useState } from 'react';
import { Search, Loader2, MapPin, CheckCircle } from 'lucide-react';
import { addressApi, AddressResponse } from '@/lib/api';

interface CepInputProps {
  value: string;
  onChange: (cep: string) => void;
  onAddressFound: (address: AddressResponse) => void;
  error?: string;
  disabled?: boolean;
  className?: string;
}

export function CepInput({
  value,
  onChange,
  onAddressFound,
  error,
  disabled = false,
  className = '',
}: CepInputProps) {
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const formatCep = (cep: string): string => {
    // Remove tudo que não for número
    const numbers = cep.replace(/\D/g, '');
    // Formata com hífen
    if (numbers.length <= 5) {
      return numbers;
    }
    return `${numbers.slice(0, 5)}-${numbers.slice(5, 8)}`;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCep(e.target.value);
    onChange(formatted);
    setSearchError(null);
    setSuccess(false);
  };

  const handleSearch = async () => {
    const cleanCep = value.replace(/\D/g, '');
    
    if (cleanCep.length !== 8) {
      setSearchError('CEP deve ter 8 dígitos');
      return;
    }

    setLoading(true);
    setSearchError(null);
    setSuccess(false);

    try {
      const response = await addressApi.findByCep(cleanCep);
      onAddressFound(response.data);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setSearchError(
        err.response?.data?.message || 'CEP não encontrado'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === 'Tab') {
      const cleanCep = value.replace(/\D/g, '');
      if (cleanCep.length === 8) {
        e.preventDefault();
        handleSearch();
      }
    }
  };

  return (
    <div className={`space-y-1 ${className}`}>
      <div className="relative flex">
        <div className="relative flex-1">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onBlur={() => {
              const cleanCep = value.replace(/\D/g, '');
              if (cleanCep.length === 8 && !success) {
                handleSearch();
              }
            }}
            placeholder="00000-000"
            maxLength={9}
            disabled={disabled || loading}
            className={`
              w-full pl-10 pr-3 py-2 rounded-l-lg border transition-colors
              focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500
              disabled:bg-gray-100 disabled:cursor-not-allowed
              dark:bg-gray-700 dark:border-gray-600 dark:text-white
              ${error || searchError
                ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                : success
                ? 'border-green-500 focus:border-green-500 focus:ring-green-500/20'
                : 'border-gray-300'
              }
            `}
          />
          {success && (
            <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
          )}
        </div>
        <button
          type="button"
          onClick={handleSearch}
          disabled={disabled || loading || value.replace(/\D/g, '').length !== 8}
          className={`
            px-4 py-2 rounded-r-lg border border-l-0 transition-colors
            flex items-center justify-center min-w-[48px]
            ${disabled || loading || value.replace(/\D/g, '').length !== 8
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-300 dark:bg-gray-600 dark:border-gray-600'
              : 'bg-blue-600 text-white hover:bg-blue-700 border-blue-600'
            }
          `}
          title="Buscar CEP"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Search className="h-4 w-4" />
          )}
        </button>
      </div>
      {(error || searchError) && (
        <p className="text-sm text-red-500">{error || searchError}</p>
      )}
      {success && (
        <p className="text-sm text-green-500">Endereço encontrado!</p>
      )}
    </div>
  );
}

// Hook para facilitar o uso da busca de CEP
export function useCepSearch() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchCep = async (cep: string): Promise<AddressResponse | null> => {
    const cleanCep = cep.replace(/\D/g, '');
    
    if (cleanCep.length !== 8) {
      setError('CEP deve ter 8 dígitos');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await addressApi.findByCep(cleanCep);
      return response.data;
    } catch (err: any) {
      setError(err.response?.data?.message || 'CEP não encontrado');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { searchCep, loading, error };
}

export default CepInput;
