export const formatTime = (seconds: number): string => {
  // If 60 seconds or less, show seconds with milliseconds (simulated)
  if (seconds <= 60) {
    // For the last minute, we'll show seconds with a simulated millisecond display
    // Since we only have second precision, we'll show .0 for milliseconds
    return `${seconds.toString().padStart(2, '0')}.0`;
  }
  
  // Normal mm:ss format for times over 1 minute
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export const formatShotClock = (seconds: number): string => {
  return seconds.toString().padStart(2, '0');
};