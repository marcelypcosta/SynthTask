export const formatDate = (dateTimeStr?: string): string => {
  if (!dateTimeStr) return "";
  const [datePart] = dateTimeStr.split("T");
  if (!datePart) return "";
  const [year, month, day] = datePart.split("-");
  if (!year || !month || !day) return "";
  return `${day}/${month}/${year}`;
};

export const formatTime = (dateTimeStr?: string): string => {
  if (!dateTimeStr) return "";
  const [, timePart] = dateTimeStr.split("T");
  return timePart ? timePart.slice(0, 5) : "";
};
