export interface Article {
  pmid: string;
  title: string;
  abstract: string;
  journal: string;
  doi: string;
  authors: string;
}

export type Decision = 'include' | 'exclude' | 'maybe';

export interface SelectionData {
  decision: Decision;
  note: string;
}

export interface Selections {
  [index: number]: SelectionData;
}

export interface Session {
  articles: Article[];
  currentIndex: number;
  selections: Selections;
  timestamp: string;
}

export interface Profile {
  name: string;
  createdAt: string;
  session: Session | null;
}