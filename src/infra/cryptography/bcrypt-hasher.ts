import { hash, compare as comparePasswords } from "bcrypt"
import { HashCompare } from "../../domain/user/application/cryptography/hash-compare"
import { HashGenerator } from "../../domain/user/application/cryptography/hash-generator"



export class BcryptHasher implements HashGenerator, HashCompare {

  async hash(plain: string): Promise<string> {
    return hash(plain, 8)
  }

  async compare(plain: string, hash: string): Promise<boolean> {
    return comparePasswords(plain, hash)
  }

}