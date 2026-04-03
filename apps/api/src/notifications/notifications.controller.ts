import { Controller, Sse, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { Observable, map } from 'rxjs';
import { UserRole } from '@iridium/shared';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { NotificationsService, SseEvent } from './notifications.service';

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  @Sse('sse')
  @Roles(UserRole.ADMIN, UserRole.LOGIST)
  @ApiOperation({ summary: 'SSE stream for realtime notifications' })
  sse(): Observable<MessageEvent> {
    return this.notificationsService.getStream().pipe(
      map(
        (event: SseEvent) =>
          ({
            data: JSON.stringify(event),
            type: event.type,
          }) as MessageEvent,
      ),
    );
  }
}
