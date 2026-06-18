export abstract class EmbeddingGateway{

    abstract generateEmbedding(
        text:string
    ):Promise<number[]>

}