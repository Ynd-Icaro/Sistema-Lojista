"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt = require("bcrypt");
const UserRole = {
    ADMIN: 'ADMIN',
    MANAGER: 'MANAGER',
    SELLER: 'SELLER',
    VIEWER: 'VIEWER',
};
const UserStatus = {
    ACTIVE: 'ACTIVE',
    INACTIVE: 'INACTIVE',
    SUSPENDED: 'SUSPENDED',
};
const TransactionType = {
    INCOME: 'INCOME',
    EXPENSE: 'EXPENSE',
};
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('🌱 Iniciando seed do banco de dados...\n');
    const tenant = await prisma.tenant.upsert({
        where: { slug: 'loja-demo' },
        update: {},
        create: {
            name: 'Loja Demo SmartFlux',
            slug: 'loja-demo',
            cnpj: '12.345.678/0001-90',
            email: 'contato@lojademo.com',
            phone: '(11) 99999-9999',
            address: 'Rua das Flores, 123',
            city: 'São Paulo',
            state: 'SP',
            zipCode: '01234-567',
            logo: null,
            isActive: true,
            settings: {
                primaryColor: '#3B82F6',
                secondaryColor: '#1E40AF',
                plan: 'PROFESSIONAL',
                warrantyDays: 90,
                loyaltyPointsPerReal: 1,
                loyaltyPointsValue: 0.10,
                invoicePrefix: 'NF',
                invoiceNextNumber: 1,
            },
        },
    });
    console.log(`✅ Tenant criado: ${tenant.name}`);
    const hashedPassword = await bcrypt.hash('Admin@123', 10);
    const adminUser = await prisma.user.upsert({
        where: {
            tenantId_email: {
                tenantId: tenant.id,
                email: 'admin@lojademo.com'
            }
        },
        update: {},
        create: {
            email: 'admin@lojademo.com',
            password: hashedPassword,
            name: 'Administrador',
            phone: '(11) 99999-9999',
            role: UserRole.ADMIN,
            status: UserStatus.ACTIVE,
            tenantId: tenant.id,
        },
    });
    console.log(`✅ Usuário admin criado: ${adminUser.email}`);
    const sellerPassword = await bcrypt.hash('Vendedor@123', 10);
    const sellerUser = await prisma.user.upsert({
        where: {
            tenantId_email: {
                tenantId: tenant.id,
                email: 'vendedor@lojademo.com'
            }
        },
        update: {},
        create: {
            email: 'vendedor@lojademo.com',
            password: sellerPassword,
            name: 'Vendedor Demo',
            phone: '(11) 98888-8888',
            role: UserRole.SELLER,
            status: UserStatus.ACTIVE,
            tenantId: tenant.id,
        },
    });
    console.log(`✅ Usuário vendedor criado: ${sellerUser.email}`);
    const categories = [
        { name: 'Eletrônicos', description: 'Produtos eletrônicos em geral' },
        { name: 'Smartphones', description: 'Celulares e acessórios' },
        { name: 'Acessórios', description: 'Acessórios diversos' },
        { name: 'Computadores', description: 'Notebooks, desktops e componentes' },
        { name: 'Games', description: 'Consoles e jogos' },
    ];
    const createdCategories = [];
    for (const cat of categories) {
        const category = await prisma.category.create({
            data: {
                ...cat,
                tenantId: tenant.id,
            },
        });
        createdCategories.push(category);
    }
    console.log(`✅ ${createdCategories.length} categorias criadas`);
    const products = [
        {
            name: 'iPhone 15 Pro Max 256GB',
            sku: 'IPH15PM256',
            barcode: '7891234567890',
            description: 'Apple iPhone 15 Pro Max com 256GB de armazenamento',
            costPrice: 6500.00,
            salePrice: 8999.00,
            stock: 15,
            minStock: 5,
            categoryId: createdCategories[1].id,
        },
        {
            name: 'Samsung Galaxy S24 Ultra',
            sku: 'SAMS24U',
            barcode: '7891234567891',
            description: 'Samsung Galaxy S24 Ultra 256GB',
            costPrice: 5800.00,
            salePrice: 7999.00,
            stock: 12,
            minStock: 4,
            categoryId: createdCategories[1].id,
        },
        {
            name: 'MacBook Pro 14" M3 Pro',
            sku: 'MBPM3PRO14',
            barcode: '7891234567892',
            description: 'MacBook Pro 14 polegadas com chip M3 Pro',
            costPrice: 14000.00,
            salePrice: 18999.00,
            stock: 8,
            minStock: 2,
            categoryId: createdCategories[3].id,
        },
        {
            name: 'AirPods Pro 2',
            sku: 'AIRPODSP2',
            barcode: '7891234567893',
            description: 'Apple AirPods Pro 2ª geração',
            costPrice: 1200.00,
            salePrice: 1899.00,
            stock: 30,
            minStock: 10,
            categoryId: createdCategories[2].id,
        },
        {
            name: 'PlayStation 5 Slim',
            sku: 'PS5SLIM',
            barcode: '7891234567894',
            description: 'Console PlayStation 5 Slim 1TB',
            costPrice: 3200.00,
            salePrice: 4299.00,
            stock: 6,
            minStock: 2,
            categoryId: createdCategories[4].id,
        },
        {
            name: 'Xbox Series X',
            sku: 'XBXSERIESX',
            barcode: '7891234567895',
            description: 'Console Xbox Series X 1TB',
            costPrice: 3000.00,
            salePrice: 3999.00,
            stock: 5,
            minStock: 2,
            categoryId: createdCategories[4].id,
        },
        {
            name: 'Carregador USB-C 20W Apple',
            sku: 'CHGUSBC20W',
            barcode: '7891234567896',
            description: 'Carregador Apple USB-C 20W',
            costPrice: 80.00,
            salePrice: 149.00,
            stock: 50,
            minStock: 10,
            categoryId: createdCategories[2].id,
        },
        {
            name: 'Cabo Lightning 1m Original',
            sku: 'CBLLIGHT1M',
            barcode: '7891234567897',
            description: 'Cabo Lightning Apple original 1 metro',
            costPrice: 35.00,
            salePrice: 79.00,
            stock: 100,
            minStock: 20,
            categoryId: createdCategories[2].id,
        },
        {
            name: 'Monitor LG UltraWide 34"',
            sku: 'MONLG34UW',
            barcode: '7891234567898',
            description: 'Monitor LG UltraWide 34 polegadas Curvo',
            costPrice: 2200.00,
            salePrice: 3299.00,
            stock: 4,
            minStock: 1,
            categoryId: createdCategories[0].id,
        },
        {
            name: 'Teclado Mecânico Logitech G Pro',
            sku: 'TECLGPRO',
            barcode: '7891234567899',
            description: 'Teclado mecânico gamer Logitech G Pro',
            costPrice: 600.00,
            salePrice: 899.00,
            stock: 12,
            minStock: 3,
            categoryId: createdCategories[0].id,
        },
    ];
    for (const prod of products) {
        await prisma.product.create({
            data: {
                ...prod,
                tenantId: tenant.id,
            },
        });
    }
    console.log(`✅ ${products.length} produtos criados`);
    const customers = [
        {
            name: 'João Silva',
            email: 'joao.silva@email.com',
            phone: '(11) 99999-1111',
            cpfCnpj: '123.456.789-00',
            address: 'Rua das Palmeiras, 456',
            city: 'São Paulo',
            state: 'SP',
            zipCode: '01234-000',
        },
        {
            name: 'Maria Santos',
            email: 'maria.santos@email.com',
            phone: '(11) 99999-2222',
            cpfCnpj: '987.654.321-00',
            address: 'Av. Brasil, 789',
            city: 'São Paulo',
            state: 'SP',
            zipCode: '02345-000',
        },
        {
            name: 'Carlos Oliveira',
            email: 'carlos.oliveira@email.com',
            phone: '(11) 99999-3333',
            cpfCnpj: '456.789.123-00',
            address: 'Rua das Acácias, 321',
            city: 'Campinas',
            state: 'SP',
            zipCode: '13000-000',
        },
        {
            name: 'Ana Paula Costa',
            email: 'ana.costa@email.com',
            phone: '(11) 99999-4444',
            cpfCnpj: '789.123.456-00',
            address: 'Av. Paulista, 1000',
            city: 'São Paulo',
            state: 'SP',
            zipCode: '01310-100',
        },
        {
            name: 'Pedro Mendes',
            email: 'pedro.mendes@email.com',
            phone: '(11) 99999-5555',
            cpfCnpj: '321.654.987-00',
            address: 'Rua Oscar Freire, 200',
            city: 'São Paulo',
            state: 'SP',
            zipCode: '01426-000',
        },
    ];
    for (const cust of customers) {
        await prisma.customer.create({
            data: {
                ...cust,
                tenantId: tenant.id,
            },
        });
    }
    console.log(`✅ ${customers.length} clientes criados`);
    const transactionCategories = [
        { name: 'Vendas', type: TransactionType.INCOME, color: '#22C55E', icon: 'shopping-cart' },
        { name: 'Serviços', type: TransactionType.INCOME, color: '#3B82F6', icon: 'wrench' },
        { name: 'Outros Recebimentos', type: TransactionType.INCOME, color: '#8B5CF6', icon: 'plus-circle' },
        { name: 'Fornecedores', type: TransactionType.EXPENSE, color: '#EF4444', icon: 'truck' },
        { name: 'Aluguel', type: TransactionType.EXPENSE, color: '#F97316', icon: 'home' },
        { name: 'Energia/Água', type: TransactionType.EXPENSE, color: '#FBBF24', icon: 'zap' },
        { name: 'Salários', type: TransactionType.EXPENSE, color: '#EC4899', icon: 'users' },
        { name: 'Marketing', type: TransactionType.EXPENSE, color: '#06B6D4', icon: 'megaphone' },
        { name: 'Manutenção', type: TransactionType.EXPENSE, color: '#84CC16', icon: 'tool' },
        { name: 'Outras Despesas', type: TransactionType.EXPENSE, color: '#6B7280', icon: 'minus-circle' },
    ];
    for (const cat of transactionCategories) {
        await prisma.transactionCategory.create({
            data: {
                ...cat,
                tenantId: tenant.id,
            },
        });
    }
    console.log(`✅ ${transactionCategories.length} categorias financeiras criadas`);
    console.log('\n✨ Seed concluído com sucesso!\n');
    console.log('📧 Credenciais de acesso:');
    console.log('   Admin: admin@lojademo.com / Admin@123');
    console.log('   Vendedor: vendedor@lojademo.com / Vendedor@123');
}
main()
    .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map