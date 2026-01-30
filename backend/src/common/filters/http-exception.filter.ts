import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

interface ValidationError {
  property: string;
  constraints: Record<string, string>;
  children?: ValidationError[];
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Erro interno do servidor';
    let errors: any[] = [];

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object') {
        const responseObj = exceptionResponse as any;
        
        // Handle validation errors from class-validator
        if (responseObj.message && Array.isArray(responseObj.message)) {
          message = 'Erro de validação';
          errors = this.formatValidationErrors(responseObj.message);
        } else if (responseObj.message) {
          message = responseObj.message;
        }

        if (responseObj.error) {
          message = responseObj.message || responseObj.error;
        }
      }
    } else if (exception instanceof Error) {
      this.logger.error(`Unhandled exception: ${exception.message}`, exception.stack);
      
      // Handle Prisma errors
      if (exception.constructor.name === 'PrismaClientValidationError') {
        status = HttpStatus.BAD_REQUEST;
        message = 'Dados inválidos';
        
        // Extract field info from Prisma validation error
        const errorMsg = exception.message;
        if (errorMsg.includes('Invalid value for argument')) {
          const fieldMatch = errorMsg.match(/argument `(\w+)`/);
          const reasonMatch = errorMsg.match(/Expected (.+?)\./);
          if (fieldMatch) {
            const field = this.translateFieldName(fieldMatch[1]);
            const reason = reasonMatch ? this.translatePrismaReason(reasonMatch[1]) : 'valor inválido';
            message = `${field}: ${reason}`;
            errors = [{ field: fieldMatch[1], message: `${field}: ${reason}` }];
          }
        }
      } else if (exception.constructor.name === 'PrismaClientKnownRequestError') {
        const prismaError = exception as any;
        
        if (prismaError.code === 'P2002') {
          // Unique constraint violation
          status = HttpStatus.CONFLICT;
          const fields = prismaError.meta?.target || [];
          const fieldName = Array.isArray(fields) ? fields[0] : fields;
          const translatedField = this.translateFieldName(fieldName);
          message = `${translatedField} já está cadastrado no sistema.`;
          errors = [{ field: fieldName, message: `${translatedField} já existe` }];
        } else if (prismaError.code === 'P2003') {
          // Foreign key constraint
          status = HttpStatus.BAD_REQUEST;
          message = 'Não é possível realizar esta operação. Registro relacionado não encontrado.';
        } else if (prismaError.code === 'P2025') {
          // Record not found
          status = HttpStatus.NOT_FOUND;
          message = 'Registro não encontrado.';
        }
      } else if (exception.message.includes('Unique constraint')) {
        status = HttpStatus.CONFLICT;
        message = 'Registro duplicado. Verifique os dados informados.';
        
        // Extract field name from Prisma error
        const match = exception.message.match(/fields: \(`(.+?)`\)/);
        if (match) {
          const field = this.translateFieldName(match[1]);
          message = `${field} já está cadastrado no sistema.`;
          errors = [{ field: match[1], message: `${field} já existe` }];
        }
      } else if (exception.message.includes('Foreign key constraint')) {
        status = HttpStatus.BAD_REQUEST;
        message = 'Não é possível realizar esta operação. Existem registros vinculados.';
      } else if (exception.message.includes('Record to update not found')) {
        status = HttpStatus.NOT_FOUND;
        message = 'Registro não encontrado para atualização.';
      } else if (exception.message.includes('Record to delete does not exist')) {
        status = HttpStatus.NOT_FOUND;
        message = 'Registro não encontrado para exclusão.';
      }
    }

    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message,
      errors: errors.length > 0 ? errors : undefined,
    };

    // Log error for debugging
    if (status >= 500) {
      this.logger.error(
        `${request.method} ${request.url} - ${status} - ${message}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    } else {
      this.logger.warn(`${request.method} ${request.url} - ${status} - ${message}`);
    }

    response.status(status).json(errorResponse);
  }

  private formatValidationErrors(messages: any[]): any[] {
    const errors: any[] = [];

    for (const msg of messages) {
      if (typeof msg === 'string') {
        // Simple string error message
        const field = this.extractFieldFromMessage(msg);
        errors.push({
          field,
          message: this.translateValidationMessage(msg),
        });
      } else if (typeof msg === 'object' && msg.constraints) {
        // ValidationError object
        const field = msg.property;
        const constraints = Object.values(msg.constraints) as string[];
        for (const constraint of constraints) {
          errors.push({
            field,
            message: this.translateValidationMessage(constraint, field),
          });
        }
      }
    }

    return errors;
  }

  private extractFieldFromMessage(message: string): string {
    // Try to extract field name from common validation messages
    const patterns = [
      /^(\w+)\s+should/i,
      /^(\w+)\s+must/i,
      /^(\w+)\s+is/i,
      /property\s+(\w+)/i,
    ];

    for (const pattern of patterns) {
      const match = message.match(pattern);
      if (match) return match[1];
    }

    return 'unknown';
  }

  private translateFieldName(field: string): string {
    const fieldTranslations: Record<string, string> = {
      name: 'Nome',
      email: 'E-mail',
      phone: 'Telefone',
      cpfCnpj: 'CPF/CNPJ',
      document: 'CPF/CNPJ',
      sku: 'Código SKU',
      barcode: 'Código de barras',
      password: 'Senha',
      code: 'Código',
      title: 'Título',
      description: 'Descrição',
      address: 'Endereço',
      city: 'Cidade',
      state: 'Estado',
      zipCode: 'CEP',
      birthDate: 'Data de nascimento',
      tenantId: 'Empresa',
      customerId: 'Cliente',
      productId: 'Produto',
      categoryId: 'Categoria',
      userId: 'Usuário',
    };

    return fieldTranslations[field] || field;
  }

  private translateValidationMessage(message: string, field?: string): string {
    const fieldName = field ? this.translateFieldName(field) : '';

    // Common validation message translations
    const translations: Array<{ pattern: RegExp; replacement: string }> = [
      { pattern: /should not be empty/i, replacement: `${fieldName} é obrigatório` },
      { pattern: /must be a string/i, replacement: `${fieldName} deve ser um texto` },
      { pattern: /must be an email/i, replacement: `${fieldName} deve ser um e-mail válido` },
      { pattern: /must be a number/i, replacement: `${fieldName} deve ser um número` },
      { pattern: /must be a valid date/i, replacement: `${fieldName} deve ser uma data válida` },
      { pattern: /must be a boolean/i, replacement: `${fieldName} deve ser verdadeiro ou falso` },
      { pattern: /must be an array/i, replacement: `${fieldName} deve ser uma lista` },
      { pattern: /must be longer than/i, replacement: `${fieldName} é muito curto` },
      { pattern: /must be shorter than/i, replacement: `${fieldName} é muito longo` },
      { pattern: /must be a positive number/i, replacement: `${fieldName} deve ser um número positivo` },
      { pattern: /must not be greater than/i, replacement: `${fieldName} excede o valor máximo permitido` },
      { pattern: /must not be less than/i, replacement: `${fieldName} é menor que o valor mínimo permitido` },
      { pattern: /property .+ should not exist/i, replacement: `Campo não permitido` },
      { pattern: /each value in/i, replacement: `Valores inválidos em ${fieldName}` },
    ];

    for (const { pattern, replacement } of translations) {
      if (pattern.test(message)) {
        return replacement;
      }
    }

    return message;
  }

  private translatePrismaReason(reason: string): string {
    const translations: Record<string, string> = {
      'ISO-8601 DateTime': 'data inválida (use formato DD/MM/AAAA)',
      'ISO-8601 Date': 'data inválida (use formato DD/MM/AAAA)',
      'a number': 'deve ser um número',
      'a string': 'deve ser um texto',
      'a boolean': 'deve ser verdadeiro ou falso',
      'an array': 'deve ser uma lista',
      'a valid UUID': 'identificador inválido',
      'a valid email': 'e-mail inválido',
    };

    for (const [key, value] of Object.entries(translations)) {
      if (reason.includes(key)) {
        return value;
      }
    }

    return reason;
  }
}
