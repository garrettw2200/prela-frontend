/**
 * Tests for HallucinationDetection Component
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import userEvent from '@testing-library/user-event';
import HallucinationDetection from './HallucinationDetection';
import * as errorsApi from '../../api/errors';

// Mock the API
vi.mock('../../api/errors', () => ({
  fetchHallucinationAnalysis: vi.fn(),
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('HallucinationDetection', () => {
  const mockAnalysis = [
    {
      trace_id: 'trace-123',
      span_id: 'span-456',
      output_text: 'The Eiffel Tower was completed in 1887. It stands 324 meters tall.',
      context_chunks: [
        'The Eiffel Tower was completed in 1889.',
        'The tower stands at a height of 324 meters.',
      ],
      claims: [
        {
          claim: {
            text: 'The Eiffel Tower was completed in 1887.',
            sentence_index: 0,
            start_char: 0,
            end_char: 42,
          },
          is_grounded: false,
          confidence: 0.65,
          similarity_score: 0.65,
          supporting_context: null,
          context_index: null,
        },
        {
          claim: {
            text: 'It stands 324 meters tall.',
            sentence_index: 1,
            start_char: 43,
            end_char: 69,
          },
          is_grounded: true,
          confidence: 0.92,
          similarity_score: 0.92,
          supporting_context: 'The tower stands at a height of 324 meters.',
          context_index: 1,
        },
      ],
      hallucination_detected: true,
      overall_confidence: 0.785,
      ungrounded_claim_count: 1,
      grounded_claim_count: 1,
      similarity_threshold: 0.7,
      encoder_available: true,
    },
  ];

  it('renders loading state', () => {
    vi.mocked(errorsApi.fetchHallucinationAnalysis).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    render(<HallucinationDetection projectId="proj-1" traceId="trace-123" />, {
      wrapper: createWrapper(),
    });

    expect(screen.getByText('Analyzing for hallucinations...')).toBeInTheDocument();
  });

  it('renders error state when no LLM spans found', async () => {
    vi.mocked(errorsApi.fetchHallucinationAnalysis).mockRejectedValue(
      new Error('No LLM spans with retrieval context found in this trace')
    );

    render(<HallucinationDetection projectId="proj-1" traceId="trace-123" />, {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(screen.getByText('No hallucination analysis available')).toBeInTheDocument();
    });
  });

  it('renders hallucination detected', async () => {
    vi.mocked(errorsApi.fetchHallucinationAnalysis).mockResolvedValue(mockAnalysis);

    render(<HallucinationDetection projectId="proj-1" traceId="trace-123" />, {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(screen.getByText('Hallucination Detection')).toBeInTheDocument();
      expect(screen.getByText('Hallucination Detected')).toBeInTheDocument();
    });
  });

  it('displays claim counts', async () => {
    vi.mocked(errorsApi.fetchHallucinationAnalysis).mockResolvedValue(mockAnalysis);

    render(<HallucinationDetection projectId="proj-1" traceId="trace-123" />, {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(screen.getByText(/1 grounded, 1 ungrounded/)).toBeInTheDocument();
    });
  });

  it('displays confidence score', async () => {
    vi.mocked(errorsApi.fetchHallucinationAnalysis).mockResolvedValue(mockAnalysis);

    render(<HallucinationDetection projectId="proj-1" traceId="trace-123" />, {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(screen.getByText(/Confidence: 79%/)).toBeInTheDocument();
    });
  });

  it('shows encoder availability badge', async () => {
    vi.mocked(errorsApi.fetchHallucinationAnalysis).mockResolvedValue(mockAnalysis);

    render(<HallucinationDetection projectId="proj-1" traceId="trace-123" />, {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(screen.getByText('✓ AI-powered')).toBeInTheDocument();
    });
  });

  it('expands span details on click', async () => {
    const user = userEvent.setup();
    vi.mocked(errorsApi.fetchHallucinationAnalysis).mockResolvedValue(mockAnalysis);

    render(<HallucinationDetection projectId="proj-1" traceId="trace-123" />, {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(screen.getByText('Hallucination Detected')).toBeInTheDocument();
    });

    // Initially, detailed content should not be visible
    expect(screen.queryByText('LLM Output (Annotated)')).not.toBeInTheDocument();

    // Click to expand
    const header = screen.getByText('Hallucination Detected').closest('div');
    if (header) {
      await user.click(header);
    }

    // Now details should be visible
    await waitFor(() => {
      expect(screen.getByText('LLM Output (Annotated)')).toBeInTheDocument();
    });
  });

  it('displays annotated claims with color coding', async () => {
    const user = userEvent.setup();
    vi.mocked(errorsApi.fetchHallucinationAnalysis).mockResolvedValue(mockAnalysis);

    render(<HallucinationDetection projectId="proj-1" traceId="trace-123" />, {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(screen.getByText('Hallucination Detected')).toBeInTheDocument();
    });

    // Expand to see claims
    const header = screen.getByText('Hallucination Detected').closest('div');
    if (header) {
      await user.click(header);
    }

    await waitFor(() => {
      // Both claims should be rendered (use getAllByText since text appears in both annotated output and claim list)
      expect(screen.getAllByText('The Eiffel Tower was completed in 1887.').length).toBeGreaterThan(0);
      expect(screen.getAllByText('It stands 324 meters tall.').length).toBeGreaterThan(0);
    });
  });

  it('displays grounded claim details', async () => {
    const user = userEvent.setup();
    vi.mocked(errorsApi.fetchHallucinationAnalysis).mockResolvedValue(mockAnalysis);

    render(<HallucinationDetection projectId="proj-1" traceId="trace-123" />, {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(screen.getByText('Hallucination Detected')).toBeInTheDocument();
    });

    // Expand
    const header = screen.getByText('Hallucination Detected').closest('div');
    if (header) {
      await user.click(header);
    }

    await waitFor(() => {
      expect(screen.getByText('✓ Grounded')).toBeInTheDocument();
      expect(screen.getByText(/Similarity: 92%/)).toBeInTheDocument();
    });
  });

  it('displays ungrounded claim details', async () => {
    const user = userEvent.setup();
    vi.mocked(errorsApi.fetchHallucinationAnalysis).mockResolvedValue(mockAnalysis);

    render(<HallucinationDetection projectId="proj-1" traceId="trace-123" />, {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(screen.getByText('Hallucination Detected')).toBeInTheDocument();
    });

    // Expand
    const header = screen.getByText('Hallucination Detected').closest('div');
    if (header) {
      await user.click(header);
    }

    await waitFor(() => {
      expect(screen.getByText('✗ Ungrounded')).toBeInTheDocument();
      expect(screen.getByText(/Similarity: 65%/)).toBeInTheDocument();
    });
  });

  it('displays supporting context for grounded claims', async () => {
    const user = userEvent.setup();
    vi.mocked(errorsApi.fetchHallucinationAnalysis).mockResolvedValue(mockAnalysis);

    render(<HallucinationDetection projectId="proj-1" traceId="trace-123" />, {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(screen.getByText('Hallucination Detected')).toBeInTheDocument();
    });

    // Expand
    const header = screen.getByText('Hallucination Detected').closest('div');
    if (header) {
      await user.click(header);
    }

    await waitFor(() => {
      expect(screen.getByText('Supporting Context:')).toBeInTheDocument();
      // Text appears in both supporting context and retrieved context chunks
      expect(
        screen.getAllByText(/The tower stands at a height of 324 meters/).length
      ).toBeGreaterThan(0);
    });
  });

  it('displays retrieved context chunks', async () => {
    const user = userEvent.setup();
    vi.mocked(errorsApi.fetchHallucinationAnalysis).mockResolvedValue(mockAnalysis);

    render(<HallucinationDetection projectId="proj-1" traceId="trace-123" />, {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(screen.getByText('Hallucination Detected')).toBeInTheDocument();
    });

    // Expand
    const header = screen.getByText('Hallucination Detected').closest('div');
    if (header) {
      await user.click(header);
    }

    await waitFor(() => {
      expect(screen.getByText(/Retrieved Context \(2 chunks\)/)).toBeInTheDocument();
    });
  });

  it('renders all claims grounded state', async () => {
    const allGroundedAnalysis = [
      {
        ...mockAnalysis[0],
        hallucination_detected: false,
        ungrounded_claim_count: 0,
        grounded_claim_count: 2,
        claims: [
          {
            ...mockAnalysis[0].claims[0],
            is_grounded: true,
            confidence: 0.95,
            similarity_score: 0.95,
            supporting_context: 'The Eiffel Tower was completed in 1889.',
            context_index: 0,
          },
          mockAnalysis[0].claims[1],
        ],
      },
    ];

    vi.mocked(errorsApi.fetchHallucinationAnalysis).mockResolvedValue(allGroundedAnalysis);

    render(<HallucinationDetection projectId="proj-1" traceId="trace-123" />, {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(screen.getByText('All Claims Grounded')).toBeInTheDocument();
      expect(screen.getByText(/2 grounded, 0 ungrounded/)).toBeInTheDocument();
    });
  });

  it('uses custom similarity threshold', async () => {
    vi.mocked(errorsApi.fetchHallucinationAnalysis).mockResolvedValue(mockAnalysis);

    render(
      <HallucinationDetection projectId="proj-1" traceId="trace-123" similarityThreshold={0.8} />,
      {
        wrapper: createWrapper(),
      }
    );

    await waitFor(() => {
      expect(screen.getByText('Threshold: 0.80')).toBeInTheDocument();
    });

    expect(errorsApi.fetchHallucinationAnalysis).toHaveBeenCalledWith('proj-1', 'trace-123', 0.8);
  });

  it('returns null when no analyses available', async () => {
    vi.mocked(errorsApi.fetchHallucinationAnalysis).mockResolvedValue([]);

    const { container } = render(
      <HallucinationDetection projectId="proj-1" traceId="trace-123" />,
      {
        wrapper: createWrapper(),
      }
    );

    await waitFor(() => {
      expect(container.firstChild).toBeNull();
    });
  });
});
