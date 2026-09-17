import {readFile, mkdir, writeFile, rm} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
import {prepare, digest, ROW_BYTES} from './schema.js';
export function build(books,authors) {
  const result=prepare(books,authors);
  const tag='library-'+result.manifest.version;
  const packs=result.manifest.packs.map(ref=>({...ref,release:tag}));
  const manifest={schema:2,version:digest(JSON.stringify(packs)),packs};
  if(Buffer.byteLength(JSON.stringify(manifest))>ROW_BYTES)throw Error('Catalogue index is too large');
  return {tag,manifest,files:result.packs.map(row=>{const pack=JSON.parse(row.payload);return {name:`${pack.id}-${row.release}.json`,payload:row.payload};})};
}
if(process.argv[1] && resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  const books=JSON.parse(await readFile(new URL('../content/books.json',import.meta.url),'utf8'));
  const authors=JSON.parse(await readFile(new URL('../content/authors.json',import.meta.url),'utf8'));
  const result=build(books,authors),dist=new URL('../dist/',import.meta.url);
  await rm(dist,{recursive:true,force:true});await mkdir(dist,{recursive:true});
  for(const file of result.files)await writeFile(new URL(file.name,dist),file.payload);
  await writeFile(new URL('catalogue.json',dist),JSON.stringify(result.manifest));
  await writeFile(new URL('release.json',dist),JSON.stringify({tag:result.tag,books:books.length,packs:result.files.length}));
  console.log(`Built ${books.length} books in ${result.files.length} self-contained packs. Release ${result.tag}`);
}
