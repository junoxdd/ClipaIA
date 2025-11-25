export enum JobStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  DONE = 'done',
  ERROR = 'error'
}

export interface Job {
  id: string;
  youtube_url: string;
  status: JobStatus;
  created_at: string;
}

export interface Clip {
  id: string;
  job_id: string;
  title: string;
  summary: string;
  download_url: string;
  created_at: string;
}

export interface ClipSegment {
  start_time: string; // HH:MM:SS or seconds
  end_time: string;
  title: string;
  summary: string;
}