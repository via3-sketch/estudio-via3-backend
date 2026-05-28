import { MeetingSlot } from '../interfaces/meeting-slot.interface';
import {
  END_HOUR,
  LAST_AVAILABLE_HOUR,
  LAST_AVAILABLE_MINUTE,
  MEETING_DURATION,
  START_HOUR,
} from './meeting.constants';
import { addMinutesToDate } from './date.utils';

export const generateDaySlots = (
  date: Date,
  timezone: string,
): MeetingSlot[] => {
  const slots: MeetingSlot[] = [];

  const dateStr = date.toLocaleDateString('en-CA'); // "YYYY-MM-DD"
  const localStartStr = `${dateStr}T${String(START_HOUR).padStart(2, '0')}:00:00`;

  // Calculamos el offset del timezone correctamente
  const localDate = new Date(localStartStr);
  const tzDate = new Date(
    new Date(localStartStr).toLocaleString('en-US', { timeZone: timezone }),
  );
  const offsetMs = localDate.getTime() - tzDate.getTime();
  const current = new Date(localDate.getTime() + offsetMs);

  while (true) {
    const start = new Date(current);
    const end = addMinutesToDate(start, MEETING_DURATION);

    const localParts = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).formatToParts(start);

    const localHour = parseInt(
      localParts.find((p) => p.type === 'hour')?.value ?? '0',
    );
    const localMinute = parseInt(
      localParts.find((p) => p.type === 'minute')?.value ?? '0',
    );

    if (
      localHour > LAST_AVAILABLE_HOUR ||
      (localHour === LAST_AVAILABLE_HOUR && localMinute > LAST_AVAILABLE_MINUTE)
    ) {
      break;
    }

    const endLocalParts = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      hour: '2-digit',
      hour12: false,
    }).formatToParts(end);

    const endLocalHour = parseInt(
      endLocalParts.find((p) => p.type === 'hour')?.value ?? '0',
    );

    if (endLocalHour > END_HOUR) {
      break;
    }

    const formatted = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(start);

    slots.push({ start, end, formatted });

    current.setTime(current.getTime() + MEETING_DURATION * 60000);
  }

  return slots;
};
