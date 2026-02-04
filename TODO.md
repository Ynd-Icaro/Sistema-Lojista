# 🔧 SmartFlux ERP - TODO Técnico

## 🎯 **Próximas Implementações Técnicas**

### 📊 **Dashboard APIs** (Prioridade Alta)

**Arquivos a criar/modificar:**
- `backend/src/modules/dashboard/dashboard.service.ts`
- `backend/src/modules/dashboard/dashboard.controller.ts`

**Endpoints necessários:**
```typescript
// GET /api/dashboard/overview
async getOverview(tenantId: string) {
  return {
    totalSales: number,
    totalRevenue: number,
    totalCustomers: number,
    totalProducts: number,
    monthlyGrowth: number,
    pendingOrders: number
  }
}

// GET /api/dashboard/sales-chart
async getSalesChart(tenantId: string, period: '7d' | '30d' | '90d') {
  // Retornar dados para gráfico de vendas
}

// GET /api/dashboard/top-products
async getTopProducts(tenantId: string, limit: number = 10) {
  // Produtos mais vendidos
}
```

---

### 📦 **Produtos - CRUD Completo**

**Backend:**
- `backend/src/modules/products/products.service.ts` - implementar métodos
- `backend/src/modules/products/products.controller.ts` - completar endpoints
- `backend/src/modules/products/dto/product.dto.ts` - DTOs completos

**Frontend:**
- `frontend/src/app/dashboard/products/page.tsx` - listagem
- `frontend/src/app/dashboard/products/create/page.tsx` - criação
- `frontend/src/components/products/ProductForm.tsx` - formulário
- `frontend/src/components/products/ProductList.tsx` - tabela

**Funcionalidades:**
- [ ] Upload de múltiplas imagens
- [ ] Sistema de variações (tamanho, cor)
- [ ] Controle de estoque por variação
- [ ] Códigos de barras
- [ ] Categorias e subcategorias

---

### 👥 **Clientes - CRUD Completo**

**Backend:**
- `backend/src/modules/customers/customers.service.ts`
- `backend/src/modules/customers/customers.controller.ts`
- Sistema de pontos/fidelidade

**Frontend:**
- `frontend/src/app/dashboard/customers/page.tsx`
- `frontend/src/components/customers/CustomerForm.tsx`
- `frontend/src/components/customers/CustomerList.tsx`

---

### 💰 **Vendas - Sistema Básico**

**Backend:**
- `backend/src/modules/sales/sales.service.ts`
- `backend/src/modules/sales/sales.controller.ts`
- Validação de estoque em tempo real
- Cálculo de totais e descontos

**Frontend:**
- `frontend/src/app/dashboard/sales/page.tsx`
- `frontend/src/components/sales/SaleForm.tsx`
- `frontend/src/components/sales/Cart.tsx`
- Interface tipo PDV

---

### 🔍 **Busca e Filtros**

**Implementar em todos os módulos:**
- Busca por texto
- Filtros avançados
- Ordenação
- Paginação consistente
- Exportação para Excel

---

### 🎨 **UI/UX Melhorias**

**Componentes globais:**
- `frontend/src/components/ui/Loading.tsx` - loading states
- `frontend/src/components/ui/ErrorBoundary.tsx` - tratamento de erros
- `frontend/src/components/ui/DataTable.tsx` - tabela reutilizável
- `frontend/src/components/ui/SearchInput.tsx` - busca
- `frontend/src/components/ui/Pagination.tsx` - paginação

**Páginas:**
- Layout responsivo completo
- Tema consistente
- Notificações toast
- Modais padronizados

---

### 🔧 **Configurações Técnicas**

**Backend:**
- [ ] Configurar CORS corretamente
- [ ] Implementar rate limiting
- [ ] Logs estruturados
- [ ] Health checks completos
- [ ] Cache Redis básico

**Frontend:**
- [ ] Configurar React Query para cache
- [ ] Implementar error boundaries
- [ ] Loading states globais
- [ ] Form validation com react-hook-form + zod

---

### 🧪 **Testes**

**Backend:**
- [ ] Testes unitários com Jest
- [ ] Testes de integração
- [ ] Testes E2E com Supertest

**Frontend:**
- [ ] Testes de componentes com Testing Library
- [ ] Testes E2E com Playwright/Cypress

---

### 📚 **Documentação**

- [ ] API documentation completa com Swagger
- [ ] README atualizado
- [ ] Guia de desenvolvimento
- [ ] Documentação de deploy

---

## 🚀 **Próximos Passos Imediatos**

### **Dia 1-2: Dashboard**
1. Implementar APIs do dashboard
2. Criar componentes frontend básicos
3. Conectar dados e testar

### **Dia 3-5: Produtos**
1. Completar CRUD de produtos
2. Implementar upload de imagens
3. Criar interface de listagem

### **Dia 6-7: Clientes**
1. CRUD de clientes
2. Sistema de pontos
3. Interface responsiva

---

## 🔍 **Código a Revisar**

**Backend - Verificar implementação:**
- `src/modules/auth/` - validar fluxos
- `src/modules/tenants/` - multi-tenancy
- `src/common/filters/` - tratamento de erros
- `src/common/utils/` - utilitários

**Frontend - Verificar implementação:**
- `src/app/providers.tsx` - context providers
- `src/lib/api.ts` - cliente HTTP
- `src/hooks/` - custom hooks
- `src/store/` - estado global

---

## ⚠️ **Pontos de Atenção**

1. **Multi-tenancy:** Garantir isolamento de dados
2. **Performance:** Queries otimizadas no Prisma
3. **Segurança:** Validação em todas as entradas
4. **UX:** Interface intuitiva e responsiva
5. **Testes:** Cobertura mínima de 70%

---

*Última atualização: Fevereiro 2026*</content>
<parameter name="filePath">c:\www\smartflux-erp\TODO.md