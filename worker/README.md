# Sacramento ingestion worker

This server-side worker owns OCR, page extraction, and Qdrant Cloud Inference
ingestion. It never sends private documents to a public collection.

System requirements:

- Python 3.11+
- `ocrmypdf` and Tesseract with the English language pack
- `QDRANT_URL` and a rotated `QDRANT_API_KEY` in the worker secret store

Create the three versioned collections without changing live aliases:

```bash
python worker/sacramento_ingest.py --bootstrap
```

Dry-run and ingest a Drive manifest:

```bash
python worker/sacramento_ingest.py --manifest work/foia-drive-manifest.json --dry-run
python worker/sacramento_ingest.py --manifest work/foia-drive-manifest.json
```

Index normalized Sacramento Lambda appeals from Supabase into the prior-appeal
collection:

```bash
python worker/sacramento_ingest.py --process-appeal-comps
```

Private case documents require an appeal filter and are redacted before
embedding:

```bash
python worker/sacramento_ingest.py --manifest private.json --visibility private_case --appeal-id APPEAL_UUID
```

The nightly worker processes queued Supabase case uploads, retries failures,
redacts content before embedding, and does not reprocess indexed mappings:

```bash
python worker/sacramento_ingest.py --process-private-queue
```

Only after the evaluation gate passes, atomically switch the stable aliases:

```bash
python worker/sacramento_ingest.py --activate-aliases
```
