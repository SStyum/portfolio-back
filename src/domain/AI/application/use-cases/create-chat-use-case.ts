import { Injectable } from "@nestjs/common";
import { Either, right } from "../../../../core/either";
import { Chat } from "../../enterprise/entity/chat";
import { ChatRepository } from "../repositories/chat-repository";

interface CreateChatUseCaseRequest {
  userId: string;
}

type CreateChatUseCaseResponse = Either<
  null,
  {
    chat: Chat;
  }
>;

@Injectable()
export class CreateChatUseCase {
  constructor(
    private chatsRepository: ChatRepository,
  ) {}

  async execute({
    userId,
  }: CreateChatUseCaseRequest): Promise<CreateChatUseCaseResponse> {

    const chat = Chat.create({
      title: "Novo Chat",
      userId,
      messages: [],
    });

    await this.chatsRepository.create(chat);

    return right({
      chat,
    });
  }
}