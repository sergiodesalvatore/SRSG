
export interface Article {
  id: string;
  pmid: string;
  title: string;
  abstract: string;
  journal: string;
  doi: string;
  authors: string;
  sourceFile?: string;
  isDuplicate?: boolean;
}

export type Decision = 'include' | 'exclude' | 'maybe';

export interface SelectionData {
  decision: Decision;
  note: string;
  reviewerId: string; // Email del revisore
  timestamp: string;
}

export interface Selections {
  [articleId: string]: SelectionData[];
}

export interface ProjectSettings {
  reviewersCount: 1 | 2;
  screeningMode: 'single' | 'double';
  assignedEmails: string[];
  includeKeywords: string[];
  excludeKeywords: string[];
}

export interface Session {
  articles: Article[];
  currentIndex: number;
  selections: Selections;
  timestamp: string;
  duplicatesCount: number;
}

export interface Profile {
  name: string;
  createdAt: string;
  settings: ProjectSettings;
  session: Session | null;
}
