import { Module } from '@nestjs/common'
import { DatabaseModule } from '../database/database.module';
import { AIModule } from '../AI/ai.module';
import { SendMessageController } from './controllers/send-message.controller';
import { SendMessageUseCase } from '../../domain/AI/application/use-cases/send-message-use-case';
import { AuthModule } from '../auth/auth.module';
import { AuthenticateController } from './controllers/authenticate.controller';
import { CreateAccountController } from './controllers/create-account.controller';
import { CreateChatController } from './controllers/create-chat.controller';
import { AuthenticateUserUseCase } from '../../domain/user/application/use-cases/authenticate-user-use-case';
import { CreateAccountUseCase } from '../../domain/user/application/use-cases/create-user-use-case';
import { CreateChatUseCase } from '../../domain/AI/application/use-cases/create-chat-use-case';
import { GetUserUseCase } from '../../domain/user/application/use-cases/get-user-use-case';
import { GetUserController } from './controllers/get-user.controller';
import { CryptographyModule } from '../cryptography/cryptography.module';

@Module({
  imports: [
    DatabaseModule,
    AIModule,
    AuthModule,
    CryptographyModule
  ],
  controllers: [
    //User
    AuthenticateController,
    CreateAccountController,
    GetUserController,

    //chat
    SendMessageController,
    CreateChatController
  ],
  providers: [
    SendMessageUseCase,

    //User
    AuthenticateUserUseCase,
    CreateAccountUseCase,
    GetUserUseCase,

    //AI
    CreateChatUseCase,


  ],
})

export class HttpModule {}