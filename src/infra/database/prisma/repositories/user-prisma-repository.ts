import { Injectable } from "@nestjs/common";
import { UsersRepository } from "../../../../domain/user/application/repositories/users-respository";
import { User } from "../../../../domain/user/enterprise/entities/user";
import { PrismaUserMapper } from "../mapper/prisma-user-mapper";
import { PrismaService } from "../prisma.service";

@Injectable()
export class PrismaUserRepository implements UsersRepository {

  constructor(private prisma: PrismaService) {}


  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        id
      }
    })

    if (!user) {
      return null
    }

    return PrismaUserMapper.toDomain(user)
  }

  async create(user: User): Promise<void> {
    const data = PrismaUserMapper.toPrisma(user)

    await this.prisma.user.create({
      data
    })
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: {
        email,
      },
    })

    if (!user) {
      return null
    }

    return PrismaUserMapper.toDomain(user)
  }

  async save(user: User): Promise<void> {
    const data = PrismaUserMapper.toPrisma(user)

    await Promise.all([
      this.prisma.user.update({
        where: {
          id: data.id
        },
        data
      })
    ])
  }
}