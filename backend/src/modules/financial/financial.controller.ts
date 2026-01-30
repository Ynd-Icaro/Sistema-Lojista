import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { FinancialService } from './financial.service';
import { CreateTransactionDto, UpdateTransactionDto, TransactionQueryDto, CreateCategoryDto, ConfirmTransactionDto } from './dto/financial.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('financial')
@Controller('financial')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class FinancialController {
  constructor(private readonly financialService: FinancialService) {}

  // ============== TRANSACTIONS ==============

  @Get('transactions')
  @ApiOperation({ summary: 'Listar todas as transações' })
  findAllTransactions(@CurrentUser('tenantId') tenantId: string, @Query() query: TransactionQueryDto) {
    return this.financialService.findAllTransactions(tenantId, query);
  }

  @Get('transactions/:id')
  @ApiOperation({ summary: 'Buscar transação por ID' })
  findOneTransaction(@Param('id') id: string, @CurrentUser('tenantId') tenantId: string) {
    return this.financialService.findOneTransaction(id, tenantId);
  }

  @Post('transactions')
  @ApiOperation({ summary: 'Criar nova transação' })
  createTransaction(@CurrentUser('tenantId') tenantId: string, @Body() dto: CreateTransactionDto) {
    return this.financialService.createTransaction(tenantId, dto);
  }

  @Put('transactions/:id')
  @ApiOperation({ summary: 'Atualizar transação' })
  updateTransaction(
    @Param('id') id: string,
    @CurrentUser('tenantId') tenantId: string,
    @Body() dto: UpdateTransactionDto,
  ) {
    return this.financialService.updateTransaction(id, tenantId, dto);
  }

  @Put('transactions/:id/confirm')
  @ApiOperation({ summary: 'Confirmar pagamento da transação' })
  confirmTransaction(
    @Param('id') id: string,
    @CurrentUser('tenantId') tenantId: string,
    @Body() dto: ConfirmTransactionDto,
  ) {
    return this.financialService.confirmTransaction(id, tenantId, dto.paidDate, dto.paymentMethod);
  }

  @Put('transactions/:id/cancel')
  @ApiOperation({ summary: 'Cancelar transação' })
  cancelTransaction(@Param('id') id: string, @CurrentUser('tenantId') tenantId: string) {
    return this.financialService.cancelTransaction(id, tenantId);
  }

  @Delete('transactions/:id')
  @ApiOperation({ summary: 'Remover transação' })
  removeTransaction(@Param('id') id: string, @CurrentUser('tenantId') tenantId: string) {
    return this.financialService.removeTransaction(id, tenantId);
  }

  // ============== CATEGORIES ==============

  @Get('categories')
  @ApiOperation({ summary: 'Listar categorias de transação' })
  findAllCategories(@CurrentUser('tenantId') tenantId: string) {
    return this.financialService.findAllCategories(tenantId);
  }

  @Post('categories')
  @ApiOperation({ summary: 'Criar categoria de transação' })
  createCategory(@CurrentUser('tenantId') tenantId: string, @Body() dto: CreateCategoryDto) {
    return this.financialService.createCategory(tenantId, dto);
  }

  @Put('categories/:id')
  @ApiOperation({ summary: 'Atualizar categoria' })
  updateCategory(
    @Param('id') id: string,
    @CurrentUser('tenantId') tenantId: string,
    @Body() dto: Partial<CreateCategoryDto>,
  ) {
    return this.financialService.updateCategory(id, tenantId, dto);
  }

  @Delete('categories/:id')
  @ApiOperation({ summary: 'Remover categoria' })
  removeCategory(@Param('id') id: string, @CurrentUser('tenantId') tenantId: string) {
    return this.financialService.removeCategory(id, tenantId);
  }

  // ============== REPORTS ==============

  @Get('balance')
  @ApiOperation({ summary: 'Obter saldo (receitas - despesas)' })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  getBalance(
    @CurrentUser('tenantId') tenantId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.financialService.getBalance(
      tenantId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  @Get('cash-flow')
  @ApiOperation({ summary: 'Fluxo de caixa mensal' })
  @ApiQuery({ name: 'months', required: false })
  getCashFlow(@CurrentUser('tenantId') tenantId: string, @Query('months') months?: number) {
    return this.financialService.getCashFlow(tenantId, months);
  }

  @Get('pending')
  @ApiOperation({ summary: 'Transações pendentes (atrasadas, hoje, próximas)' })
  getPendingTransactions(@CurrentUser('tenantId') tenantId: string) {
    return this.financialService.getPendingTransactions(tenantId);
  }

  @Get('expenses-by-category')
  @ApiOperation({ summary: 'Despesas agrupadas por categoria' })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  getExpensesByCategory(
    @CurrentUser('tenantId') tenantId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.financialService.getExpensesByCategory(
      tenantId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  @Get('dashboard')
  @ApiOperation({ summary: 'Resumo financeiro para dashboard' })
  getDashboardSummary(@CurrentUser('tenantId') tenantId: string) {
    return this.financialService.getDashboardSummary(tenantId);
  }
}
