import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { ActionableErrorMessage } from './ActionableErrorMessage';
import type { ErrorAnalysis } from '@/api/errors';

// Mock the API modules
vi.mock('@/api/replay', () => ({
  executeReplay: vi.fn(),
}));

vi.mock('@/components/Toast', () => ({
  useToast: () => ({
    success: vi.fn(),
    error: vi.fn(),
  }),
}));

const mockAnalysis: ErrorAnalysis = {
  category: 'rate_limit',
  severity: 'HIGH',
  error_type: 'RateLimitError',
  error_message: 'Rate limit exceeded. Please retry after 30 seconds.',
  error_code: 429,
  recommendations: [
    {
      title: 'Wait and retry with exponential backoff',
      description: 'Rate limits reset after a short period. The replay engine will automatically retry.',
      action_type: 'replay',
      replay_params: {},
      code_snippet: null,
      confidence: 0.95,
      estimated_cost_impact: null,
    },
    {
      title: 'Switch to gpt-4o-mini for lower rate limits',
      description: 'gpt-4o-mini has higher rate limits and is 83% cheaper.',
      action_type: 'replay',
      replay_params: { model: 'gpt-4o-mini' },
      code_snippet: 'client.chat.completions.create(model="gpt-4o-mini", ...)',
      confidence: 0.85,
      estimated_cost_impact: '-83% cost, +200% rate limit',
    },
  ],
  context: {
    'llm.model': 'gpt-4',
    'llm.total_tokens': 150,
  },
};

