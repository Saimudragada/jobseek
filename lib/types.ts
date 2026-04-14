export interface Job {
  id: string;
  source: string;
  ats_id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  salary: string | null;
  tags: string[];
  track: string | null;
  level: string | null;
  url: string;
  posted_at: string | null;
}
