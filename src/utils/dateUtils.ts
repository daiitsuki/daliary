export function getKSTNow(): Date {
  const now = new Date();
  const kstOffset = 9 * 60 * 60 * 1000;
  return new Date(now.getTime() + now.getTimezoneOffset() * 60000 + kstOffset);
}

export function getKSTDateString(): string {
  const kstNow = getKSTNow();
  const year = kstNow.getFullYear();
  const month = String(kstNow.getMonth() + 1).padStart(2, '0');
  const day = String(kstNow.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
