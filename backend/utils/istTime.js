/**
 * IST helpers using Asia/Kolkata — correct on any server timezone.
 */

const TZ = 'Asia/Kolkata';

function getISTParts(date = new Date()) {
  const fmt = new Intl.DateTimeFormat('en-GB', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const parts = Object.fromEntries(
    fmt.formatToParts(date).map((p) => [p.type, p.value])
  );

  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    time: `${parts.hour}:${parts.minute}`,
    year: parts.year,
    month: parts.month,
    day: parts.day,
    hour: parts.hour,
    minute: parts.minute,
  };
}

function getISTNow() {
  return getISTParts(new Date());
}

function formatISTDate(partsOrDate) {
  if (partsOrDate instanceof Date) {
    return getISTParts(partsOrDate).date;
  }
  if (partsOrDate?.date) return partsOrDate.date;
  return getISTParts().date;
}

function formatISTTime(partsOrDate) {
  if (partsOrDate instanceof Date) {
    return getISTParts(partsOrDate).time;
  }
  if (partsOrDate?.time) return partsOrDate.time;
  return getISTParts().time;
}

/** Add minutes to now, return IST date + time strings. */
function addMinutesFromNow(minutes) {
  const later = new Date(Date.now() + minutes * 60000);
  const start = getISTParts(new Date());
  const end = getISTParts(later);
  return { start, end };
}

/** True if HH:mm `time` is inside [start, end] (same calendar day). */
function isTimeInRange(time, start, end) {
  if (!time || !start || !end) return false;
  if (start <= end) {
    return time >= start && time <= end;
  }
  // crosses midnight
  return time >= start || time <= end;
}

module.exports = {
  TZ,
  getISTParts,
  getISTNow,
  formatISTDate,
  formatISTTime,
  addMinutesFromNow,
  isTimeInRange,
};
