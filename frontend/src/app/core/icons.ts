import { provideIcons } from '@ng-icons/core';
import {
  lucideBellRing,
  lucideCalendarDays,
  lucideDoorOpen,
  lucideHistory,
  lucideInbox,
  lucideMonitor,
  lucideProjector,
  lucideSearchX,
} from '@ng-icons/lucide';

/**
 * Icons whose name is passed around as a string (facility type icons, empty-state icons), registered
 * once for the whole app. Icons used directly in a template are registered by that component.
 */
export const provideSharedIcons = () =>
  provideIcons({
    lucideDoorOpen,
    lucideMonitor,
    lucideProjector,
    lucideInbox,
    lucideCalendarDays,
    lucideBellRing,
    lucideSearchX,
    lucideHistory,
  });
