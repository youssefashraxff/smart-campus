import { computed, inject, Injectable, signal } from '@angular/core';
import { ChatApi } from './api/chat.api';
import { ChatMessage } from './models';
import { errorMessage } from './util/errors';

/** A message on screen: what the server sees, plus which lookups produced an answer */
export interface AssistantMessage extends ChatMessage {
  toolsUsed?: string[];
}

/**
 * The Campus Assistant conversation. Lives at the root, so closing the panel or changing page keeps it.
 * The chatbot service is stateless: every question sends the recent history along with it.
 */
@Injectable({ providedIn: 'root' })
export class AssistantStore {
  private readonly api = inject(ChatApi);

  /** The server accepts up to 20; the recent turns are all the model needs and keep each request cheap */
  private static readonly HISTORY = 12;

  readonly messages = signal<AssistantMessage[]>([]);
  readonly sending = signal(false);
  readonly error = signal<string | null>(null);
  readonly isEmpty = computed(() => this.messages().length === 0);

  send(text: string): void {
    const content = text.trim();
    if (!content || this.sending()) return;
    this.messages.update((list) => [...list, { role: 'user', content }]);
    this.ask();
  }

  /** Asks again after a failed request, with the same last question */
  retry(): void {
    if (!this.sending()) this.ask();
  }

  clear(): void {
    this.messages.set([]);
    this.error.set(null);
  }

  private ask(): void {
    this.sending.set(true);
    this.error.set(null);
    const history = this.messages()
      .slice(-AssistantStore.HISTORY)
      .map(({ role, content }) => ({ role, content }));

    this.api.send(history).subscribe({
      next: (answer) => {
        this.messages.update((list) => [
          ...list,
          { role: 'assistant', content: answer.reply, toolsUsed: answer.toolsUsed },
        ]);
        this.sending.set(false);
      },
      error: (err) => {
        // The question stays in the list, so "Try again" can resend it
        this.error.set(errorMessage(err));
        this.sending.set(false);
      },
    });
  }
}
