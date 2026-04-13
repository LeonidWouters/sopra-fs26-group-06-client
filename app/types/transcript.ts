export interface TranscriptGetDTO {
  id: number;
  content: string;
  createdAt: string;
  sessionId: string;
}

export interface NoteGetDTO {
  id: number;
  content: string;
  createdAt: string;
  updatedAt: string;
  sessionId: string;
}

export interface UserDocumentsGetDTO {
  transcripts: TranscriptGetDTO[];
  notes: NoteGetDTO[];
}

export type DocumentItem =
  | (TranscriptGetDTO & { kind: "transcript" })
  | (NoteGetDTO & { kind: "note" });
