export interface EpisodeListItem {
  label: string;
  value: string;
}

interface Episode {
  Id: number;
  Key: string;
  Season: number;
  EpisodeNumber: number;
  Title: string;
}

interface Frame {
  Id: number;
  Episode: string;
  Timestamp: number;
}

interface Subtitle {
  Id: number;
  RepresentativeTimestamp: number;
  Episode: string;
  StartTimestamp: number;
  EndTimestamp: number;
  Content: string;
  Language: string;
}

export interface EpisodeInfoResponse {
  Episode: Episode;
  Subtitles: Subtitle[];
}

export interface ScreencapResponse {
  Episode: Episode;
  Frame: Frame;
  Subtitles: Subtitle[];
}

export interface DailyChallenge {
  ok: true;
  date: string;
  imageUrl: string;
  quote: string;
  answer: string;
  playUrl: string;
  generatedAt: string;
}

export interface DailyChallengeError {
  ok: false;
  date?: string;
  error: string;
  generatedAt: string;
}
