import { Entity } from "../../../../core/entities/entity";
import { UniqueEntityId } from "../../../../core/entities/unique-entity-id";

interface userProps {
  name: string
  email: string
  password?: string
  payment?: string
}

export class User extends Entity<userProps>{

  get name(){
    return this.name
  }

  get email(){
    return this.email
  }

  get password(){
    return this.password
  }

  get payment(){
    return this.payment ?? ''
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

  static create(props: userProps, id?: UniqueEntityId){
    const user = new User(props, id)

    return user
  }
}