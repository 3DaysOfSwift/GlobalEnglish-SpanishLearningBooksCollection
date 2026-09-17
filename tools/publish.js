// Run after tests and build. GitHub CLI handles authentication; no token is stored here.
import {execFileSync} from 'node:child_process';
import {readFile, readdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const repo=process.env.GITHUB_REPOSITORY || '3DaysOfSwift/GlobalEnglish-SpanishLearningBooksCollection';
const directory=fileURLToPath(new URL('../dist/',import.meta.url));
const {tag}=JSON.parse(await readFile(new URL('../dist/release.json',import.meta.url)));
const files=(await readdir(directory)).filter(name=>name.endsWith('.json') && name!=='release.json').map(name=>`${directory}/${name}`);
const gh=args=>execFileSync('gh',args,{stdio:['ignore','pipe','inherit']}).toString();
let existing;
try {existing=JSON.parse(gh(['release','view',tag,'--repo',repo,'--json','isDraft']));} catch { /* create below; authentication failures still stop creation */ }
if(existing && !existing.isDraft)throw Error('This immutable release is already published; no assets were changed.');
if(!existing)gh(['release','create',tag,'--repo',repo,'--target',process.env.GITHUB_SHA || 'main','--draft','--title',tag,'--notes','Reviewed catalogue snapshot. Each pack includes its authors. Current seed content retains its editorial and licensing notices.']);
gh(['release','upload',tag,...files,'--repo',repo,'--clobber']);
// Only advertise the new index after all its files are uploaded.
gh(['release','edit',tag,'--repo',repo,'--draft=false','--latest']);
console.log(`Published https://github.com/${repo}/releases/tag/${tag}`);
