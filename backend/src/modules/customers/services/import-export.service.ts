import { Injectable, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import * as ExcelJS from "exceljs";
import { Readable } from "stream";

@Injectable()
export class CustomerImportExportService {
  constructor(private prisma: PrismaService) {}

  async getImportTemplate(tenantId: string): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Clientes");

    // Definir colunas
    worksheet.columns = [
      { header: "Nome*", key: "name", width: 30 },
      { header: "Tipo", key: "type", width: 10 },
      { header: "Email", key: "email", width: 30 },
      { header: "Telefone", key: "phone", width: 15 },
      { header: "WhatsApp", key: "whatsapp", width: 15 },
      { header: "CPF/CNPJ", key: "cpfCnpj", width: 20 },
      { header: "RG", key: "rg", width: 15 },
      { header: "Data Nascimento", key: "birthDate", width: 15 },
      { header: "Gênero", key: "gender", width: 10 },
      { header: "Endereço", key: "address", width: 30 },
      { header: "Número", key: "number", width: 10 },
      { header: "Complemento", key: "complement", width: 20 },
      { header: "Bairro", key: "neighborhood", width: 20 },
      { header: "Cidade", key: "city", width: 20 },
      { header: "Estado", key: "state", width: 10 },
      { header: "CEP", key: "zipCode", width: 10 },
      { header: "Observações", key: "notes", width: 30 },
      { header: "Tags", key: "tags", width: 20 },
      { header: "Ativo", key: "isActive", width: 10 },
    ];

    // Adicionar linha de exemplo
    worksheet.addRow({
      name: "João Silva",
      type: "PF",
      email: "joao@email.com",
      phone: "48999999999",
      whatsapp: "48999999999",
      cpfCnpj: "000.000.000-00",
      rg: "0000000",
      birthDate: "1990-01-01",
      gender: "M",
      address: "Rua Exemplo",
      number: "123",
      complement: "Apto 101",
      neighborhood: "Centro",
      city: "Florianópolis",
      state: "SC",
      zipCode: "88000-000",
      notes: "Cliente VIP",
      tags: "vip,atacado",
      isActive: "Sim",
    });

    // Estilizar cabeçalho
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE6E6FA" },
    };

    // Adicionar comentários explicativos
    worksheet.getCell("A1").note = "Campo obrigatório";
    worksheet.getCell("B1").note = "PF (Pessoa Física) ou PJ (Pessoa Jurídica)";
    worksheet.getCell("H1").note = "Formato: YYYY-MM-DD";
    worksheet.getCell("I1").note = "M (Masculino), F (Feminino) ou O (Outro)";
    worksheet.getCell("R1").note = "Separar por vírgula";
    worksheet.getCell("S1").note = "Sim ou Não";

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  async importCustomers(
    tenantId: string,
    fileBuffer: Buffer,
    options: { updateExisting?: boolean } = {},
  ): Promise<{
    imported: number;
    updated: number;
    errors: string[];
    totalRows: number;
  }> {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(fileBuffer as any);

    const worksheet = workbook.getWorksheet(1);
    if (!worksheet) {
      throw new BadRequestException("Planilha não encontrada");
    }

    const rows = worksheet.getSheetValues();
    if (!rows || rows.length < 2) {
      throw new BadRequestException(
        "Arquivo deve conter pelo menos o cabeçalho e uma linha de dados",
      );
    }

    let imported = 0;
    let updated = 0;
    const errors: string[] = [];
    const totalRows = rows.length - 1; // Excluindo cabeçalho

    // Processar cada linha (pulando cabeçalho)
    for (let i = 2; i <= rows.length; i++) {
      try {
        const row = rows[i - 1];
        if (!row || !row[1]) continue; // Linha vazia

        const customerData = {
          name: row[1]?.toString().trim(),
          type: row[2]?.toString().trim() || "PF",
          email: row[3]?.toString().trim() || undefined,
          phone: row[4]?.toString().trim() || undefined,
          whatsapp: row[5]?.toString().trim() || undefined,
          cpfCnpj: row[6]?.toString().trim() || undefined,
          rg: row[7]?.toString().trim() || undefined,
          birthDate: row[8] ? new Date(row[8].toString()) : undefined,
          gender: row[9]?.toString().trim() || undefined,
          address: row[10]?.toString().trim() || undefined,
          number: row[11]?.toString().trim() || undefined,
          complement: row[12]?.toString().trim() || undefined,
          neighborhood: row[13]?.toString().trim() || undefined,
          city: row[14]?.toString().trim() || undefined,
          state: row[15]?.toString().trim() || undefined,
          zipCode: row[16]?.toString().trim() || undefined,
          notes: row[17]?.toString().trim() || undefined,
          tags: row[18]?.toString().trim()
            ? row[18]
                .toString()
                .split(",")
                .map((tag) => tag.trim())
            : [],
          isActive:
            row[19]?.toString().toLowerCase() === "sim" ||
            row[19]?.toString().toLowerCase() === "true",
        };

        // Validações básicas
        if (!customerData.name) {
          errors.push(`Linha ${i}: Nome é obrigatório`);
          continue;
        }

        // Verificar se já existe
        let existingCustomer: any = null;
        if (customerData.cpfCnpj) {
          existingCustomer = await this.prisma.customer.findFirst({
            where: {
              tenantId,
              cpfCnpj: customerData.cpfCnpj,
            },
          });
        }

        if (existingCustomer && options.updateExisting) {
          // Atualizar cliente existente
          await this.prisma.customer.update({
            where: { id: existingCustomer.id },
            data: {
              ...customerData,
              tags:
                customerData.tags.length > 0
                  ? JSON.stringify(customerData.tags)
                  : "[]",
            },
          });
          updated++;
        } else if (!existingCustomer) {
          // Criar novo cliente
          await this.prisma.customer.create({
            data: {
              ...customerData,
              tenantId,
              tags: JSON.stringify(customerData.tags),
            },
          });
          imported++;
        } else {
          errors.push(
            `Linha ${i}: Cliente com CPF/CNPJ ${customerData.cpfCnpj} já existe`,
          );
        }
      } catch (error) {
        errors.push(`Linha ${i}: ${error.message}`);
      }
    }

    return { imported, updated, errors, totalRows };
  }

  async exportCustomers(
    tenantId: string,
    options: { format?: "xlsx" | "csv"; activeOnly?: boolean } = {},
  ): Promise<Buffer> {
    const { format = "xlsx", activeOnly = false } = options;

    const where: any = { tenantId };
    if (activeOnly) {
      where.isActive = true;
    }

    const customers = await this.prisma.customer.findMany({
      where,
      orderBy: { name: "asc" },
    });

    if (format === "csv") {
      return this.generateCsv(customers);
    } else {
      return this.generateExcel(customers);
    }
  }

  private async generateExcel(customers: any[]): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Clientes");

    worksheet.columns = [
      { header: "Nome", key: "name", width: 30 },
      { header: "Tipo", key: "type", width: 10 },
      { header: "Email", key: "email", width: 30 },
      { header: "Telefone", key: "phone", width: 15 },
      { header: "WhatsApp", key: "whatsapp", width: 15 },
      { header: "CPF/CNPJ", key: "cpfCnpj", width: 20 },
      { header: "RG", key: "rg", width: 15 },
      { header: "Data Nascimento", key: "birthDate", width: 15 },
      { header: "Gênero", key: "gender", width: 10 },
      { header: "Endereço", key: "address", width: 30 },
      { header: "Número", key: "number", width: 10 },
      { header: "Complemento", key: "complement", width: 20 },
      { header: "Bairro", key: "neighborhood", width: 20 },
      { header: "Cidade", key: "city", width: 20 },
      { header: "Estado", key: "state", width: 10 },
      { header: "CEP", key: "zipCode", width: 10 },
      { header: "Observações", key: "notes", width: 30 },
      { header: "Tags", key: "tags", width: 20 },
      { header: "Ativo", key: "isActive", width: 10 },
      { header: "Pontos", key: "points", width: 10 },
      { header: "Total Gasto", key: "totalSpent", width: 15 },
      { header: "Última Compra", key: "lastPurchase", width: 15 },
      { header: "Data Cadastro", key: "createdAt", width: 15 },
    ];

    customers.forEach((customer) => {
      worksheet.addRow({
        name: customer.name,
        type: customer.type,
        email: customer.email,
        phone: customer.phone,
        whatsapp: customer.whatsapp,
        cpfCnpj: customer.cpfCnpj,
        rg: customer.rg,
        birthDate: customer.birthDate
          ? new Date(customer.birthDate).toISOString().split("T")[0]
          : "",
        gender: customer.gender,
        address: customer.address,
        number: customer.number,
        complement: customer.complement,
        neighborhood: customer.neighborhood,
        city: customer.city,
        state: customer.state,
        zipCode: customer.zipCode,
        notes: customer.notes,
        tags: Array.isArray(customer.tags)
          ? customer.tags.join(", ")
          : customer.tags,
        isActive: customer.isActive ? "Sim" : "Não",
        points: customer.points,
        totalSpent: customer.totalSpent,
        lastPurchase: customer.lastPurchase
          ? new Date(customer.lastPurchase).toISOString().split("T")[0]
          : "",
        createdAt: new Date(customer.createdAt).toISOString().split("T")[0],
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  private generateCsv(customers: any[]): Buffer {
    const headers = [
      "Nome",
      "Tipo",
      "Email",
      "Telefone",
      "WhatsApp",
      "CPF/CNPJ",
      "RG",
      "Data Nascimento",
      "Gênero",
      "Endereço",
      "Número",
      "Complemento",
      "Bairro",
      "Cidade",
      "Estado",
      "CEP",
      "Observações",
      "Tags",
      "Ativo",
      "Pontos",
      "Total Gasto",
      "Última Compra",
      "Data Cadastro",
    ];

    const rows = customers.map((customer) => [
      customer.name,
      customer.type,
      customer.email || "",
      customer.phone || "",
      customer.whatsapp || "",
      customer.cpfCnpj || "",
      customer.rg || "",
      customer.birthDate
        ? new Date(customer.birthDate).toISOString().split("T")[0]
        : "",
      customer.gender || "",
      customer.address || "",
      customer.number || "",
      customer.complement || "",
      customer.neighborhood || "",
      customer.city || "",
      customer.state || "",
      customer.zipCode || "",
      customer.notes || "",
      Array.isArray(customer.tags)
        ? customer.tags.join("; ")
        : customer.tags || "",
      customer.isActive ? "Sim" : "Não",
      customer.points,
      customer.totalSpent,
      customer.lastPurchase
        ? new Date(customer.lastPurchase).toISOString().split("T")[0]
        : "",
      new Date(customer.createdAt).toISOString().split("T")[0],
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map((field) => `"${field}"`).join(","))
      .join("\n");

    return Buffer.from(csvContent, "utf-8");
  }
}
