import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ChatService } from './chat.service';
import { AskDto, CreateSessionDto, IntroduceDto } from './dto/chat.dto';

@ApiTags('chat')
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('session')
  createSession(@Body() dto: CreateSessionDto) {
    return this.chatService.createSession(dto.sessionKey);
  }

  @Post('introduce')
  introduce(@Body() dto: IntroduceDto) {
    return this.chatService.introduce(dto);
  }

  @Get('history')
  history(@Query('sessionKey') sessionKey: string) {
    return this.chatService.getHistory(sessionKey);
  }

  @Post('ask')
  ask(@Body() dto: AskDto) {
    return this.chatService.ask(dto);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Get('sessions')
  listSessions() {
    return this.chatService.listSessions();
  }
}
