import toast from 'react-hot-toast';

interface ApiError {
  statusCode: number;
  message: string;
  errors?: Array<{
    field: string;
    message: string;
  }>;
}

/**
 * Extrai e formata mensagens de erro da API
 */
export function getErrorMessage(error: any, fallbackMessage = 'Ocorreu um erro inesperado'): string {
  if (!error?.response?.data) {
    return fallbackMessage;
  }

  const data = error.response.data as ApiError;

  // Se tem erros de campo específicos, retorna o primeiro
  if (data.errors && data.errors.length > 0) {
    return data.errors.map(e => e.message).join('. ');
  }

  // Se tem mensagem direta
  if (data.message) {
    return data.message;
  }

  return fallbackMessage;
}

/**
 * Exibe toast de erro com detalhes da API
 */
export function showApiError(error: any, fallbackMessage = 'Ocorreu um erro inesperado') {
  const message = getErrorMessage(error, fallbackMessage);
  toast.error(message);
}

/**
 * Exibe toast de erro detalhado para erros de validação
 * Mostra cada campo com erro separadamente
 */
export function showValidationErrors(error: any) {
  const data = error?.response?.data as ApiError | undefined;

  if (!data?.errors || data.errors.length === 0) {
    toast.error(data?.message || 'Erro de validação');
    return;
  }

  // Para múltiplos erros, mostra cada um
  if (data.errors.length === 1) {
    toast.error(data.errors[0].message);
  } else {
    // Agrupa erros em uma única mensagem
    const messages = data.errors.map(e => `• ${e.message}`).join('\n');
    toast.error(`Corrija os seguintes campos:\n${messages}`, { duration: 6000 });
  }
}

/**
 * Retorna erros específicos por campo para uso com react-hook-form
 */
export function getFieldErrors(error: any): Record<string, string> {
  const data = error?.response?.data as ApiError | undefined;
  const fieldErrors: Record<string, string> = {};

  if (data?.errors) {
    for (const err of data.errors) {
      fieldErrors[err.field] = err.message;
    }
  }

  return fieldErrors;
}
