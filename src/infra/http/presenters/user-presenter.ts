import { User } from "../../../domain/user/enterprise/entities/user";

// Nunca expor password (nem o hash)
export class UserPresenter{
  static toHTTP(user: User){
    return {
      id: user.id.toString(),
      name: user.name,
      email: user.email,
      plan: user.plan,
      role: user.role,
    }
  }
}
