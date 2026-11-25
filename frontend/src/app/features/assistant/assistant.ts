import {
  afterRenderEffect,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideArrowUp,
  lucideCalendarSearch,
  lucideMessageCircle,
  lucideRotateCw,
  lucideSearch,
  lucideSparkles,
  lucideTrash2,
} from '@ng-icons/lucide';
import { BrnSheetContent } from '@spartan-ng/brain/sheet';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmSheetImports } from '@spartan-ng/helm/sheet';
import { AssistantStore } from '../../core/assistant.store';

/** How each backend tool is named under an answer (ChatResponse.toolsUsed) */
const TOOL_LABELS: Record<string, string> = {
  search_facilities: 'Searched facilities',
  check_facility_availability: 'Checked availability',
  search_events: 'Searched events',
  get_event_details: 'Read event details',
};

const SUGGESTIONS = [
  'Is Computer Lab 3 free tomorrow at 14:00?',
  'Which study rooms fit 10 people?',
  'What events are on this week?',
  'Who is speaking at the next workshop?',
];

/**
 * Campus Assistant (bonus, FR-B1..B3): a floating button on every signed-in page that opens a chat panel
 * from the right. The answers come from live campus data through POST /api/chat.
 */
@Component({
  selector: 'app-assistant',
  imports: [FormsModule, NgIcon, HlmButton, HlmSheetImports, BrnSheetContent],
  providers: [
    provideIcons({
      lucideMessageCircle,
      lucideArrowUp,
      lucideSparkles,
      lucideRotateCw,
      lucideTrash2,
      lucideSearch,
      lucideCalendarSearch,
    }),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (!open()) {
      <button
        type="button"
        class="bg-primary text-primary-foreground shadow-primary hover:bg-brand-ink fixed right-5 bottom-5 z-40 flex h-12 items-center gap-2 rounded-full bg-linear-to-b from-white/10 to-transparent px-4 font-medium transition-transform duration-200 ease-(--ease-out) active:scale-[0.97] sm:right-8 sm:bottom-8"
        aria-label="Open Campus Assistant"
        (click)="open.set(true)"
      >
        <ng-icon name="lucideSparkles" size="18" />
        <span class="hidden sm:inline">Ask the assistant</span>
      </button>
    }

    <hlm-sheet side="right" [state]="open() ? 'open' : 'closed'" (closed)="open.set(false)">
      <hlm-sheet-content
        *brnSheetContent="let ctx"
        class="bg-background flex flex-col gap-0 p-0 data-[side=right]:w-full data-[side=right]:sm:max-w-md"
      >
        <!-- Header -->
        <div class="border-border/70 flex items-center gap-3 border-b px-5 py-4 pe-14">
          <span
            class="bg-brand-soft text-brand-ink grid size-9 shrink-0 place-items-center rounded-xl"
            aria-hidden="true"
          >
            <ng-icon name="lucideSparkles" size="18" />
          </span>
          <div class="min-w-0 flex-1">
            <h2 hlmSheetTitle class="text-base font-semibold">Campus Assistant</h2>
            <p hlmSheetDescription class="text-muted-foreground text-xs">
              Facilities, availability and events, from live campus data
            </p>
          </div>
          @if (!store.isEmpty()) {
            <button
              hlmBtn
              variant="ghost"
              size="icon-sm"
              aria-label="Clear conversation"
              title="Clear conversation"
              [disabled]="store.sending()"
              (click)="store.clear()"
            >
              <ng-icon name="lucideTrash2" size="15" />
            </button>
          }
        </div>

        <!-- Conversation -->
        <div #scroller class="flex-1 overflow-y-auto px-5 py-5" aria-live="polite">
          @if (store.isEmpty()) {
            <div class="flex flex-col gap-4 pt-2">
              <p class="text-muted-foreground text-sm">
                Ask when a room or lab is free, or about upcoming events and their speakers. The
                assistant can’t book for you, but it tells you where to do it.
              </p>
              <div class="flex flex-col gap-2">
                @for (suggestion of suggestions; track suggestion) {
                  <button
                    type="button"
                    class="surface-flat hover:bg-muted px-3.5 py-2.5 text-left text-sm transition-colors"
                    (click)="store.send(suggestion)"
                  >
                    {{ suggestion }}
                  </button>
                }
              </div>
            </div>
          }

          <ol class="flex flex-col gap-4">
            @for (message of store.messages(); track $index) {
              @if (message.role === 'user') {
                <li class="flex justify-end">
                  <p
                    class="bg-primary text-primary-foreground max-w-[85%] rounded-2xl rounded-br-md px-3.5 py-2 text-sm whitespace-pre-line"
                  >
                    {{ message.content }}
                  </p>
                </li>
              } @else {
                <li class="flex flex-col items-start gap-1.5">
                  <p
                    class="surface-raised max-w-[92%] rounded-2xl rounded-bl-md px-3.5 py-2.5 text-sm whitespace-pre-line"
                  >
                    {{ message.content }}
                  </p>
                  @if (message.toolsUsed?.length) {
                    <ul class="flex flex-wrap gap-1.5 ps-1" aria-label="Looked up">
                      @for (tool of message.toolsUsed; track tool) {
                        <li
                          class="bg-muted text-muted-foreground flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.7rem]"
                        >
                          <ng-icon
                            [name]="
                              tool.includes('event') ? 'lucideCalendarSearch' : 'lucideSearch'
                            "
                            size="11"
                          />
                          {{ label(tool) }}
                        </li>
                      }
                    </ul>
                  }
                </li>
              }
            }

            @if (store.sending()) {
              <li class="flex items-center gap-2" role="status">
                <span class="surface-raised flex gap-1 rounded-2xl rounded-bl-md px-3.5 py-3">
                  <span class="dot"></span><span class="dot"></span><span class="dot"></span>
                </span>
                <span class="sr-only">The assistant is checking…</span>
              </li>
            }
          </ol>

          @if (store.error(); as error) {
            <div
              class="bg-destructive-soft text-destructive mt-4 flex items-start justify-between gap-3 rounded-2xl px-3.5 py-3 text-sm"
              role="alert"
            >
              <span>{{ error }}</span>
              <button hlmBtn variant="ghost" size="sm" class="shrink-0" (click)="store.retry()">
                <ng-icon name="lucideRotateCw" size="14" />
                Try again
              </button>
            </div>
          }
        </div>

        <!-- Composer -->
        <form class="border-border/70 border-t px-4 py-3" (ngSubmit)="submit()">
          <div
            class="bg-card focus-within:ring-ring/40 flex items-end gap-2 rounded-2xl border p-1.5 ps-3.5 focus-within:ring-2"
          >
            <label for="assistant-input" class="sr-only">Your question</label>
            <textarea
              #input
              id="assistant-input"
              name="question"
              rows="1"
              maxlength="2000"
              placeholder="Ask about rooms, labs or events…"
              class="max-h-32 min-h-9 flex-1 resize-none bg-transparent py-1.5 text-sm outline-none [field-sizing:content]"
              [(ngModel)]="draft"
              (keydown.enter)="onEnter($event)"
            ></textarea>
            <button
              hlmBtn
              size="icon"
              type="submit"
              class="shrink-0 rounded-xl"
              aria-label="Send"
              [disabled]="!draft().trim() || store.sending()"
            >
              <ng-icon name="lucideArrowUp" size="17" />
            </button>
          </div>
          <p class="text-muted-foreground mt-1.5 px-1 text-[0.7rem]">
            Answers can be wrong. Check the facility or event page before you plan around them.
          </p>
        </form>
      </hlm-sheet-content>
    </hlm-sheet>
  `,
  styles: `
    .dot {
      width: 0.375rem;
      height: 0.375rem;
      border-radius: 9999px;
      background: var(--muted-foreground);
      animation: pulse 1.2s var(--ease-out) infinite;
    }
    .dot:nth-child(2) {
      animation-delay: 0.15s;
    }
    .dot:nth-child(3) {
      animation-delay: 0.3s;
    }
    @keyframes pulse {
      0%,
      80%,
      100% {
        opacity: 0.3;
        transform: translateY(0);
      }
      40% {
        opacity: 1;
        transform: translateY(-2px);
      }
    }
    @media (prefers-reduced-motion: reduce) {
      .dot {
        animation: none;
        opacity: 0.6;
      }
    }
  `,
})
export class Assistant {
  protected readonly store = inject(AssistantStore);
  protected readonly open = signal(false);
  protected readonly draft = signal('');
  protected readonly suggestions = SUGGESTIONS;

  private readonly scroller = viewChild<ElementRef<HTMLElement>>('scroller');
  private readonly input = viewChild<ElementRef<HTMLTextAreaElement>>('input');

  constructor() {
    // Keep the newest message in view whenever the list or the typing indicator changes
    afterRenderEffect(() => {
      this.store.messages();
      this.store.sending();
      const el = this.scroller()?.nativeElement;
      if (el) el.scrollTop = el.scrollHeight;
    });
  }

  protected label(tool: string): string {
    return TOOL_LABELS[tool] ?? tool;
  }

  protected submit(): void {
    const text = this.draft();
    if (!text.trim() || this.store.sending()) return;
    this.store.send(text);
    this.draft.set('');
    this.input()?.nativeElement.focus();
  }

  /** Enter sends, Shift+Enter adds a new line (as in most chat apps) */
  protected onEnter(event: Event): void {
    const key = event as KeyboardEvent;
    if (key.shiftKey || key.isComposing) return;
    event.preventDefault();
    this.submit();
  }
}
