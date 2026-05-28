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
): MeetingSlot[] => {
  const slots: MeetingSlot[] = [];

  const current = new Date(date);

  current.setHours(
    START_HOUR,
    0,
    0,
    0,
  );

  while (true) {
    const start = new Date(current);

    const end = addMinutesToDate(
      start,
      MEETING_DURATION,
    );

    const hour = start.getHours();

    const minute = start.getMinutes();

    if (
      hour > LAST_AVAILABLE_HOUR ||
      (hour === LAST_AVAILABLE_HOUR &&
        minute > LAST_AVAILABLE_MINUTE)
    ) {
      break;
    }

    if (end.getHours() > END_HOUR) {
      break;
    }

    const formatted =
      start.toLocaleTimeString(
        'es-AR',
        {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
          timeZone:
            'America/Argentina/Buenos_Aires',
        },
      );

    slots.push({
      start,
      end,
      formatted,
    });

    current.setMinutes(
      current.getMinutes() +
        MEETING_DURATION,
    );
  }

  return slots;
};