# Global English–Spanish Learning Books Collection

**Stories to bring Spanish to life—for this generation and the next.**

A portable collection of bilingual microbooks, scripts and verb stories for native
English speakers learning Spanish. Created for Cuentiva, with the ambition of helping
other learning tools and communities too.

This repository contains 52 original demo titles. They are fictional learning
material, not verified community memoirs. Native-speaker review and production
content licensing remain pending. Public availability is not itself an open content
licence: see [CONTENT-LICENSE.md](CONTENT-LICENSE.md).

## A library you can preserve

Books and author profiles are plain JSON. There is no database, Wix subscription,
private API key or account requirement for downloading published packs. Clone the
repository to preserve the source; build and mirror the packs to another host when
needed. Keep multiple trusted organisation owners and maintainers so continuity does
not depend on one person. [Maintainer guide](MAINTAINERS.md).

## Read or build

- `content/books.json`: aligned Spanish–English sentences, vocabulary and metadata.
- `content/authors.json`: the text profiles referenced by those books.
- Each generated pack contains up to **13 complete books plus their authors**.
- Stable pack IDs and SHA-256 checksums let readers fetch only new or changed content.
- No uploaded images or recorded audio: apps can provide their own presentation and speech.

With Node 22 or later, no dependencies:

```sh
npm test
npm run build
```

Outputs appear in `dist/`. The small `catalogue.json` index lists pack IDs, checksums,
byte sizes, book counts and release tags. A pack filename is `<id>-<checksum>.json`.
Publish through the manual **Publish reviewed library** GitHub Actions workflow, or
run `node tools/publish.js` after building with an authenticated GitHub CLI.

## Current app alignment

The current baseline matches Cuentiva editorial edition 4: 52 books, 156 chapters,
792 bilingual passages, 5,771 matching pairs and nine current storyteller profiles.
Book IDs remain unchanged. `ending` holds chapter three and `editorialRevision`
identifies the editorial edition; edition 4 requires three nonempty chapters and
a complete matching glossary with at least 30 entries per book.

When both repositories are siblings, export the app baseline and verify it with:

```sh
python3 ../Cuentiva/scripts/sync_publishing_library.py
python3 ../Cuentiva/scripts/sync_publishing_library.py --check
npm test
npm run build
```

Exporting replaces the publishing source with the app baseline; use `--check` to
check alignment without changing files. For subsequent published corrections,
preserve book IDs and increment `editorialRevision` on changed books. Keep passage
IDs for unchanged text; use new IDs for rewritten passages. Review translations
and regenerate vocabulary/glossaries when text changes. Publication is still a
separate manual action; committing these files does not publish a release.

## Download contract

Catalogue:
`https://github.com/3DaysOfSwift/GlobalEnglish-SpanishLearningBooksCollection/releases/latest/download/catalogue.json`

For each index entry, fetch:
`https://github.com/3DaysOfSwift/GlobalEnglish-SpanishLearningBooksCollection/releases/download/<release>/<id>-<checksum>.json`

Follow HTTPS redirects. Verify byte length and SHA-256 before using a pack. Cache by
ID and checksum, rather than release tag. A new release may reference unchanged pack
contents; these should not be downloaded again. Read locally when offline.

Publishers upload a draft release first, then publish it only after every asset is
present. Published pack revisions must never be edited or replaced. Corrections
create a new release. GitHub hosts a copy of each pack for each release; readers
still reuse identical cached packs. Deduplicated hosting can be introduced later.

## Contribute thoughtfully

Submit a pull request; publication is a separate maintainer action. Automated checks
verify structure, IDs, references and size. They cannot establish translation quality,
truth, safety or originality. See [contribution guidance](CONTRIBUTING.md).

## Limits and independence

The initial format limits each pack to 400 KiB and 13 books, and the index to 400 KiB.
The current builder caps a catalogue at 20,000 titles and 2,000 packs. Supporting the
proposed 89,000-title collection requires a paginated index and client work; it is not
supported merely because files are hosted on GitHub. Current Cuentiva loads its
catalogue into memory and will also need paging at that size.

GitHub remains a hosting dependency, with no guaranteed launch capacity from this
project. Keep mirrors, backups and a tested alternative download origin as the
collection grows. No claim of 100,000-user load testing is made.

[GitHub release documentation](https://docs.github.com/en/repositories/releasing-projects-on-github/about-releases)
