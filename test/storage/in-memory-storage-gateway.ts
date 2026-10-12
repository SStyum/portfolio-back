import { SignedUploadUrlInput, StorageGateway, UploadFileInput } from '../../src/core/gateways/storage.gateway'

// Substitui o S3 nos testes: guarda os arquivos num Map
export class InMemoryStorageGateway implements StorageGateway {
  public files = new Map<string, { body: Buffer; contentType: string }>()

  async upload({ key, body, contentType }: UploadFileInput) {
    this.files.set(key, { body, contentType })
  }

  async delete(key: string) {
    this.files.delete(key)
  }

  async getUploadUrl({ key, contentType }: SignedUploadUrlInput) {
    return `https://storage.test/upload/${encodeURIComponent(key)}?contentType=${encodeURIComponent(contentType)}`
  }

  async getDownloadUrl(key: string) {
    return `https://storage.test/download/${encodeURIComponent(key)}`
  }
}
