import { Buffer } from 'buffer';
// Portable text-only pack schema. No database, credentials or hosted backend required.
import { createHash } from 'crypto';
export const MAX_BYTES = 256 * 1024 * 1024;
export const ROW_BYTES = 400 * 1024; // Entire serialized item, including escaped payload and metadata.
export const digest = text => createHash('sha256').update(text, 'utf8').digest('hex');
export class Fault extends Error { constructor(status, message) { super(message); this.status = status; } }
const check = (ok, message) => { if (!ok) throw new Fault(400, message); };
const text = x => typeof x === 'string' && x.length > 0;
export function validateBooks(books) {
  check(Array.isArray(books) && books.length > 0 && books.length <= 20000, 'Invalid books');
  const keys = new Set('id title englishTitle author level symbol palette summary sentences vocabulary license authorID matchGlossary isDemoLocation submissionLocation format scene continuation verbFocus'.split(' '));
  const ids = new Set();
  for (const b of books) {
    check(b && typeof b === 'object' && Object.keys(b).every(k => keys.has(k)), 'Unsupported book field (text only)');
    check(['id','title','englishTitle','author','level','symbol','summary','license'].every(k => text(b[k])), 'Missing book text');
    check(/^[a-zA-Z0-9_-]{1,80}$/.test(b.id) && !ids.has(b.id), 'Duplicate or invalid book ID'); ids.add(b.id);
    check(['A1','A2','B1','B2','C1','C2'].includes(b.level) && Number.isInteger(b.palette) && b.palette >= 0, 'Invalid book metadata');
    check(b.format == null || ['story','movieScript','verbs'].includes(b.format), 'Invalid format');
    check(Array.isArray(b.sentences) && b.sentences.length && (b.continuation == null || Array.isArray(b.continuation)), 'Invalid sentences');
    const lines = [...b.sentences, ...(b.continuation || [])], lineIDs = new Set();
    check(lines.length <= 1000, 'Book too long');
    for (const s of lines) {
      check(s && Object.keys(s).every(k => ['id','spanish','english','speaker'].includes(k)) && text(s.id) && text(s.spanish) && text(s.english) && (s.speaker == null || text(s.speaker)), 'Invalid sentence');
      check(!lineIDs.has(s.id), 'Duplicate sentence ID'); lineIDs.add(s.id);
    }
    check(Array.isArray(b.vocabulary) && b.vocabulary.every(v => v && Object.keys(v).every(k => ['word','lemma','occurrences'].includes(k)) && text(v.word) && text(v.lemma) && Number.isInteger(v.occurrences) && v.occurrences > 0), 'Invalid vocabulary');
    if (b.authorID != null) check(text(b.authorID), 'Invalid author');
    if (b.matchGlossary != null) check(typeof b.matchGlossary === 'object' && !Array.isArray(b.matchGlossary) && Object.values(b.matchGlossary).every(text), 'Invalid glossary');
    if (b.scene != null) check(text(b.scene), 'Invalid scene');
    if (b.isDemoLocation != null) check(typeof b.isDemoLocation === 'boolean', 'Invalid location flag');
    if (b.submissionLocation != null) {
      const l = b.submissionLocation;
      check(l && Object.keys(l).every(k => ['latitude','longitude','accuracy','placeName','capturedAt'].includes(k)) && Number.isFinite(l.latitude) && Math.abs(l.latitude) <= 90 && Number.isFinite(l.longitude) && Math.abs(l.longitude) <= 180 && text(l.placeName) && Number.isFinite(l.accuracy) && l.accuracy >= 0 && Number.isFinite(l.capturedAt) && b.isDemoLocation === true, 'Only fictional demo locations may be published by this API');
    }
    if (b.verbFocus != null) {
      const v = b.verbFocus;
      check(v && Object.keys(v).every(k => ['infinitive','tense','forms','scope'].includes(k)) && text(v.infinitive) && text(v.tense) && text(v.scope) && Array.isArray(v.forms) && v.forms.every(text), 'Invalid verb focus');
    }
  }
  return books;
}
const hashPattern = /^[a-f0-9]{64}$/;
const idPattern = /^[a-zA-Z0-9_-]{1,100}$/;
export const packKey = (id, checksum) => 'p' + digest(id + ':' + checksum).slice(0,32);
export const releaseKey = v => 'r' + v.slice(0,32);
export function validatePack(p) {
  check(p && Object.keys(p).sort().join(',')==='authors,books,id,schema' && p.schema===2 && typeof p.id==='string' && idPattern.test(p.id),'Invalid pack');
  validateBooks(p.books); check(p.books.length<=13,'Maximum 13 books per pack');
  check(Array.isArray(p.authors) && p.authors.length>0 && p.authors.length<=13,'Invalid authors');
  const ids=new Set();
  for(const a of p.authors) {
    check(a && Object.keys(a).sort().join(',')==='id,introduction,name,note,portrait' && typeof a.id==='string' && idPattern.test(a.id) && !ids.has(a.id),'Invalid author ID');
    check(['name','introduction','note'].every(k=>text(a[k]) && a[k].length<=4000),'Invalid author text');
    check(['','AuthorAna','AuthorLuis','AuthorMarta'].includes(a.portrait),'Only bundled portrait names are supported');
    ids.add(a.id);
  }
  check(p.books.every(b=>ids.has(b.authorID)) && p.authors.every(a=>p.books.some(b=>b.authorID===a.id)),'Pack must contain exactly its referenced authors');
  return p;
}
function rowFor(p) {
  const payload=JSON.stringify(p), checksum=digest(payload);
  return {_id:packKey(p.id,checksum),kind:'pack',release:checksum,payload,ready:false};
}
function fits(row) {return Buffer.byteLength(JSON.stringify(row))<=ROW_BYTES;}
export function prepare(books, authors) {
  validateBooks(books); check(books.some(b=>b.id==='cafe'),'The free introduction must remain available');
  check(Array.isArray(authors),'Supply author profiles');
  const byID=new Map(authors.map(a=>[a.id,a])); check(byID.size===authors.length,'Duplicate author ID');
  const packs=[]; let pending=[];
  function make(group) {
    const ids=[...new Set(group.map(b=>b.authorID))];
    const p={schema:2,id:'pack-'+group[0].id,authors:ids.map(id=>byID.get(id)),books:group};
    validatePack(p); return rowFor(p);
  }
  for(const b of books) {
    if(pending.length && (pending.length===13 || !fits(make([...pending,b])))) {packs.push(make(pending));pending=[];}
    pending.push(b);check(fits(make(pending)),'One book and its author exceed the pack byte limit');
  }
  if(pending.length)packs.push(make(pending));
  const refs=packs.map(r=>{const p=JSON.parse(r.payload);return {id:p.id,checksum:r.release,bytes:Buffer.byteLength(r.payload),books:p.books.length};});
  const manifest={schema:2,version:digest(JSON.stringify(refs)),packs:refs};
  validateManifest(manifest);return {manifest,packs};
}
export function validateManifest(m) {
  check(m && Object.keys(m).sort().join(',')==='packs,schema,version' && m.schema===2 && hashPattern.test(m.version),'Invalid manifest');
  check(Array.isArray(m.packs) && m.packs.length>0 && m.packs.length<=2000,'Invalid pack count');
  check(m.packs.every(p=>p && Object.keys(p).sort().join(',')==='books,bytes,checksum,id' && typeof p.id==='string' && idPattern.test(p.id) && hashPattern.test(p.checksum) && Number.isInteger(p.bytes) && p.bytes>0 && p.bytes<=ROW_BYTES && Number.isInteger(p.books) && p.books>0 && p.books<=13),'Invalid pack descriptor');
  check(new Set(m.packs.map(p=>p.id)).size===m.packs.length,'Duplicate pack ID');
  check(m.packs.reduce((n,p)=>n+p.books,0)<=20000 && m.packs.reduce((n,p)=>n+p.bytes,0)<=MAX_BYTES,'Catalogue too large');
  check(digest(JSON.stringify(m.packs))===m.version,'Index checksum mismatch');
  check(fits({_id:releaseKey(m.version),kind:'release',release:m.version,payload:JSON.stringify(m),ready:false}),'Index item too large');
  return m;
}
