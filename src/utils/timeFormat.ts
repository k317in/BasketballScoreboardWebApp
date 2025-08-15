export const formatTime = (seconds: number, milliseconds: number = 0): string => {
  // If 60 seconds or less, show just seconds
  if (seconds <= 60) {
    // For the last minute, show just seconds
    return seconds.toString();
  }
  
  // Normal mm:ss format for times over 1 minute
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export const formatShotClock = (seconds: number): string => {
  return seconds.toString().padStart(2, '0');
};