import { Module } from "@nestjs/common";
import { BcryptHasher } from "./bcrypt-hasher";
import { Encrypter } from "../../domain/user/application/cryptography/encrypter";
import { HashCompare } from "../../domain/user/application/cryptography/hash-compare";
import { HashGenerator } from "../../domain/user/application/cryptography/hash-generator";
import { JwtEncrypter } from "./jwt-encrypter";

@Module({
  providers: [
    { provide: Encrypter, useClass: JwtEncrypter },
    { provide: HashCompare, useClass: BcryptHasher },
    { provide: HashGenerator, useClass: BcryptHasher }
  ],
  exports:[
    Encrypter,
    HashCompare,
    HashGenerator
  ]
})
export class CryptographyModule { }