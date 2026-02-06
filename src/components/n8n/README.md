# n8n Components

React components for visualizing n8n workflow observability data.

## Components

### WorkflowList

Displays a table of all n8n workflows with 24-hour metrics including:

- Execution count
- Success rate
- Average duration
- AI call statistics
- Token usage
- Costs

**Usage:**

```tsx
import { WorkflowList } from '@/components/n8n';

function N8nPage() {
  return (
    <div className="p-6">
      <WorkflowList projectId="my-project-id" />
    </div>
  );
}
```

**Features:**

- Auto-refresh every 30 seconds
- Click workflow name to view details
- Color-coded success rate badges:
  - Green: ≥95% success
  - Yellow: 80-94% success
  - Red: <80% success
- Human-readable formatting for durations, tokens, and timestamps
- Loading skeleton while fetching data
- Error handling with user-friendly messages
- Empty state when no workflows found

## API Integration

The components use the following API endpoints:

### GET /api/v1/n8n/workflows

List all n8n workflows with 24h metrics.

**Query Parameters:**
- `project_id` (required): Project ID

**Response:**
```json
{
  "workflows": [
    {
      "workflow_id": "abc123",
      "workflow_name": "Customer Support Bot",
      "last_execution": "2025-01-27T10:30:00Z",
      "execution_count_24h": 145,
      "success_rate_24h": 98.6,
      "avg_duration_ms": 2340.5,
      "total_ai_calls_24h": 290,
      "total_tokens_24h": 45600,
      "total_cost_24h": 1.23
    }
  ]
}
```

### GET /api/v1/n8n/workflows/{workflow_id}

Get detailed workflow information.

**Query Parameters:**
- `project_id` (required): Project ID

**Response:**
```json
{
  "workflow": { /* same as above */ },
  "executions": [
    {
      "execution_id": "exec-123",
      "started_at": "2025-01-27T10:30:00Z",
      "ended_at": "2025-01-27T10:30:05Z",
      "status": "success",
      "duration_ms": 2340.5,
      "total_tokens": 314,
      "cost_usd": 0.0089
    }
  ],
  "ai_nodes": [
    {
      "node_name": "OpenAI Chat",
      "model": "gpt-4",
      "vendor": "openai",
      "call_count": 145,
      "prompt_tokens": 30400,
      "completion_tokens": 15200,
      "avg_latency_ms": 1230.4
    }
  ]
}
```

## Styling

Components use Tailwind CSS classes for styling. The design follows a clean, professional aesthetic with:

- Gray color palette for neutral elements
- Indigo for interactive elements (links, buttons)
- Green/yellow/red for success rate indicators
- Proper spacing and typography hierarchy

## Dependencies

- `react` - UI framework
- `react-router-dom` - Navigation
- `@tanstack/react-query` - Data fetching and caching
- `date-fns` - Date formatting
- `axios` - HTTP client
- `tailwindcss` - Styling

## File Structure

```
src/components/n8n/
├── WorkflowList.tsx    # Main workflow table component
├── index.ts            # Component exports
└── README.md           # This file

src/api/
└── n8n.ts             # API client functions

src/components/ui/
└── LoadingSkeleton.tsx # Loading state component

src/lib/
└── utils.ts           # Utility functions
```

## Future Components

Planned components for the n8n observability dashboard:

- **WorkflowDetail**: Detailed view with execution history and node metrics
- **ExecutionTimeline**: Visual timeline of workflow execution
- **NodeMetrics**: AI node usage breakdown with charts
- **CostAnalysis**: Cost trends and breakdown by model/node
- **AlertConfig**: Configure alerts for workflow failures or cost thresholds
