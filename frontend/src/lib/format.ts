export const money = (cents: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: cents % 100 ? 2 : 0 }).format(cents / 100);
export const shortDate = (date: string) => date ? date.slice(0, 10).split('-').slice(1).reverse().join('/') : '—';
export const timestamp = (value: string) => {
  const date = new Date(value.includes('T') ? value : value.replace(' ', 'T'));
  if (Number.isNaN(date.getTime())) return '—';
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Ho_Chi_Minh', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(date);
  const get = (type: string) => parts.find(p => p.type === type)?.value;
  return `${get('day')}/${get('month')} ${get('hour')}:${get('minute')}`;
};
