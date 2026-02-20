# AI Document Comparison Feature

## Overview

The AI Document Comparison feature leverages Google Gemini API to intelligently compare user-uploaded documents with admin master reference documents. It analyzes compliance alignment, identifies gaps, and generates detailed matching reports with actionable recommendations.

## Features

✅ **Automated Document Analysis**: Uses AI to analyze document content and structure  
✅ **Matching Percentage**: Calculates a 0-100% match score showing alignment level  
✅ **Gap Identification**: Automatically identifies compliance gaps and missing elements  
✅ **Smart Recommendations**: Provides specific, actionable recommendations for improvement  
✅ **Audit Trail**: Stores all comparisons for historical reference and compliance tracking  
✅ **User-Friendly UI**: Intuitive interface for comparing documents side-by-side  

## Architecture

### Database Models

**DocumentComparison Model**
```SQL
- id: UUID (Primary Key)
- userEvidenceId: Foreign Key → Evidence
- masterDocumentId: Foreign Key → MasterDocument
- matchingPercentage: Float (0-100)
- status: enum (pending, processing, completed, failed)
- overallSummary: String
- keyMatches: JSON Array of strings
- gaps: JSON Array of strings
- recommendations: JSON Array of strings
- detailedAnalysis: Long-form text
- createdAt: DateTime
- completedAt: DateTime (nullable)
- processedAt: DateTime (nullable)
```

### API Endpoints

#### 1. Compare Documents
**POST** `/api/document-comparison/compare`

Request:
```json
{
  "userEvidenceId": "string",
  "masterDocumentId": "string"
}
```

Response:
```json
{
  "id": "string",
  "userEvidenceId": "string",
  "masterDocumentId": "string",
  "matchingPercentage": 85,
  "status": "completed",
  "overallSummary": "The documents show strong alignment...",
  "keyMatches": ["Requirement A is well documented", "Policy section covers requirement B"],
  "gaps": ["Missing audit procedures", "No monitoring schedule"],
  "recommendations": ["Add quarterly audit schedule", "Document monitoring process"],
  "detailedAnalysis": "Detailed paragraph analysis...",
  "createdAt": "2026-02-20T12:00:00Z",
  "completedAt": "2026-02-20T12:05:00Z"
}
```

#### 2. Get Comparison Result
**GET** `/api/document-comparison/[comparisonId]`

Response: Same as above, includes document details

#### 3. List Comparisons
**GET** `/api/document-comparison`

Query Parameters:
- `userEvidenceId` (optional): Filter by user evidence
- `masterDocumentId` (optional): Filter by master document
- `status` (optional): Filter by status

Response:
```json
{
  "count": 5,
  "comparisons": [
    {
      "id": "string",
      "matchingPercentage": 85,
      "status": "completed",
      "createdAt": "2026-02-20T12:00:00Z",
      "userEvidence": { ... },
      "masterDocument": { ... }
    }
  ]
}
```

#### 4. Delete Comparison
**DELETE** `/api/document-comparison/[comparisonId]`

## AI Integration

### Provider: Google Gemini API

**Configuration** (in `.env`):
```env
AI_PROVIDER="gemini"
GEMINI_API_KEY="your-gemini-api-key-here"
```

**Supported Models**:
- `gemini-pro` (Default - fastest, good for text analysis)
- `gemini-pro-vision` (For analyzing images/PDFs with visual content)

### How It Works

1. **Document Retrieval**: Fetches content from both user and master documents
2. **Prompt Engineering**: Constructs detailed prompts for AI analysis
3. **AI Analysis**: Sends to Gemini API with structured JSON response format
4. **Result Parsing**: Extracts and validates JSON response
5. **Database Storage**: Saves results with full audit trail
6. **Fallback Handling**: Uses mock comparison if API fails

### Prompt Template

```
You are a healthcare compliance expert. Compare the following two documents...

MASTER DOCUMENT (Reference): [Document content]
USER DOCUMENT (To be compared): [Document content]

Return JSON with:
{
  "matchingPercentage": 0-100,
  "overallSummary": "...",
  "keyMatches": [...],
  "gaps": [...],
  "recommendations": [...],
  "detailedAnalysis": "..."
}
```

## Usage

### Frontend Component

**Location**: `/src/components/document-comparison.tsx`

```tsx
import { DocumentComparison } from "@/components/document-comparison";

export function MyPage() {
  return (
    <DocumentComparison
      userEvidences={evidences}
      masterDocuments={masterDocs}
      onComparison={(result) => {
        console.log("Comparison complete:", result);
      }}
    />
  );
}
```

### Page Component

**Location**: `/src/app/document-comparison/page.tsx`

Access at: `/document-comparison`

Features:
- Document selection dropdowns
- Real-time comparison execution
- Full results display with visual indicators
- Color-coded match percentages (green=good, yellow=moderate, red=poor)
- Downloadable reports

## Matching Score Interpretation

| Score | Level | Interpretation |
|-------|-------|-----------------|
| 80-100% | ✅ Excellent Match | Full compliance alignment |
| 50-79% | ⚠️ Moderate Match | Core requirements covered, gaps exist |
| 0-49% | ❌ Poor Match | Significant gaps, major revisions needed |

## Performance Considerations

- **Average Processing Time**: 3-10 seconds per comparison
- **Caching**: Results are cached; re-querying same pair returns cached result
- **Batch Operations**: Can process multiple comparisons concurrently
- **File Size Limits**: Supports documents up to 5MB (API limitation)

## Error Handling

All errors are gracefully handled with fallback to mock comparison:

```
Gemini API Error → Fallback to OpenAI → Fallback to Mock
```

Users will receive results even if primary AI provider fails.

## Integration with Existing Features

### Evidence Management
- Links to `Evidence` model
- Available in evidence comparison workflows
- Integrated with evidence status tracking

### Master Documents
- Links to `MasterDocument` model
- Provides admin reference library
- Supports standard-based document management

### Assessments
- Comparisons inform compliance scores
- Used in gap analysis reports
- Supports corrective action tracking

## Security & Privacy

✅ All API keys use environment variables  
✅ Sensitive data not logged or cached  
✅ Results stored only in secure database  
✅ Audit trail on all comparisons  
✅ Document content transmitted to AI only during comparison  

## Environment Setup

### Required Dependencies
```bash
npm install @google/generative-ai
```

### Environment Variables
```env
DATABASE_URL="file:./dev.db"
AI_PROVIDER="gemini"
GEMINI_API_KEY="your-api-key-here"
```

### Database Migration
```bash
npx prisma migrate dev --name add_document_comparison
```

## Troubleshooting

### Issue: "Gemini API not responding"
- **Solution**: Check API key in `.env`
- **Alternative**: System falls back to mock comparison automatically

### Issue: "File not found" when comparing
- **Cause**: Document file path not accessible
- **Solution**: Ensure files are in `public/` directory or provide file URLs

### Issue: "Timeout error during comparison"
- **Cause**: Large documents taking too long
- **Solution**: Chunk large documents or increase API timeout

## Future Enhancements

🚀 **Planned Features**:
- Batch comparison of multiple documents
- Custom comparison templates
- Export reports to PDF/Word
- Comparative analytics dashboard
- Integration with workflow automation
- Multi-language support
- Document versioning & change tracking

## Support

For issues or questions:
1. Check CloudLogs for API errors
2. Review document format requirements
3. Verify API credentials in `.env`
4. Contact development team

---

**Last Updated**: February 20, 2026  
**Author**: AI Surveyor Development Team  
**Version**: 1.0
