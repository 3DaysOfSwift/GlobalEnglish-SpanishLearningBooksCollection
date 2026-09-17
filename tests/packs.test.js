import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {build} from '../tools/build.js';
import {digest, validatePack} from '../tools/schema.js';
const books=JSON.parse(await readFile(new URL('../content/books.json',import.meta.url)));
const authors=JSON.parse(await readFile(new URL('../content/authors.json',import.meta.url)));
test('deterministic release, complete author data and checksum verified assets',()=>{
 const result=build(books,authors);assert.deepEqual(result,build(books,authors));
 assert.equal(result.files.length,4);assert.equal(result.manifest.packs.reduce((n,p)=>n+p.books,0),52);
 result.files.forEach((file,i)=>{const ref=result.manifest.packs[i],p=validatePack(JSON.parse(file.payload));assert.equal(digest(file.payload),ref.checksum);assert.equal(Buffer.byteLength(file.payload),ref.bytes);assert.equal(ref.release,result.tag);assert.equal(file.name,`${p.id}-${ref.checksum}.json`);});
});
test('editing content changes revision without changing other pack checksums',()=>{
 const before=build(books,authors),changed=structuredClone(books);changed[0].summary+=' Revised.';const after=build(changed,authors);
 assert.notEqual(before.tag,after.tag);assert.equal(before.manifest.packs[0].id,after.manifest.packs[0].id);
 assert.notEqual(before.manifest.packs[0].checksum,after.manifest.packs[0].checksum);
 assert.deepEqual(before.manifest.packs.slice(1).map(p=>p.checksum),after.manifest.packs.slice(1).map(p=>p.checksum));
});
test('reject missing profiles, duplicate books, media and oversized content',()=>{
 assert.throws(()=>build(books,[]));assert.throws(()=>build([books[0],books[0]],authors));
 assert.throws(()=>build([{...books[0],image:'upload.png'}],authors));
 assert.throws(()=>build([{...books[0],summary:'x'.repeat(450000)}],authors));
});
