

## Problem

The PDF text extraction edge function fails because:
1. `pdf-parse` requires Node.js `fs.readFileSync`, which doesn't exist in Deno runtime
2. The manual BT/ET fallback extracts 0 characters because the PDF uses compressed content streams

The PDF downloads successfully (2707 bytes confirmed in logs), but no text can be extracted.

## Solution

Replace `pdf-parse` with `unpdf` -- a library specifically designed for serverless/Deno environments (built on a nodeless PDF.js redistribution). It provides `extractText` and `getDocumentProxy` functions that work without Node.js built-ins.

## Changes

### 1. Rewrite `supabase/functions/extract-pdf-text/index.ts`

- Remove the `pdf-parse` import and manual BT/ET extraction fallback
- Import `extractText` and `getDocumentProxy` from `unpdf` via esm.sh
- Use `getDocumentProxy` with the PDF `Uint8Array` data, then `extractText` to get page text
- Keep the existing download logic (Supabase storage client with service role) which works correctly
- Keep the existing status update and response format

### Technical Details

```text
Old flow:
  pdf-parse (fails: no fs.readFileSync) -> manual BT/ET regex (fails: compressed streams) -> 0 chars

New flow:
  unpdf/getDocumentProxy + extractText (Deno-compatible, handles compressed streams) -> extracted text
```

The `unpdf` library bundles a serverless-optimized PDF.js build that handles:
- Compressed content streams (FlateDecode, etc.)
- CMap character mapping
- Font encoding tables
- All standard PDF text extraction scenarios

No other files need to change -- the edge function response format and the frontend handling remain the same.

