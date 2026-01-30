import { ApiProperty } from '@nestjs/swagger';

export class AddressResponseDto {
  @ApiProperty({ description: 'CEP formatado', example: '01310-100' })
  cep: string;

  @ApiProperty({ description: 'Logradouro (rua, avenida, etc.)', example: 'Avenida Paulista' })
  street: string;

  @ApiProperty({ description: 'Complemento', example: 'de 1047 ao fim - lado ímpar' })
  complement: string;

  @ApiProperty({ description: 'Bairro', example: 'Bela Vista' })
  neighborhood: string;

  @ApiProperty({ description: 'Cidade', example: 'São Paulo' })
  city: string;

  @ApiProperty({ description: 'Estado (UF)', example: 'SP' })
  state: string;

  @ApiProperty({ description: 'Código IBGE da cidade', example: '3550308' })
  ibgeCode: string;

  @ApiProperty({ description: 'DDD da região', example: '11' })
  ddd: string;
}
