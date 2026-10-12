import { AggregateRoot } from "../../../../core/entities/aggregate-root";
import { UniqueEntityId } from "../../../../core/entities/unique-entity-id";
import { UserCreatedEvent } from "../events/user-created-event";

export type UserPlan = "FREE" | "PAID"
export type UserRole = "USER" | "ADMIN"

interface UserProps {
  name: string
  email: string
  // Vazio pra quem entrou só com login social
  password?: string
  plan: UserPlan
  role: UserRole
  emailVerifiedAt?: Date
  billingCustomerId?: string
}

type CreateUserProps = Omit<UserProps, 'plan' | 'role'> & Partial<Pick<UserProps, 'plan' | 'role'>>

export class User extends AggregateRoot<UserProps>{

  get name(){
    return this.props.name
  }

  get email(){
    return this.props.email
  }

  get password(){
    return this.props.password ?? ''
  }

  get hasPassword(){
    return !!this.props.password
  }

  get plan(){
    return this.props.plan
  }

  get role(){
    return this.props.role
  }

  get emailVerifiedAt(){
    return this.props.emailVerifiedAt
  }

  get isEmailVerified(){
    return !!this.props.emailVerifiedAt
  }

  get billingCustomerId(){
    return this.props.billingCustomerId
  }

  set billingCustomerId(value: string | undefined){
    this.props.billingCustomerId = value
  }

  set name(value: string){
    this.props.name = value
  }

  set email(value: string){
    this.props.email = value
  }

  set password(value: string){
    this.props.password = value
  }

  changePlan(plan: UserPlan){
    this.props.plan = plan
  }

  verifyEmail(){
    this.props.emailVerifiedAt ??= new Date()
  }

  static create(props: CreateUserProps, id?: UniqueEntityId){
    const user = new User({
      ...props,
      plan: props.plan ?? 'FREE',
      role: props.role ?? 'USER',
    }, id)

    // Sem id = usuário novo (com id = vindo do banco)
    if (!id) {
      user.addDomainEvent(new UserCreatedEvent(user))
    }

    return user
  }
}
