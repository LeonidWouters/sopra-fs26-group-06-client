export interface Transcript {
  id: string;
  content: string;
  createdAt: string;
  participants?: string[];
}

export interface Note {
  id: string;
  content: string;
  createdAt: string;
  participants?: string[];
}

export type TranscriptOrNote = (Transcript & { kind: "transcript" }) | (Note & { kind: "note" });
