export function formatDate(timestamp: number | string, dateFormat: string = 'MM/DD/YYYY'): string {
  const date = new Date(timestamp);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  let formattedDate = '';
  switch (dateFormat) {
    case 'DD/MM/YYYY':
      formattedDate = `${day}/${month}/${year}`;
      break;
    case 'YYYY-MM-DD':
      formattedDate = `${year}-${month}-${day}`;
      break;
    case 'MM/DD/YYYY':
    default:
      formattedDate = `${month}/${day}/${year}`;
      break;
  }

  return `${formattedDate}, ${hours}:${minutes}:${seconds}`;
}
