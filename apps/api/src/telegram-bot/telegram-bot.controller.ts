import { Controller, Post, Delete, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { User } from '@prisma/client';
import { UserRole } from '@iridium/shared';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { LinkTokenService } from './link-token.service';
import { LinkTokenResponseDto } from './dto/link-token-response.dto';

@ApiTags('Telegram Bot')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('telegram-bot')
export class TelegramBotController {
  constructor(private readonly linkTokenService: LinkTokenService) {}

  @Post('link-token')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Generate one-time link token for Telegram deep link' })
  async generateLinkToken(
    @CurrentUser() user: User,
  ): Promise<LinkTokenResponseDto> {
    return this.linkTokenService.generateToken(user.id);
  }

  @Delete('link')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Unlink Telegram from current user account' })
  async unlink(@CurrentUser() user: User): Promise<{ ok: true }> {
    await this.linkTokenService.unlink(user.id);
    return { ok: true };
  }
}
