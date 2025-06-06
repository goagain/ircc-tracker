export const formatDate = (dateString: string | null): string => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleString(undefined, { 
    timeZoneName: 'short'
  });
}; 