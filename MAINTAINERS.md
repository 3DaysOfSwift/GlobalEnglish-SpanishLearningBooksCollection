# Maintaining and preserving the collection

Keep at least two trusted organisation owners, document who reviews content and
ensure collaborators can operate the release workflow without one person's secrets.
Never share individual account credentials. Repository permissions and branch
protection must be configured by organisation administrators; these files do not
configure them automatically.

Before releasing: review the content diff and licensing notices, run validation,
then run the manual publication workflow on main. The workflow uses GitHub's scoped
job token. It needs no Wix configuration or long-lived publishing secret.

Do not modify or delete published pack assets. Fix errors in source, preserve IDs,
then publish a new release. Retain old assets while clients may still reference them.
To roll back, mark a known-good existing release as latest; its complete index will
become the source for the next client sync. Content removal requires a new index,
not simply deleting an asset and breaking existing readers.

Back up source with `git clone --mirror`, and separately preserve release assets:
Git history does not contain the generated downloads. Rebuild outputs deterministically
from a release's source tag, or copy its assets to an independent static host.
Keep downloaded packs available offline in clients. A migration to another host
requires updating the download origin in the client, unless a separately managed
stable domain is introduced later.
