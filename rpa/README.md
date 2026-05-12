# RPA Design Notes

This folder contains design documentation for the UiPath RPA integration.

## Expected UiPath Flow

1. **Read files** from a watched folder (PDF / DOCX / TXT)
2. **HTTP POST** to `POST /api/upload` with the file attached
3. **Receive** `{ extractedText, articleId }` from the API
4. **HTTP PATCH** to `PATCH /api/articles/:id/status` to advance workflow
5. **Log result** to `ImportBatch` via `POST /api/import-batch`

## Supported API Endpoints (Phase 9)

| Method | Endpoint                    | Purpose                      |
|--------|-----------------------------|------------------------------|
| POST   | /api/upload                 | Upload & extract file        |
| POST   | /api/articles               | Create draft article         |
| POST   | /api/import-batch           | Log RPA batch run            |
| GET    | /api/articles?search=&status=| Search existing articles    |

> Backend API is RPA-ready from Phase 9 onward.

## Assignment Report Preview

<embed src="../DHL%20DAC%203.0%20Assignment_Yap%20Jia%20Xin.pdf" type="application/pdf" width="100%" height="800px" />

[View or Download Full Assignment PDF](../DHL%20DAC%203.0%20Assignment_Yap%20Jia%20Xin.pdf)
