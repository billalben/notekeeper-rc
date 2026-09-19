export const generateID = (): string => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return new Date().getTime().toString();
};

export const getGreetingMsg = (currentHour: number): string => {
  const greeting =
    currentHour < 5
      ? "Night"
      : currentHour < 12
        ? "Morning"
        : currentHour < 15
          ? "Noon"
          : currentHour < 17
            ? "Afternoon"
            : currentHour < 20
              ? "Evening"
              : "Night";

  return `Good ${greeting}`;
};

export const countWords = (text: string): number => {
  const matches = text.trim().match(/\S+/g);
  return matches ? matches.length : 0;
};

export const getRelativeTime = (milliSeconds: number): string => {
  const currentTime = new Date().getTime();

  const minute = Math.floor((currentTime - milliSeconds) / 1000 / 60);
  const hour = Math.floor(minute / 60);
  const day = Math.floor(hour / 24);

  return minute < 1
    ? "Just now"
    : minute < 60
      ? `${minute} min ago`
      : hour < 24
        ? `${hour} hour ago`
        : day === 1
          ? `${day} day ago`
          : `${day} days ago`;
};
