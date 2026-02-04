import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import * as bcrypt from "bcrypt";
import { CreateUserDto, UpdateUserDto } from "./dto/user.dto";
import {
  UserRole,
  UserRoleType,
  UserStatus,
  UserStatusType,
} from "../../types";

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll(
    tenantId: string,
    page?: number | string,
    limit?: number | string,
    search?: string,
  ) {
    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 20;
    const skip = (pageNum - 1) * limitNum;

    const where: any = { tenantId };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limitNum,
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          avatar: true,
          role: true,
          status: true,
          lastLogin: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { name: "asc" },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: users,
      meta: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    };
  }

  async findOne(id: string, tenantId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, tenantId },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        avatar: true,
        role: true,
        status: true,
        settings: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException("Usuário não encontrado");
    }

    return user;
  }

  async findByEmail(email: string, tenantId: string) {
    return this.prisma.user.findFirst({
      where: { email, tenantId },
    });
  }

  async create(tenantId: string, dto: CreateUserDto) {
    const existingUser = await this.findByEmail(dto.email, tenantId);
    if (existingUser) {
      throw new BadRequestException("Email já cadastrado");
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        name: dto.name,
        phone: dto.phone,
        password: hashedPassword,
        tenantId,
        role: (dto.role || UserRole.SELLER) as UserRoleType,
        status: (dto.status || UserStatus.ACTIVE) as UserStatusType,
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });

    return user;
  }

  async update(id: string, tenantId: string, dto: UpdateUserDto) {
    await this.findOne(id, tenantId);

    const updateData: any = {};

    // Adiciona campos apenas se fornecidos
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.phone !== undefined) updateData.phone = dto.phone || null;
    if (dto.avatar !== undefined) updateData.avatar = dto.avatar || null;
    if (dto.role !== undefined) updateData.role = dto.role;
    if (dto.status !== undefined) updateData.status = dto.status;

    if (dto.password) {
      updateData.password = await bcrypt.hash(dto.password, 10);
    }

    const user = await this.prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        status: true,
        updatedAt: true,
      },
    });

    return user;
  }

  async remove(id: string, tenantId: string) {
    await this.findOne(id, tenantId);

    await this.prisma.user.delete({
      where: { id },
    });

    return { message: "Usuário removido com sucesso" };
  }

  async updateStatus(id: string, tenantId: string, status: string) {
    await this.findOne(id, tenantId);

    return this.prisma.user.update({
      where: { id },
      data: { status: status as any },
      select: {
        id: true,
        status: true,
      },
    });
  }
}
