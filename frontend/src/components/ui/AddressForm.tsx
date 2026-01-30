'use client';

import { useState, useEffect } from 'react';
import { CepInput } from './CepInput';
import { addressApi, AddressResponse } from '@/lib/api';

export interface AddressData {
  zipCode: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
}

interface AddressFormProps {
  value: AddressData;
  onChange: (address: AddressData) => void;
  errors?: Partial<Record<keyof AddressData, string>>;
  disabled?: boolean;
}

export function AddressForm({
  value,
  onChange,
  errors = {},
  disabled = false,
}: AddressFormProps) {
  const [states, setStates] = useState<{ code: string; name: string }[]>([]);
  const [loadingStates, setLoadingStates] = useState(true);

  useEffect(() => {
    loadStates();
  }, []);

  const loadStates = async () => {
    try {
      const response = await addressApi.getStates();
      setStates(response.data);
    } catch (error) {
      // Estados padrão em caso de falha
      setStates([
        { code: 'AC', name: 'Acre' },
        { code: 'AL', name: 'Alagoas' },
        { code: 'AP', name: 'Amapá' },
        { code: 'AM', name: 'Amazonas' },
        { code: 'BA', name: 'Bahia' },
        { code: 'CE', name: 'Ceará' },
        { code: 'DF', name: 'Distrito Federal' },
        { code: 'ES', name: 'Espírito Santo' },
        { code: 'GO', name: 'Goiás' },
        { code: 'MA', name: 'Maranhão' },
        { code: 'MT', name: 'Mato Grosso' },
        { code: 'MS', name: 'Mato Grosso do Sul' },
        { code: 'MG', name: 'Minas Gerais' },
        { code: 'PA', name: 'Pará' },
        { code: 'PB', name: 'Paraíba' },
        { code: 'PR', name: 'Paraná' },
        { code: 'PE', name: 'Pernambuco' },
        { code: 'PI', name: 'Piauí' },
        { code: 'RJ', name: 'Rio de Janeiro' },
        { code: 'RN', name: 'Rio Grande do Norte' },
        { code: 'RS', name: 'Rio Grande do Sul' },
        { code: 'RO', name: 'Rondônia' },
        { code: 'RR', name: 'Roraima' },
        { code: 'SC', name: 'Santa Catarina' },
        { code: 'SP', name: 'São Paulo' },
        { code: 'SE', name: 'Sergipe' },
        { code: 'TO', name: 'Tocantins' },
      ]);
    } finally {
      setLoadingStates(false);
    }
  };

  const handleAddressFound = (address: AddressResponse) => {
    onChange({
      ...value,
      zipCode: address.cep,
      street: address.street,
      neighborhood: address.neighborhood,
      city: address.city,
      state: address.state,
      complement: address.complement || value.complement,
    });
  };

  const handleFieldChange = (field: keyof AddressData, fieldValue: string) => {
    onChange({
      ...value,
      [field]: fieldValue,
    });
  };

  const inputClassName = (hasError: boolean) => `
    w-full px-3 py-2 rounded-lg border transition-colors
    focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500
    disabled:bg-gray-100 disabled:cursor-not-allowed
    dark:bg-gray-700 dark:border-gray-600 dark:text-white
    ${hasError ? 'border-red-500' : 'border-gray-300'}
  `;

  return (
    <div className="space-y-4">
      {/* Linha 1: CEP */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            CEP
          </label>
          <CepInput
            value={value.zipCode}
            onChange={(cep) => handleFieldChange('zipCode', cep)}
            onAddressFound={handleAddressFound}
            error={errors.zipCode}
            disabled={disabled}
          />
        </div>
      </div>

      {/* Linha 2: Rua e Número */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-3">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Rua/Logradouro
          </label>
          <input
            type="text"
            value={value.street}
            onChange={(e) => handleFieldChange('street', e.target.value)}
            placeholder="Rua, Avenida, etc."
            disabled={disabled}
            className={inputClassName(!!errors.street)}
          />
          {errors.street && (
            <p className="mt-1 text-sm text-red-500">{errors.street}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Número
          </label>
          <input
            type="text"
            value={value.number}
            onChange={(e) => handleFieldChange('number', e.target.value)}
            placeholder="Nº"
            disabled={disabled}
            className={inputClassName(!!errors.number)}
          />
          {errors.number && (
            <p className="mt-1 text-sm text-red-500">{errors.number}</p>
          )}
        </div>
      </div>

      {/* Linha 3: Complemento e Bairro */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Complemento
          </label>
          <input
            type="text"
            value={value.complement}
            onChange={(e) => handleFieldChange('complement', e.target.value)}
            placeholder="Apto, Bloco, Sala, etc. (opcional)"
            disabled={disabled}
            className={inputClassName(!!errors.complement)}
          />
          {errors.complement && (
            <p className="mt-1 text-sm text-red-500">{errors.complement}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Bairro
          </label>
          <input
            type="text"
            value={value.neighborhood}
            onChange={(e) => handleFieldChange('neighborhood', e.target.value)}
            placeholder="Bairro"
            disabled={disabled}
            className={inputClassName(!!errors.neighborhood)}
          />
          {errors.neighborhood && (
            <p className="mt-1 text-sm text-red-500">{errors.neighborhood}</p>
          )}
        </div>
      </div>

      {/* Linha 4: Cidade e Estado */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Cidade
          </label>
          <input
            type="text"
            value={value.city}
            onChange={(e) => handleFieldChange('city', e.target.value)}
            placeholder="Cidade"
            disabled={disabled}
            className={inputClassName(!!errors.city)}
          />
          {errors.city && (
            <p className="mt-1 text-sm text-red-500">{errors.city}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Estado
          </label>
          <select
            value={value.state}
            onChange={(e) => handleFieldChange('state', e.target.value)}
            disabled={disabled || loadingStates}
            className={inputClassName(!!errors.state)}
          >
            <option value="">Selecione</option>
            {states.map((state) => (
              <option key={state.code} value={state.code}>
                {state.code} - {state.name}
              </option>
            ))}
          </select>
          {errors.state && (
            <p className="mt-1 text-sm text-red-500">{errors.state}</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default AddressForm;