describe('ActionableErrorMessage', () => {
  it('renders error message and category', () => {
    render(
      <ActionableErrorMessage
        spanId="span-123"
        spanName="openai.chat.completions.create"
        traceId="trace-456"
        analysis={mockAnalysis}
      />
    );

    expect(screen.getByText('Rate Limit Exceeded')).toBeInTheDocument();
    expect(screen.getByText(/Rate limit exceeded/i)).toBeInTheDocument();
  });

  it('displays severity badge', () => {
    render(
      <ActionableErrorMessage
        spanId="span-123"
        spanName="openai.chat.completions.create"
        traceId="trace-456"
        analysis={mockAnalysis}
      />
    );

    expect(screen.getByText('HIGH')).toBeInTheDocument();
  });

  it('applies correct severity color classes', () => {
    const { container } = render(
      <ActionableErrorMessage
        spanId="span-123"
        spanName="openai.chat.completions.create"
        traceId="trace-456"
        analysis={mockAnalysis}
      />
    );

    const errorBox = container.querySelector('.border-orange-400');
    expect(errorBox).toBeInTheDocument();
  });

  it('renders all recommendations', () => {
    render(
      <ActionableErrorMessage
        spanId="span-123"
        spanName="openai.chat.completions.create"
        traceId="trace-456"
        analysis={mockAnalysis}
      />
    );

    expect(screen.getByText('Wait and retry with exponential backoff')).toBeInTheDocument();
    expect(screen.getByText('Switch to gpt-4o-mini for lower rate limits')).toBeInTheDocument();
  });

  it('displays confidence scores', () => {
    render(
      <ActionableErrorMessage
        spanId="span-123"
        spanName="openai.chat.completions.create"
        traceId="trace-456"
        analysis={mockAnalysis}
      />
    );

    expect(screen.getByText('95% confidence')).toBeInTheDocument();
    expect(screen.getByText('85% confidence')).toBeInTheDocument();
  });

  it('displays cost impact when available', () => {
    render(
      <ActionableErrorMessage
        spanId="span-123"
        spanName="openai.chat.completions.create"
        traceId="trace-456"
        analysis={mockAnalysis}
      />
    );

    expect(screen.getByText(/Impact: -83% cost, \+200% rate limit/)).toBeInTheDocument();
  });

  it('renders code snippet with copy button', () => {
    render(
      <ActionableErrorMessage
        spanId="span-123"
        spanName="openai.chat.completions.create"
        traceId="trace-456"
        analysis={mockAnalysis}
      />
    );

    expect(screen.getByText('Code Example:')).toBeInTheDocument();
    expect(screen.getByText(/client.chat.completions.create/)).toBeInTheDocument();
    expect(screen.getByText('Copy')).toBeInTheDocument();
  });

  it('copies code snippet to clipboard when copy button clicked', async () => {
    const user = userEvent.setup();
    const mockWriteText = vi.fn();
    Object.assign(navigator, {
      clipboard: {
        writeText: mockWriteText,
      },
    });

    render(
      <ActionableErrorMessage
        spanId="span-123"
        spanName="openai.chat.completions.create"
        traceId="trace-456"
        analysis={mockAnalysis}
      />
    );

    const copyButtons = screen.getAllByText('Copy');
    await user.click(copyButtons[0]);

    expect(mockWriteText).toHaveBeenCalledWith(
      'client.chat.completions.create(model="gpt-4o-mini", ...)'
    );
  });

  it('renders "Try This Fix" button for replay recommendations', () => {
    render(
      <ActionableErrorMessage
        spanId="span-123"
        spanName="openai.chat.completions.create"
        traceId="trace-456"
        analysis={mockAnalysis}
      />
    );

    const fixButtons = screen.getAllByText('Try This Fix');
    expect(fixButtons).toHaveLength(2); // Both recommendations have replay_params
  });

  it('triggers replay when "Try This Fix" clicked', async () => {
    const user = userEvent.setup();
    const mockOnReplayTriggered = vi.fn();
    const { executeReplay } = await import('@/api/replay');

    (executeReplay as any).mockResolvedValue({
      execution_id: 'replay-789',
    });

    render(
      <ActionableErrorMessage
        spanId="span-123"
        spanName="openai.chat.completions.create"
        traceId="trace-456"
        analysis={mockAnalysis}
        onReplayTriggered={mockOnReplayTriggered}
      />
    );

    const fixButtons = screen.getAllByText('Try This Fix');
    await user.click(fixButtons[0]);

    await waitFor(() => {
      expect(executeReplay).toHaveBeenCalledWith({
        trace_id: 'trace-456',
        parameters: {},
      });
    });

    expect(mockOnReplayTriggered).toHaveBeenCalledWith('replay-789');
  });

  it('shows error details section collapsed by default', () => {
    render(
      <ActionableErrorMessage
        spanId="span-123"
        spanName="openai.chat.completions.create"
        traceId="trace-456"
        analysis={mockAnalysis}
      />
    );

    expect(screen.getByText('View Error Details')).toBeInTheDocument();
    // Context should not be visible initially
    expect(screen.queryByText('Error Type:')).not.toBeVisible();
  });

  it('expands error details when clicked', async () => {
    const user = userEvent.setup();
    render(
      <ActionableErrorMessage
        spanId="span-123"
        spanName="openai.chat.completions.create"
        traceId="trace-456"
        analysis={mockAnalysis}
      />
    );

    await user.click(screen.getByText('View Error Details'));

    await waitFor(() => {
      expect(screen.getByText('Error Type:')).toBeVisible();
      expect(screen.getByText('RateLimitError')).toBeVisible();
      expect(screen.getByText('Status Code:')).toBeVisible();
      expect(screen.getByText('429')).toBeVisible();
    });
  });

  it('displays context information in details', async () => {
    const user = userEvent.setup();
    render(
      <ActionableErrorMessage
        spanId="span-123"
        spanName="openai.chat.completions.create"
        traceId="trace-456"
        analysis={mockAnalysis}
      />
    );

    await user.click(screen.getByText('View Error Details'));

    await waitFor(() => {
      expect(screen.getByText('Context:')).toBeVisible();
      expect(screen.getByText(/"llm.model": "gpt-4"/)).toBeVisible();
    });
  });

  it('handles critical severity with correct styling', () => {
    const criticalAnalysis = {
      ...mockAnalysis,
      severity: 'CRITICAL' as const,
    };

    const { container } = render(
      <ActionableErrorMessage
        spanId="span-123"
        spanName="openai.chat.completions.create"
        traceId="trace-456"
        analysis={criticalAnalysis}
      />
    );

    const errorBox = container.querySelector('.border-red-400');
    expect(errorBox).toBeInTheDocument();
  });

  it('handles recommendations without replay params', () => {
    const analysisWithCodeChange = {
      ...mockAnalysis,
      recommendations: [
        {
          title: 'Compress your prompt',
          description: 'Remove unnecessary examples to reduce token usage.',
          action_type: 'code_change' as const,
          replay_params: null,
          code_snippet: 'system_prompt = "Be concise."',
          confidence: 0.7,
          estimated_cost_impact: '-20% tokens',
        },
      ],
    };

    render(
      <ActionableErrorMessage
        spanId="span-123"
        spanName="openai.chat.completions.create"
        traceId="trace-456"
        analysis={analysisWithCodeChange}
      />
    );

    expect(screen.getByText('Compress your prompt')).toBeInTheDocument();
    // Should not have "Try This Fix" button since it's a code_change
    expect(screen.queryByText('Try This Fix')).not.toBeInTheDocument();
  });

  it('handles error during replay execution', async () => {
    const user = userEvent.setup();
    const { executeReplay } = await import('@/api/replay');

    (executeReplay as any).mockRejectedValue(new Error('Network error'));

    render(
      <ActionableErrorMessage
        spanId="span-123"
        spanName="openai.chat.completions.create"
        traceId="trace-456"
        analysis={mockAnalysis}
      />
    );

    const fixButtons = screen.getAllByText('Try This Fix');
    await user.click(fixButtons[0]);

    await waitFor(() => {
      expect(executeReplay).toHaveBeenCalled();
    });

    // Should show error button text again after failure
    expect(screen.getByText('Try This Fix')).toBeInTheDocument();
  });

  it('disables button during replay execution', async () => {
    const user = userEvent.setup();
    const { executeReplay } = await import('@/api/replay');

    // Make the API call hang to test loading state
    let resolveReplay: any;
    (executeReplay as any).mockReturnValue(
      new Promise((resolve) => {
        resolveReplay = resolve;
      })
    );

    render(
      <ActionableErrorMessage
        spanId="span-123"
        spanName="openai.chat.completions.create"
        traceId="trace-456"
        analysis={mockAnalysis}
      />
    );

    const fixButtons = screen.getAllByText('Try This Fix');
    await user.click(fixButtons[0]);

    // Should show loading text
    await waitFor(() => {
      expect(screen.getByText('Starting replay...')).toBeInTheDocument();
    });

    // Resolve the promise
    resolveReplay({ execution_id: 'replay-789' });
  });

  it('renders span name in error message', () => {
    render(
      <ActionableErrorMessage
        spanId="span-123"
        spanName="openai.chat.completions.create"
        traceId="trace-456"
        analysis={mockAnalysis}
      />
    );

    expect(screen.getByText('openai.chat.completions.create')).toBeInTheDocument();
  });
});
