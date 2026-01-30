import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AddressResponseDto } from './dto/address-response.dto';

interface ViaCepResponse {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  ibge: string;
  gia: string;
  ddd: string;
  siafi: string;
  erro?: boolean;
}

@Injectable()
export class AddressService {
  private readonly logger = new Logger(AddressService.name);

  constructor(private readonly httpService: HttpService) {}

  async findByCep(cep: string): Promise<AddressResponseDto> {
    // Remove caracteres não numéricos
    const cleanCep = cep.replace(/\D/g, '');

    // Valida formato do CEP
    if (cleanCep.length !== 8) {
      throw new NotFoundException('CEP inválido. O CEP deve conter 8 dígitos.');
    }

    try {
      // Tenta buscar no ViaCEP (API gratuita e confiável)
      const response = await firstValueFrom(
        this.httpService.get<ViaCepResponse>(
          `https://viacep.com.br/ws/${cleanCep}/json/`,
          { timeout: 5000 },
        ),
      );

      const data = response.data;

      // ViaCEP retorna { erro: true } quando o CEP não existe
      if (data.erro) {
        throw new NotFoundException('CEP não encontrado.');
      }

      // Formata o CEP com hífen
      const formattedCep = `${cleanCep.slice(0, 5)}-${cleanCep.slice(5)}`;

      return {
        cep: formattedCep,
        street: data.logradouro || '',
        complement: data.complemento || '',
        neighborhood: data.bairro || '',
        city: data.localidade || '',
        state: data.uf || '',
        ibgeCode: data.ibge || '',
        ddd: data.ddd || '',
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      this.logger.error(`Erro ao buscar CEP ${cleanCep}:`, error);

      // Tenta uma API alternativa em caso de falha
      return this.findByCepAlternative(cleanCep);
    }
  }

  private async findByCepAlternative(cep: string): Promise<AddressResponseDto> {
    try {
      // API alternativa: BrasilAPI
      const response = await firstValueFrom(
        this.httpService.get<{
          cep: string;
          state: string;
          city: string;
          neighborhood: string;
          street: string;
        }>(`https://brasilapi.com.br/api/cep/v1/${cep}`, { timeout: 5000 }),
      );

      const data = response.data;
      const formattedCep = `${cep.slice(0, 5)}-${cep.slice(5)}`;

      return {
        cep: formattedCep,
        street: data.street || '',
        complement: '',
        neighborhood: data.neighborhood || '',
        city: data.city || '',
        state: data.state || '',
        ibgeCode: '',
        ddd: '',
      };
    } catch {
      this.logger.error(`Erro na API alternativa para CEP ${cep}`);
      throw new NotFoundException(
        'CEP não encontrado. Verifique se o CEP está correto.',
      );
    }
  }

  async searchByAddress(
    uf: string,
    city: string,
    street: string,
  ): Promise<AddressResponseDto[]> {
    // Valida parâmetros mínimos
    if (!uf || uf.length !== 2) {
      throw new NotFoundException('UF inválido. Informe a sigla do estado (ex: SP, RJ).');
    }

    if (!city || city.length < 3) {
      throw new NotFoundException('Cidade inválida. Informe pelo menos 3 caracteres.');
    }

    if (!street || street.length < 3) {
      throw new NotFoundException('Logradouro inválido. Informe pelo menos 3 caracteres.');
    }

    try {
      const encodedCity = encodeURIComponent(city);
      const encodedStreet = encodeURIComponent(street);

      const response = await firstValueFrom(
        this.httpService.get<ViaCepResponse[]>(
          `https://viacep.com.br/ws/${uf}/${encodedCity}/${encodedStreet}/json/`,
          { timeout: 10000 },
        ),
      );

      const data = response.data;

      if (!data || !Array.isArray(data) || data.length === 0) {
        throw new NotFoundException('Nenhum endereço encontrado.');
      }

      return data.map((item) => ({
        cep: item.cep || '',
        street: item.logradouro || '',
        complement: item.complemento || '',
        neighborhood: item.bairro || '',
        city: item.localidade || '',
        state: item.uf || '',
        ibgeCode: item.ibge || '',
        ddd: item.ddd || '',
      }));
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      this.logger.error('Erro ao buscar endereço:', error);
      throw new NotFoundException('Erro ao buscar endereço. Tente novamente.');
    }
  }

  async getStates(): Promise<{ code: string; name: string }[]> {
    return [
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
    ];
  }
}
