import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { ChatMessage, ChatReply } from '../models';
import { api } from './api';

/** Chatbot service (port 5005), reached through /api/chat (bonus, FR-B1..B3) */
@Injectable({ providedIn: 'root' })
export class ChatApi {
  private readonly http = inject(HttpClient);

  send(messages: ChatMessage[]) {
    return this.http.post<ChatReply>(api('/chat'), { messages });
  }
}
