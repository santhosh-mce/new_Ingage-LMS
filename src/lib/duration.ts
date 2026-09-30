// Video duration detection and formatting utilities for InGage LMS

export const detectVideoDuration = (file: File): Promise<number> => {
  return new Promise((resolve) => {
    try {
      const video = document.createElement('video');
      video.preload = 'metadata';
      const objectUrl = URL.createObjectURL(file);
      video.src = objectUrl;

      video.onloadedmetadata = () => {
        URL.revokeObjectURL(objectUrl);
        const durationSec = Math.round(video.duration || 0);
        resolve(durationSec);
      };

      video.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        resolve(0);
      };
    } catch {
      resolve(0);
    }
  });
};

export const formatDurationMMSS = (seconds: number): string => {
  if (!seconds || isNaN(seconds) || seconds <= 0) return '00:00';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  if (hrs > 0) {
    return `${hrs}:${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }
  return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

export const formatDurationDigital = (seconds: number): string => {
  if (!seconds || isNaN(seconds) || seconds <= 0) return '00:00:00';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  return `${hrs < 10 ? '0' : ''}${hrs}:${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

export const formatDurationHuman = (seconds: number): string => {
  if (!seconds || isNaN(seconds) || seconds <= 0) return '0 min';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  if (hrs > 0) {
    return mins > 0 ? `${hrs} hr ${mins} min` : `${hrs} hr`;
  }
  if (mins > 0) {
    return `${mins} min`;
  }
  return `${secs} sec`;
};

export const parseDurationToSeconds = (dur: any, durationSeconds?: any): number => {
  if (durationSeconds && typeof durationSeconds === 'number' && durationSeconds > 0) {
    return durationSeconds;
  }
  if (!dur) return 0;
  if (typeof dur === 'number') return dur;
  const str = String(dur).trim();
  if (str.includes(':')) {
    const parts = str.split(':').map(Number);
    if (parts.length === 3) {
      return (parts[0] || 0) * 3600 + (parts[1] || 0) * 60 + (parts[2] || 0);
    }
    if (parts.length === 2) {
      return (parts[0] || 0) * 60 + (parts[1] || 0);
    }
  }
  let total = 0;
  const hrMatch = str.match(/(\d+)\s*(?:hr|hour|h)/i);
  if (hrMatch) total += parseInt(hrMatch[1], 10) * 3600;
  const minMatch = str.match(/(\d+)\s*(?:min|m)/i);
  if (minMatch) total += parseInt(minMatch[1], 10) * 60;
  const secMatch = str.match(/(\d+)\s*(?:sec|s)/i);
  if (secMatch) total += parseInt(secMatch[1], 10);
  return total;
};

export const extractYouTubeId = (url: string): string | null => {
  if (!url) return null;
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
  return match ? match[1] : null;
};
