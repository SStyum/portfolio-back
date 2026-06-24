import { User } from "../../enterprise/entities/user";

export abstract class UsersRepository {
  abstract create(user: User): Promise<void>
  abstract save(user: User): Promise<void>
  abstract findByEmail(email: string):Promise<User | null>
}