import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { AddressService } from './address.service';
import { AddressResponseDto } from './dto/address-response.dto';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('Endereços')
@Controller('address')
export class AddressController {
  constructor(private readonly addressService: AddressService) {}

  @Public()
  @Get('cep/:cep')
  @ApiOperation({ summary: 'Buscar endereço por CEP' })
  @ApiParam({ name: 'cep', description: 'CEP para busca (com ou sem hífen)', example: '01310-100' })
  @ApiResponse({ status: 200, description: 'Endereço encontrado', type: AddressResponseDto })
  @ApiResponse({ status: 404, description: 'CEP não encontrado' })
  async findByCep(@Param('cep') cep: string): Promise<AddressResponseDto> {
    return this.addressService.findByCep(cep);
  }

  @Public()
  @Get('search')
  @ApiOperation({ summary: 'Buscar CEP por endereço' })
  @ApiQuery({ name: 'uf', description: 'Sigla do estado', example: 'SP' })
  @ApiQuery({ name: 'city', description: 'Nome da cidade', example: 'São Paulo' })
  @ApiQuery({ name: 'street', description: 'Nome da rua', example: 'Paulista' })
  @ApiResponse({ status: 200, description: 'Endereços encontrados', type: [AddressResponseDto] })
  @ApiResponse({ status: 404, description: 'Nenhum endereço encontrado' })
  async searchByAddress(
    @Query('uf') uf: string,
    @Query('city') city: string,
    @Query('street') street: string,
  ): Promise<AddressResponseDto[]> {
    return this.addressService.searchByAddress(uf, city, street);
  }

  @Public()
  @Get('states')
  @ApiOperation({ summary: 'Listar estados brasileiros' })
  @ApiResponse({ status: 200, description: 'Lista de estados' })
  async getStates(): Promise<{ code: string; name: string }[]> {
    return this.addressService.getStates();
  }
}
