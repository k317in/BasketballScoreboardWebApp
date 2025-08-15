export const formatTime = (seconds: number, milliseconds: number = 0): string => {
  // If 60 seconds or less, show seconds with milliseconds
  if (seconds <= 60) {
    // For the last minute, show seconds with milliseconds (00-99)
    const ms = Math.floor(milliseconds / 10); // Convert to centiseconds (0-99)
    return `${seconds.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  }
  
  // Normal mm:ss format for times over 1 minute
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export const formatShotClock = (seconds: number): string => {
  return seconds.toString().padStart(2, '0');
};