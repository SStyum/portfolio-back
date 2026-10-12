// Para adicionar outro storage: inclua aqui e registre o gateway em storage.module.ts
export const STORAGE_PROVIDERS = ["S3"] as const;
export type StorageProviderName = typeof STORAGE_PROVIDERS[number];

export interface UploadFileInput {
  key: string            // caminho do arquivo no bucket, ex.: "users/<id>/avatar.png"
  body: Buffer
  contentType: string
}

export interface SignedUploadUrlInput {
  key: string
  contentType: string
  expiresInSeconds?: number
}

export abstract class StorageGateway {
  abstract upload(input: UploadFileInput): Promise<void>
  abstract delete(key: string): Promise<void>
  // URL pré-assinada pro front enviar o arquivo direto pro storage, sem passar pela API
  abstract getUploadUrl(input: SignedUploadUrlInput): Promise<string>
  abstract getDownloadUrl(key: string, expiresInSeconds?: number): Promise<string>
}
