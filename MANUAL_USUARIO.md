# 📖 SmartFlux ERP - Manual do Usuário

**Versão:** 1.0.0  
**Data:** Janeiro 2026

---

## 🎉 Bem-vindo ao SmartFlux ERP!

Este manual foi criado para ajudá-lo a utilizar todas as funcionalidades do sistema de forma simples e eficiente. Siga as instruções passo a passo e aproveite ao máximo o seu sistema de gestão.

---

## 📑 Índice

1. [Primeiros Passos](#1-primeiros-passos)
2. [Navegando no Sistema](#2-navegando-no-sistema)
3. [Cadastrando Categorias](#3-cadastrando-categorias)
4. [Cadastrando Produtos](#4-cadastrando-produtos)
5. [Importando Produtos do Excel](#5-importando-produtos-do-excel)
6. [Cadastrando Clientes](#6-cadastrando-clientes)
7. [Realizando Vendas no PDV](#7-realizando-vendas-no-pdv)
8. [Gerenciando Vendas](#8-gerenciando-vendas)
9. [Ordens de Serviço](#9-ordens-de-serviço)
10. [Controle Financeiro](#10-controle-financeiro)
11. [Emitindo Notas Fiscais](#11-emitindo-notas-fiscais)
12. [Relatórios](#12-relatórios)
13. [Configurações](#13-configurações)
14. [Perguntas Frequentes](#14-perguntas-frequentes)

---

## 1. Primeiros Passos

### 1.1 Criando sua Conta

1. Acesse o sistema pelo navegador
2. Clique em **"Criar conta"**
3. Preencha os dados:
   - **Nome da Empresa**: O nome do seu negócio
   - **Seu Nome**: Seu nome completo
   - **Email**: Seu email de acesso
   - **Senha**: Crie uma senha segura (mínimo 6 caracteres)
4. Clique em **"Registrar"**

> 💡 **Dica**: Use um email que você acessa frequentemente, pois ele será usado para recuperação de senha e notificações.

### 1.2 Fazendo Login

1. Acesse a página de login
2. Digite seu **email** e **senha**
3. Clique em **"Entrar"**
4. Você será direcionado ao Dashboard

### 1.3 Recuperando a Senha

1. Na tela de login, clique em **"Esqueci minha senha"**
2. Digite seu email cadastrado
3. Verifique sua caixa de entrada
4. Clique no link recebido
5. Defina uma nova senha

---

## 2. Navegando no Sistema

### 2.1 Menu Lateral

O menu lateral é sua principal forma de navegação:

| Ícone | Menu | O que faz |
|-------|------|-----------|
| 🏠 | Dashboard | Visão geral do negócio |
| 📦 | Produtos | Gerenciar produtos |
| 📂 | Categorias | Organizar produtos |
| 👥 | Clientes | Cadastro de clientes |
| 🛒 | PDV | Ponto de venda |
| 📋 | Vendas | Histórico de vendas |
| 🔧 | Ordens de Serviço | Gerenciar serviços |
| 💰 | Financeiro | Receitas e despesas |
| 📄 | Notas Fiscais | Emissão de NF |
| 📊 | Relatórios | Análises e exportações |
| ⚙️ | Configurações | Dados da empresa |

### 2.2 Barra Superior

- **🔔 Notificações**: Alertas do sistema
- **🌙 Modo Escuro**: Alternar tema claro/escuro
- **👤 Perfil**: Suas configurações e logout

### 2.3 Atalhos de Teclado

| Atalho | Ação |
|--------|------|
| `Ctrl + K` | Busca rápida |
| `Ctrl + N` | Novo cadastro |
| `Esc` | Fechar modal |

---

## 3. Cadastrando Categorias

### 3.1 Por que usar categorias?

As categorias organizam seus produtos e facilitam:
- Encontrar produtos no PDV
- Gerar relatórios por segmento
- Organizar seu estoque

### 3.2 Criando uma Categoria

1. No menu lateral, clique em **"Categorias"**
2. Clique no botão **"+ Nova Categoria"**
3. Preencha:
   - **Nome**: Ex: "Eletrônicos", "Vestuário", "Alimentos"
   - **Descrição**: Breve descrição (opcional)
4. Clique em **"Salvar"**

### 3.3 Criando Subcategorias

Para criar uma categoria dentro de outra:

1. Siga os passos acima
2. No campo **"Categoria Pai"**, selecione a categoria principal
3. Salve

**Exemplo de estrutura:**
```
📂 Vestuário
   ├── 👕 Camisetas
   ├── 👖 Calças
   └── 👟 Calçados
```

### 3.4 Editando e Excluindo

- **Editar**: Clique no ícone de lápis ✏️ na linha da categoria
- **Excluir**: Clique no ícone de lixeira 🗑️

> ⚠️ **Atenção**: Só é possível excluir categorias que não possuem produtos vinculados.

---

## 4. Cadastrando Produtos

### 4.1 Cadastro Básico

1. No menu, clique em **"Produtos"**
2. Clique em **"+ Novo Produto"**
3. Preencha os campos obrigatórios:

| Campo | Descrição | Exemplo |
|-------|-----------|---------|
| **Nome** | Nome do produto | Camiseta Preta P |
| **SKU** | Código único | CAM-001-P |
| **Preço de Venda** | Quanto você vende | R$ 49,90 |
| **Categoria** | Onde se encaixa | Vestuário |

4. Campos opcionais recomendados:

| Campo | Descrição |
|-------|-----------|
| **Preço de Custo** | Quanto você paga |
| **Estoque** | Quantidade disponível |
| **Estoque Mínimo** | Quando alertar |
| **Código de Barras** | Para leitura no PDV |
| **NCM** | Código fiscal para NF |

5. Clique em **"Salvar"**

### 4.2 Entendendo os Cards de Indicadores

Na tela de produtos, você verá 4 cards no topo:

| Card | Significado |
|------|-------------|
| 📦 **Total de Produtos** | Quantidade total cadastrada |
| 💰 **Valor em Estoque** | Soma do estoque × preço de custo |
| ⚠️ **Estoque Baixo** | Produtos abaixo do mínimo |
| 📋 **Para Revisar** | Produtos importados com dados incompletos |

### 4.3 Filtros e Busca

- **Busca**: Digite nome, SKU ou código de barras
- **Filtro por Categoria**: Selecione no dropdown
- **Filtro por Status**: Ativos, inativos ou todos
- **Estoque Baixo**: Clique no card para filtrar

### 4.4 Editando Produtos

1. Localize o produto na lista
2. Clique no ícone de lápis ✏️ ou no nome do produto
3. Faça as alterações
4. Clique em **"Salvar"**

---

## 5. Importando Produtos do Excel

### 5.1 Quando usar importação?

Use quando tiver muitos produtos para cadastrar de uma vez, como:
- Carga inicial do sistema
- Novos produtos do fornecedor
- Atualização em massa

### 5.2 Passo a Passo

**Passo 1: Baixar o modelo**
1. Na tela de Produtos, clique em **"Importar"**
2. Clique em **"📥 Baixar Modelo"**
3. Um arquivo Excel será baixado

**Passo 2: Preencher a planilha**

Abra o arquivo no Excel e preencha:

| Coluna | Obrigatório | Descrição |
|--------|-------------|-----------|
| SKU | ✅ Sim | Código único |
| Nome | ✅ Sim | Nome do produto |
| Preço Venda | ✅ Sim | Preço de venda |
| Preço Custo | Não | Preço de custo |
| Estoque | Não | Quantidade |
| Estoque Mínimo | Não | Mínimo para alerta |
| Código de Barras | Não | EAN/GTIN |
| Categoria | Não | Nome da categoria |
| Fornecedor | Não | Nome do fornecedor |
| Marca | Não | Marca do produto |
| NCM | Não | Código fiscal |

> 💡 **Dica**: Não altere os nomes das colunas!

**Passo 3: Fazer upload**
1. Clique em **"📤 Selecionar Arquivo"**
2. Escolha sua planilha preenchida
3. Aguarde o processamento

**Passo 4: Verificar resultado**

O sistema mostrará:
- ✅ **Criados**: Novos produtos cadastrados
- 🔄 **Atualizados**: Produtos existentes atualizados (mesmo SKU)
- ⚠️ **Para Revisar**: Produtos com dados incompletos
- ❌ **Erros**: Produtos que não puderam ser importados

### 5.3 Revisando Produtos Importados

1. Clique no card **"Para Revisar"** ou acesse o menu **Produtos > Revisar**
2. Você verá os produtos que precisam de atenção
3. Clique em cada um para completar os dados
4. Após completar, o produto sai da lista de revisão

---

## 6. Cadastrando Clientes

### 6.1 Cadastro de Cliente

1. No menu, clique em **"Clientes"**
2. Clique em **"+ Novo Cliente"**
3. Preencha os dados:

**Dados Básicos:**
| Campo | Descrição |
|-------|-----------|
| Nome/Razão Social | Nome completo ou da empresa |
| CPF/CNPJ | Documento (validado automaticamente) |
| Email | Para envio de notas e comunicações |
| Telefone | Contato principal |

**Endereço (com busca automática):**
| Campo | Descrição |
|-------|-----------|
| CEP | Digite e clique em 🔍 para buscar |
| Rua | Preenchido automaticamente |
| Número | Informe manualmente |
| Bairro | Preenchido automaticamente |
| Cidade | Preenchido automaticamente |
| Estado | Preenchido automaticamente |

4. Clique em **"Salvar"**

### 6.2 Busca de CEP Automática

O sistema busca o endereço automaticamente:

1. Digite o **CEP** no campo
2. Clique no ícone 🔍 ou pressione **Tab**
3. Os campos de endereço serão preenchidos
4. Complete apenas o **número** e **complemento**

> 💡 **Dica**: Isso funciona para CEPs de todo o Brasil!

### 6.3 Pontos de Fidelidade

Cada cliente acumula pontos baseado nas compras:
- A cada R$ 1,00 gasto = 1 ponto
- Os pontos podem ser consultados na ficha do cliente

---

## 7. Realizando Vendas no PDV

### 7.1 Acessando o PDV

1. No menu, clique em **"PDV"**
2. Você verá a tela de venda

### 7.2 Adicionando Produtos

**Método 1: Busca por nome**
1. No campo de busca, digite o nome do produto
2. Clique no produto desejado

**Método 2: Código de barras**
1. Posicione o cursor no campo de busca
2. Escaneie o código de barras com leitor
3. O produto é adicionado automaticamente

**Método 3: SKU**
1. Digite o SKU do produto
2. Pressione Enter

### 7.3 Ajustando Quantidades

- Use os botões **+** e **-** ao lado do item
- Ou clique na quantidade e digite o valor desejado

### 7.4 Removendo Itens

- Clique no ícone de lixeira 🗑️ ao lado do item

### 7.5 Aplicando Desconto

1. No campo **"Desconto"**, digite o valor
2. Escolha se é em **R$** ou **%**
3. O total será atualizado automaticamente

### 7.6 Selecionando Cliente

1. Clique em **"Buscar cliente"**
2. Digite o nome, CPF ou telefone
3. Selecione o cliente na lista

> 💡 Se não encontrar, você pode cadastrar na hora clicando em **"+ Novo Cliente"**

### 7.7 Finalizando a Venda

1. Confira todos os itens e o total
2. Clique em **"💳 Finalizar Venda"**
3. Escolha a forma de pagamento:

| Forma | Como usar |
|-------|-----------|
| **💵 Dinheiro** | Informe o valor recebido, o troco é calculado |
| **💳 Crédito** | Selecione a quantidade de parcelas |
| **💳 Débito** | Pagamento à vista |
| **📱 PIX** | Mostre o QR Code ou copie o código |

4. Clique em **"✓ Confirmar Pagamento"**
5. Venda concluída! O estoque é atualizado automaticamente

### 7.8 Imprimindo Recibo

Após a venda:
1. Clique em **"🖨️ Imprimir Recibo"**
2. Escolha a impressora
3. Confirme

---

## 8. Gerenciando Vendas

### 8.1 Histórico de Vendas

1. No menu, clique em **"Vendas"**
2. Você verá todas as vendas realizadas

### 8.2 Filtrando Vendas

Use os filtros disponíveis:
- **Data**: Selecione o período
- **Status**: Pagas, canceladas, etc.
- **Cliente**: Busque por nome
- **Vendedor**: Filtre por quem vendeu

### 8.3 Visualizando Detalhes

1. Clique em uma venda na lista
2. Você verá:
   - Itens vendidos
   - Dados do cliente
   - Forma de pagamento
   - Vendedor responsável

### 8.4 Cancelando uma Venda

1. Acesse os detalhes da venda
2. Clique em **"❌ Cancelar Venda"**
3. Informe o motivo do cancelamento
4. Confirme

> ⚠️ **Importante**: Ao cancelar, o estoque é devolvido automaticamente.

### 8.5 Gerando Nota Fiscal

1. Acesse os detalhes da venda
2. Clique em **"📄 Gerar NF"**
3. Siga as instruções na seção de Notas Fiscais

---

## 9. Ordens de Serviço

### 9.1 Para quem é?

O módulo de O.S. é ideal para:
- Assistências técnicas
- Oficinas mecânicas
- Lavanderias
- Serviços de conserto em geral

### 9.2 Criando uma Ordem de Serviço

1. No menu, clique em **"Ordens de Serviço"**
2. Clique em **"+ Nova O.S."**
3. Preencha:

**Cliente:**
- Busque ou cadastre o cliente

**Equipamento/Produto:**
| Campo | Exemplo |
|-------|---------|
| Tipo | Notebook |
| Marca | Dell |
| Modelo | Inspiron 15 |
| Nº Série | ABC123 |

**Problema:**
- Descreva o que o cliente relatou

**Detalhes:**
| Campo | Descrição |
|-------|-----------|
| Prioridade | Normal, Alta ou Urgente |
| Previsão | Data estimada de conclusão |
| Técnico | Quem vai executar |
| Valor Estimado | Orçamento inicial |

4. Clique em **"Criar O.S."**

### 9.3 Acompanhando pelo Pipeline

O pipeline (quadro Kanban) mostra todas as O.S. organizadas por status:

| Coluna | Significado |
|--------|-------------|
| 📥 **Aguardando** | Aguardando início |
| 🔍 **Em Análise** | Técnico avaliando |
| 🔧 **Em Execução** | Serviço sendo feito |
| ✅ **Concluído** | Pronto para entrega |

**Para mover uma O.S.:**
- Arraste o card para outra coluna, ou
- Abra a O.S. e altere o status

### 9.4 Finalizando e Cobrando

1. Quando o serviço estiver pronto, mova para **"Concluído"**
2. O cliente será notificado (se configurado)
3. Na entrega, gere a cobrança clicando em **"💰 Gerar Venda"**

---

## 10. Controle Financeiro

### 10.1 Visão Geral

O módulo financeiro mostra:
- **Saldo Atual**: Receitas - Despesas
- **Receitas do Mês**: Total de entradas
- **Despesas do Mês**: Total de saídas

### 10.2 Registrando Receita

1. No menu, clique em **"Financeiro"**
2. Clique em **"+ Nova Receita"**
3. Preencha:
   - **Descrição**: Ex: "Pagamento cliente João"
   - **Categoria**: Ex: "Vendas"
   - **Valor**: O valor recebido
   - **Data**: Quando foi recebido
4. Clique em **"Salvar"**

> 💡 Vendas do PDV já criam receitas automaticamente!

### 10.3 Registrando Despesa

1. Clique em **"+ Nova Despesa"**
2. Preencha:
   - **Descrição**: Ex: "Conta de luz"
   - **Categoria**: Ex: "Utilidades"
   - **Valor**: O valor pago
   - **Data**: Quando foi pago
3. Clique em **"Salvar"**

### 10.4 Categorias Financeiras

Organize seus lançamentos em categorias:

**Receitas:**
- Vendas de Produtos
- Prestação de Serviços
- Outras Receitas

**Despesas:**
- Fornecedores
- Aluguel
- Salários
- Água/Luz/Internet
- Marketing
- Impostos

---

## 11. Emitindo Notas Fiscais

### 11.1 Configuração Inicial

Antes de emitir notas, configure sua empresa:

1. Acesse **Configurações > Dados da Empresa**
2. Preencha todos os dados fiscais:
   - CNPJ
   - Inscrição Estadual
   - Regime Tributário
   - Certificado Digital

### 11.2 Emitindo NF a partir de Venda

1. Acesse **Vendas**
2. Clique na venda desejada
3. Clique em **"📄 Gerar NF"**
4. O sistema preenche os dados automaticamente
5. Revise as informações
6. Clique em **"Emitir Nota Fiscal"**

### 11.3 Emitindo NF Manual

1. Acesse **Notas Fiscais**
2. Clique em **"+ Nova Nota"**
3. Escolha o tipo: **NF-e** (produto) ou **NFS-e** (serviço)
4. Preencha:
   - Dados do destinatário
   - Itens e valores
   - Impostos
5. Clique em **"Emitir"**

### 11.4 Após a Emissão

| Ação | Como fazer |
|------|------------|
| **Ver PDF** | Clique em "📄 Visualizar" |
| **Baixar XML** | Clique em "⬇️ Download" |
| **Enviar por Email** | Clique em "📧 Enviar" |
| **Imprimir** | Clique em "🖨️ Imprimir" |

### 11.5 Cancelando Nota Fiscal

1. Acesse a nota fiscal
2. Clique em **"❌ Cancelar Nota"**
3. Informe o motivo
4. Confirme

> ⚠️ **Importante**: Notas só podem ser canceladas em até 24 horas após a emissão.

---

## 12. Relatórios

### 12.1 Tipos de Relatórios

| Relatório | O que mostra |
|-----------|--------------|
| **Vendas** | Análise de vendas por período |
| **Produtos** | Produtos mais vendidos, estoque |
| **Clientes** | Melhores clientes, comportamento |
| **Financeiro** | Fluxo de caixa, lucros |

### 12.2 Gerando um Relatório

1. Acesse **Relatórios**
2. Escolha o tipo de relatório
3. Selecione o período
4. Clique em **"Gerar"**

### 12.3 Exportando

Você pode exportar os relatórios:
- **📊 Excel**: Para trabalhar os dados
- **📄 PDF**: Para imprimir ou enviar

---

## 13. Configurações

### 13.1 Dados da Empresa

Configure as informações do seu negócio:

1. Acesse **Configurações > Dados da Empresa**
2. Preencha/atualize:
   - Nome da empresa
   - CNPJ
   - Endereço completo
   - Logo
   - Dados fiscais

### 13.2 Convidando Usuários

Para adicionar funcionários ao sistema:

1. Acesse **Usuários**
2. Clique em **"+ Convidar Usuário"**
3. Digite o email do funcionário
4. Selecione o perfil:
   - **Gerente**: Quase tudo, exceto configurações
   - **Vendedor**: Apenas PDV e consultas
   - **Visualizador**: Apenas visualização
5. Clique em **"Enviar Convite"**

O funcionário receberá um email para criar a senha.

### 13.3 Alterando sua Senha

1. Clique no seu nome no canto superior direito
2. Acesse **"Meu Perfil"**
3. Clique em **"Alterar Senha"**
4. Digite a senha atual e a nova senha
5. Confirme

### 13.4 Modo Escuro

Para alternar entre tema claro e escuro:
- Clique no ícone 🌙 na barra superior

---

## 14. Perguntas Frequentes

### 14.1 Login e Acesso

**P: Esqueci minha senha, o que faço?**
R: Na tela de login, clique em "Esqueci minha senha" e siga as instruções.

**P: Posso acessar de outro computador?**
R: Sim! O sistema funciona em qualquer navegador com internet.

**P: Funciona no celular?**
R: Sim, o sistema é responsivo e funciona em smartphones e tablets.

### 14.2 Produtos

**P: Como faço para colocar foto nos produtos?**
R: Na edição do produto, clique em "Adicionar imagem" e faça upload.

**P: Posso ter produtos com o mesmo nome?**
R: Sim, mas cada um deve ter um SKU diferente.

**P: O que é NCM?**
R: É o código fiscal do produto, necessário para emissão de NF-e.

### 14.3 Vendas

**P: Posso vender sem selecionar cliente?**
R: Sim, a venda será registrada como "Consumidor Final".

**P: Como faço venda fiado?**
R: Use a forma de pagamento "A prazo" e acompanhe pelo Financeiro.

**P: Posso dividir o pagamento?**
R: Sim, escolha "Múltiplas formas" e divida como preferir.

### 14.4 Notas Fiscais

**P: Preciso de certificado digital?**
R: Sim, é obrigatório para emissão de NF-e.

**P: A nota não foi autorizada, o que faço?**
R: Verifique os erros apontados, corrija e tente novamente.

**P: Posso emitir nota de venda antiga?**
R: Sim, desde que os dados estejam completos.

### 14.5 Suporte

**P: Como entro em contato com o suporte?**
R: 
- Email: suporte@smartflux.com.br
- WhatsApp: (48) 99999-9999
- Chat no sistema (canto inferior direito)

---

## 🎓 Dicas Finais

1. **Faça backup**: Exporte relatórios periodicamente
2. **Mantenha cadastros atualizados**: Facilita emissão de NF
3. **Use categorias**: Organiza o negócio e melhora relatórios
4. **Monitore o estoque**: Configure alertas de estoque mínimo
5. **Treine sua equipe**: Todos devem conhecer o sistema

---

**Precisa de ajuda?**

📧 Email: suporte@smartflux.com.br  
📱 WhatsApp: (48) 99999-9999  
💬 Chat: Disponível no sistema

---

**SmartFlux ERP** - Simplifique sua gestão!
