/**
 * Remove campos vazios (string vazia, null, undefined) de um objeto
 * Útil para limpar dados antes de enviar ao Prisma
 */
export function sanitizeData<T extends Record<string, any>>(
  data: T,
): Partial<T> {
  const sanitized: Partial<T> = {};

  for (const [key, value] of Object.entries(data)) {
    // Ignora valores undefined, null ou strings vazias
    if (value === undefined || value === null || value === "") {
      continue;
    }

    // Se for string, faz trim
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (trimmed !== "") {
        (sanitized as any)[key] = trimmed;
      }
    } else {
      (sanitized as any)[key] = value;
    }
  }

  return sanitized;
}

/**
 * Converte uma string de data (YYYY-MM-DD) para DateTime ISO-8601
 * Retorna undefined se a data for inválida ou vazia
 */
export function toISODateTime(
  dateString: string | Date | undefined | null,
): Date | undefined {
  if (
    !dateString ||
    (typeof dateString === "string" && dateString.trim() === "")
  ) {
    return undefined;
  }

  // Se já for um Date válido
  if (dateString instanceof Date) {
    return isNaN(dateString.getTime()) ? undefined : dateString;
  }

  // Se já estiver no formato ISO completo
  if (dateString.includes("T")) {
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? undefined : date;
  }

  // Formato YYYY-MM-DD
  const match = dateString.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) {
    return undefined;
  }

  const [, year, month, day] = match;
  const yearNum = parseInt(year, 10);
  const monthNum = parseInt(month, 10);
  const dayNum = parseInt(day, 10);

  // Validação básica
  if (yearNum < 1900 || yearNum > 2100) return undefined;
  if (monthNum < 1 || monthNum > 12) return undefined;
  if (dayNum < 1 || dayNum > 31) return undefined;

  const date = new Date(yearNum, monthNum - 1, dayNum, 12, 0, 0, 0);

  // Verifica se a data é válida (ex: 31 de fevereiro seria inválido)
  if (
    date.getFullYear() !== yearNum ||
    date.getMonth() !== monthNum - 1 ||
    date.getDate() !== dayNum
  ) {
    return undefined;
  }

  return date;
}

/**
 * Converte um valor para número ou retorna undefined
 */
export function toNumber(value: any): number | undefined {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }
  const num = Number(value);
  return isNaN(num) ? undefined : num;
}

/**
 * Converte um valor para boolean ou retorna undefined
 */
export function toBoolean(value: any): boolean | undefined {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }
  if (typeof value === "boolean") return value;
  if (value === "true" || value === "1") return true;
  if (value === "false" || value === "0") return false;
  return undefined;
}
