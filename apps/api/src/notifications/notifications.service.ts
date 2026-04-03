import { Injectable } from '@nestjs/common';
import { Subject } from 'rxjs';

export interface SseEvent {
  type: string;
  data: any;
}

@Injectable()
export class NotificationsService {
  private events$ = new Subject<SseEvent>();

  emit(type: string, data: any) {
    this.events$.next({ type, data });
  }

  getStream() {
    return this.events$.asObservable();
  }
}
