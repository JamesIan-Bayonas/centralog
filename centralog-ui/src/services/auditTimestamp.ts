export function formatAuditTimestamp(timestamp: string) {
  // Older API versions returned UTC values without a zone suffix.
  const utcTimestamp = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(timestamp) ? timestamp : `${timestamp}Z`;
  return new Date(utcTimestamp).toLocaleString();
}
