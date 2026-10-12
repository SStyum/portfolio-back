import { HashCompare } from '../../src/domain/user/application/cryptography/hash-compare'
import { HashGenerator } from '../../src/domain/user/application/cryptography/hash-generator'

export class FakeHasher implements HashGenerator, HashCompare {
  async hash(plain: string) {
    return plain.concat('-hashed')
  }

  async compare(plain: string, hash: string) {
    return plain.concat('-hashed') === hash
  }
}
