export interface AiMessage{
    role: 'user' | 'system' | 'assistant',
    content: string
}