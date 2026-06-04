import { UsersRepository } from "../../../../domain/user/application/repositories/users-respository";
import { User } from "../../../../domain/user/enterprise/entities/user";
import { PrismaUserMapper } from "../mapper/prisma-user-mapper";
import { PrismaService } from "../prisma.service";


export class PrismaUserRepository implements UsersRepository {
  constructor(private prisma: PrismaService) { }

  async create(user: User): Promise<void> {
    const data = PrismaUserMapper.toPrisma(user)

    await this.prisma.user.create({
      data
    })
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