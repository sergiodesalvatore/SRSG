import { Article } from '../types';

export const parseNBIB = (content: string): Article[] => {
  let records: string[] = [];
  if (content.includes('\n\n')) {
    records = content.split(/\n\n+/).filter(r => r.trim() && r.includes('PMID'));
  } else {
    records = content.split(/PMID-/).filter(r => r.trim());
  }

  const articles: Article[] = [];
  records.forEach((record) => {
    const lines = record.split('\n');
    let pmid = '';
    let title = '';
    let abstract = '';
    let doi = '';
    let authors: string[] = [];
    
    // Journal fields
    let journalFull = '';
    let journalAbbr = '';
    let source = '';
    let place = '';

    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];
      if (!line.includes('-')) continue;
      // Changed regex to accept 1-4 chars tag (e.g. J - )
      const match = line.match(/^([A-Z]{1,4})\s*-\s*(.*)/);
      if (!match) continue;
      
      const field = match[1].trim();
      let value = match[2].trim();
      
      while (i + 1 < lines.length) {
        const nextLine = lines[i + 1];
        // Check if next line is a new tag
        if (!nextLine || nextLine.match(/^[A-Z]{1,4}\s*-/)) break;
        i++;
        value += ' ' + nextLine.trim();
      }

      if (field === 'PMID') pmid = value.split(/\s+/)[0];
      else if (field === 'TI') title = value;
      else if (field === 'AB') abstract = value;
      else if (field === 'JT') journalFull = value; // Full Journal Title
      else if (field === 'TA') journalAbbr = value; // Abbreviation
      else if (field === 'SO') source = value;      // Source string
      else if (field === 'PL') place = value;       // Place of publication (fallback)
      else if (field === 'AID' || (field === 'LID' && !doi)) {
        const cleanValue = value.replace(/\[.*?\]/g, '').trim();
        if (cleanValue.startsWith('10.')) {
          doi = cleanValue;
        }
      }
      else if (field === 'AU' || field === 'FAU') authors.push(value);
    }

    // Prioritize Full Title > Abbreviation > Source > Place
    const journal = journalFull || journalAbbr || (source ? source.split('.')[0] : '') || place || 'Unknown Journal';

    if (title) {
      articles.push({
        pmid: pmid || 'N/A',
        title,
        abstract: abstract || 'No abstract available',
        journal: journal,
        doi: doi || 'N/A',
        authors: authors.slice(0, 5).join('; ') || 'Unknown',
      });
    }
  });
  return articles;
};

export const parseRIS = (content: string): Article[] => {
  const records = content.split(/\nER\s*-\s*\n|\nER\s*-\s*$/).filter(r => r.trim());
  const articles: Article[] = [];
  
  records.forEach((record) => {
    if (!record.trim()) return;
    const lines = record.split('\n');
    let title = '';
    let abstract = '';
    let doi = '';
    let authors: string[] = [];
    let pmid = '';
    
    // Journal fields
    let journalFull = '';
    let journalName = '';
    let secondaryTitle = '';
    let journalAbbr = '';
    let source = '';
    let j1 = '';
    let j2 = '';

    lines.forEach(line => {
      const trimmed = line.trim();
      if (!trimmed) return;
      const match = trimmed.match(/^([A-Z0-9]{2})\s*-\s*(.*)/); // RIS tags are usually 2 chars
      if (!match) return;
      
      const field = match[1].trim();
      const value = match[2].trim();
      if (!value) return;

      if (field === 'TI' || field === 'T1') title = value;
      else if (field === 'AB' || field === 'N2') abstract = value;
      else if (field === 'JF') journalFull = value;       // Journal Full
      else if (field === 'JO') journalName = value;       // Journal Name
      else if (field === 'T2') secondaryTitle = value;    // Secondary Title
      else if (field === 'JA') journalAbbr = value;       // Journal Abbreviation
      else if (field === 'J1') j1 = value;                // User def 1 (often journal)
      else if (field === 'J2') j2 = value;                // User def 2
      else if (field === 'SO') source = value;            // Source
      else if (field === 'AU' || field === 'A1') authors.push(value);
      else if (field === 'M1' || field === 'ID' || field === 'AN') { if (!pmid) pmid = value; }
      else if (field === 'DO') {
        doi = value.replace(/\[.*?\]/g, '').replace(/\s+/g, ' ').trim();
      }
    });

    // Prioritize Full Name > Name > Secondary Title > Abbreviation > J1 > J2 > Source
    const journal = journalFull || journalName || secondaryTitle || journalAbbr || j1 || j2 || source || 'Unknown Journal';

    if (title) {
      articles.push({
        pmid: pmid || title.substring(0, 15),
        title,
        abstract: abstract || 'No abstract available',
        journal: journal,
        doi: doi || 'N/A',
        authors: authors.slice(0, 5).join('; ') || 'Unknown',
      });
    }
  });
  return articles;
};