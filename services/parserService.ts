
import { Article } from '../types';

const generateId = () => Math.random().toString(36).substr(2, 9);

const normalizeTitle = (title: string) => 
  title?.toLowerCase().replace(/[^a-z0-9]/g, '') || '';

/**
 * Extracts the value from a Medline/NBIB line, correctly handling the separator.
 * Standard format is "TAG - VALUE" or "TAG-VALUE".
 */
const getMedlineValue = (line: string): string => {
  const dashIndex = line.indexOf('-');
  if (dashIndex === -1) return '';
  // Skip the dash and any immediately following space
  let startIndex = dashIndex + 1;
  if (line[startIndex] === ' ') startIndex++;
  return line.substring(startIndex).trim();
};

export const parseRIS = (content: string, fileName: string): Article[] => {
  const articles: Article[] = [];
  const entries = content.split(/ER  -/);

  entries.forEach(entry => {
    if (!entry.trim()) return;
    const lines = entry.split(/\r?\n/);
    const article: any = { 
      id: generateId(), 
      sourceFile: fileName, 
      pmid: 'N/A', 
      doi: 'N/A', 
      authors: '', 
      title: '', 
      abstract: '', 
      journal: '' 
    };
    
    lines.forEach(line => {
      if (line.length < 6) return;
      const tag = line.substring(0, 2).trim();
      const val = line.substring(6).trim();
      if (!tag) return;
      
      switch (tag) {
        case 'TI':
        case 'T1':
          article.title = (article.title ? article.title + ' ' : '') + val;
          break;
        case 'AB':
          article.abstract = (article.abstract ? article.abstract + ' ' : '') + val;
          break;
        case 'JO':
        case 'JF':
          article.journal = val;
          break;
        case 'DO':
          article.doi = val;
          break;
        case 'AU':
          article.authors = (article.authors ? article.authors + '; ' : '') + val;
          break;
      }
    });
    
    if (article.title) articles.push(article as Article);
  });
  return articles;
};

export const parseNBIB = (content: string, fileName: string): Article[] => {
  const articles: Article[] = [];
  // NBIB records start with PMID- 
  const entries = content.split(/(?=PMID-)/);

  entries.forEach(entry => {
    if (!entry.trim() || !entry.includes('PMID-')) return;
    const article: any = { 
      id: generateId(), 
      sourceFile: fileName, 
      pmid: 'N/A', 
      doi: 'N/A', 
      authors: '', 
      title: '', 
      abstract: '', 
      journal: '' 
    };
    
    const lines = entry.split(/\r?\n/);
    let lastTag = '';
    
    lines.forEach(line => {
      // Tags are 1-4 uppercase letters followed by optional spaces and a hyphen
      const tagMatch = line.match(/^([A-Z]{1,4})\s*-/);
      
      if (tagMatch) {
        lastTag = tagMatch[1];
        const value = getMedlineValue(line);
        
        switch (lastTag) {
          case 'PMID':
            article.pmid = value;
            break;
          case 'TI':
            article.title = (article.title ? article.title + ' ' : '') + value;
            break;
          case 'AB':
            article.abstract = (article.abstract ? article.abstract + ' ' : '') + value;
            break;
          case 'JT':
            article.journal = value;
            break;
          case 'AID':
            if (value.toLowerCase().includes('[doi]')) {
              article.doi = value.replace(/\[doi\]/gi, '').trim();
            }
            break;
          case 'AU':
            // Append author. Medline format has one AU tag per author.
            article.authors = (article.authors ? article.authors + '; ' : '') + value;
            break;
        }
      } else if (line.startsWith('      ') && lastTag) {
        // Multi-line field continuation
        const value = line.trim();
        if (lastTag === 'TI') article.title += ' ' + value;
        else if (lastTag === 'AB') article.abstract += ' ' + value;
        else if (lastTag === 'AU') article.authors += ' ' + value;
      }
    });

    if (article.title) {
      article.title = article.title.trim();
      article.abstract = article.abstract.trim();
      article.authors = article.authors.trim();
      articles.push(article as Article);
    }
  });
  return articles;
};

export const processUploads = (files: {content: string, name: string, type: 'ris' | 'nbib'}[], existingArticles: Article[]): { articles: Article[], duplicates: number } => {
  let allParsed: Article[] = [];
  
  files.forEach(f => {
    const parsed = f.type === 'ris' ? parseRIS(f.content, f.name) : parseNBIB(f.content, f.name);
    allParsed = [...allParsed, ...parsed];
  });

  const unique: Article[] = [...existingArticles];
  let duplicatesCount = 0;

  allParsed.forEach(article => {
    const isDup = unique.some(existing => {
      const doiMatch = article.doi !== 'N/A' && existing.doi !== 'N/A' && article.doi === existing.doi;
      const titleMatch = normalizeTitle(article.title) === normalizeTitle(existing.title);
      return doiMatch || titleMatch;
    });

    if (isDup) {
      duplicatesCount++;
    } else {
      unique.push(article);
    }
  });

  return { articles: unique, duplicates: duplicatesCount };
};
