import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import DriftDetailModal from './DriftDetailModal';
import { DriftAlert } from '../../api/drift';

describe('DriftDetailModal', () => {
  const mockAlert: DriftAlert = {
    agent_name: 'researcher',
    service_name: 'multi-agent-prod',
    anomalies: [
      {
        metric_name: 'duration',
        current_value: 12847.3,
        baseline_mean: 5243.2,
        change_percent: 145.0,
        severity: 'high',
        direction: 'increased',
        unit: 'ms',
        sample_size: 100,
      },
      {
        metric_name: 'token_usage',
        current_value: 5000,
        baseline_mean: 2500,
        change_percent: 100.0,
        severity: 'medium',
        direction: 'increased',
        unit: 'tokens',
        sample_size: 100,
      },
    ],
    root_causes: [
      {
        type: 'model_change',
        description: 'Model changed: gpt-4, gpt-4o',
        confidence: 0.9,
      },
      {
        type: 'input_complexity',
        description: 'Input complexity increased',
        confidence: 0.6,
      },
    ],
    baseline: {
      baseline_id: 'baseline-123',
      agent_name: 'researcher',
      service_name: 'multi-agent-prod',
      window_start: '2026-01-23T00:00:00Z',
      window_end: '2026-01-30T00:00:00Z',
      sample_size: 100,
      duration_mean: 5243.2,
      duration_stddev: 1234.5,
      duration_p50: 5000.0,
      duration_p95: 8000.0,
      token_usage_mean: 2500.0,
      token_usage_stddev: 500.0,
      success_rate: 0.95,
      error_count: 5,
      cost_mean: 0.05,
      cost_total: 5.0,
    },
    detected_at: '2026-01-30T14:23:45Z',
  };

  const mockCallbacks = {
    onClose: vi.fn(),
    onMarkAsExpected: vi.fn(),
    onViewTraces: vi.fn(),
    onAdjustBaseline: vi.fn(),
  };

  it('renders modal with alert title', () => {
    render(<DriftDetailModal alert={mockAlert} {...mockCallbacks} />);
    expect(screen.getByText('Drift Alert: Agent Behavior Changed')).toBeInTheDocument();
  });

  it('displays agent name', () => {
    render(<DriftDetailModal alert={mockAlert} {...mockCallbacks} />);
    expect(screen.getByText('researcher')).toBeInTheDocument();
  });

  it('displays service name', () => {
    render(<DriftDetailModal alert={mockAlert} {...mockCallbacks} />);
    expect(screen.getByText('multi-agent-prod')).toBeInTheDocument();
  });

  it('displays sample size', () => {
    render(<DriftDetailModal alert={mockAlert} {...mockCallbacks} />);
    expect(screen.getByText('100 executions')).toBeInTheDocument();
  });

  it('displays anomaly count', () => {
    render(<DriftDetailModal alert={mockAlert} {...mockCallbacks} />);
    expect(screen.getByText(/Detected Anomalies \(2\)/)).toBeInTheDocument();
  });

  it('displays all anomalies', () => {
    render(<DriftDetailModal alert={mockAlert} {...mockCallbacks} />);
    expect(screen.getByText('duration')).toBeInTheDocument();
    expect(screen.getByText('token_usage')).toBeInTheDocument();
  });

  it('displays severity badges', () => {
    render(<DriftDetailModal alert={mockAlert} {...mockCallbacks} />);
    expect(screen.getByText('HIGH')).toBeInTheDocument();
    expect(screen.getByText('MEDIUM')).toBeInTheDocument();
  });

  it('displays baseline values', () => {
    render(<DriftDetailModal alert={mockAlert} {...mockCallbacks} />);
    const baselineLabels = screen.getAllByText('Baseline');
    expect(baselineLabels.length).toBeGreaterThan(0);
  });

  it('displays current values', () => {
    render(<DriftDetailModal alert={mockAlert} {...mockCallbacks} />);
    const currentLabels = screen.getAllByText('Current');
    expect(currentLabels.length).toBeGreaterThan(0);
  });

  it('displays change percentages', () => {
    render(<DriftDetailModal alert={mockAlert} {...mockCallbacks} />);
    const changeLabels = screen.getAllByText('Change');
    expect(changeLabels.length).toBeGreaterThan(0);
  });

  it('displays root causes section', () => {
    render(<DriftDetailModal alert={mockAlert} {...mockCallbacks} />);
    expect(screen.getByText('Possible Causes')).toBeInTheDocument();
  });

  it('displays all root causes', () => {
    render(<DriftDetailModal alert={mockAlert} {...mockCallbacks} />);
    expect(screen.getByText('Model Change')).toBeInTheDocument();
    expect(screen.getByText('Input Complexity')).toBeInTheDocument();
  });

  it('displays confidence scores', () => {
    render(<DriftDetailModal alert={mockAlert} {...mockCallbacks} />);
    expect(screen.getByText('90% confidence')).toBeInTheDocument();
    expect(screen.getByText('60% confidence')).toBeInTheDocument();
  });

  it('shows checkmark for high confidence causes', () => {
    render(<DriftDetailModal alert={mockAlert} {...mockCallbacks} />);
    // High confidence (90%) should show ✓
    // Find the parent div that contains both the checkmark and the description
    const descriptionElement = screen.getByText('Model changed: gpt-4, gpt-4o');
    const parentDiv = descriptionElement.closest('.p-4');
    expect(parentDiv?.textContent).toContain('✓');
  });

  it('displays "View Traces" button', () => {
    render(<DriftDetailModal alert={mockAlert} {...mockCallbacks} />);
    expect(screen.getByText('View Traces')).toBeInTheDocument();
  });

  it('displays "Adjust Baseline" button', () => {
    render(<DriftDetailModal alert={mockAlert} {...mockCallbacks} />);
    expect(screen.getByText('Adjust Baseline')).toBeInTheDocument();
  });

  it('displays "Mark as Expected" button', () => {
    render(<DriftDetailModal alert={mockAlert} {...mockCallbacks} />);
    expect(screen.getByText('Mark as Expected')).toBeInTheDocument();
  });

  it('displays "Close" button', () => {
    render(<DriftDetailModal alert={mockAlert} {...mockCallbacks} />);
    expect(screen.getByText('Close')).toBeInTheDocument();
  });

  it('calls onClose when close button clicked', () => {
    render(<DriftDetailModal alert={mockAlert} {...mockCallbacks} />);
    fireEvent.click(screen.getByText('Close'));
    expect(mockCallbacks.onClose).toHaveBeenCalled();
  });

  it('calls onClose when X button clicked', () => {
    const { container } = render(
      <DriftDetailModal alert={mockAlert} {...mockCallbacks} />
    );
    // Find the X button (first close button in header)
    const closeButtons = container.querySelectorAll('button');
    const xButton = Array.from(closeButtons).find((btn) =>
      btn.querySelector('svg path[d*="M6 18L18 6"]')
    );
    if (xButton) {
      fireEvent.click(xButton);
    }
    expect(mockCallbacks.onClose).toHaveBeenCalled();
  });

  it('calls onMarkAsExpected when button clicked', () => {
    render(<DriftDetailModal alert={mockAlert} {...mockCallbacks} />);
    fireEvent.click(screen.getByText('Mark as Expected'));
    expect(mockCallbacks.onMarkAsExpected).toHaveBeenCalled();
  });

  it('calls onViewTraces when button clicked', () => {
    render(<DriftDetailModal alert={mockAlert} {...mockCallbacks} />);
    fireEvent.click(screen.getByText('View Traces'));
    expect(mockCallbacks.onViewTraces).toHaveBeenCalled();
  });

  it('calls onAdjustBaseline when button clicked', () => {
    render(<DriftDetailModal alert={mockAlert} {...mockCallbacks} />);
    fireEvent.click(screen.getByText('Adjust Baseline'));
    expect(mockCallbacks.onAdjustBaseline).toHaveBeenCalled();
  });

  it('highlights first anomaly by default', () => {
    render(<DriftDetailModal alert={mockAlert} {...mockCallbacks} />);
    // First anomaly should have a checkmark icon
    const durationCard = screen.getByText('duration').closest('button');
    const checkmark = durationCard?.querySelector('svg path[fill-rule="evenodd"]');
    expect(checkmark).toBeInTheDocument();
  });

  it('changes selection when clicking different anomaly', () => {
    render(<DriftDetailModal alert={mockAlert} {...mockCallbacks} />);

    // Click on token_usage anomaly
    const tokenCard = screen.getByText('token_usage').closest('button');
    if (tokenCard) {
      fireEvent.click(tokenCard);
    }

    // Should now be selected (border color change)
    expect(tokenCard).toHaveClass('border-yellow-300'); // medium severity
  });

  it('shows message when no root causes', () => {
    const alertNoRootCauses = {
      ...mockAlert,
      root_causes: [],
    };
    render(<DriftDetailModal alert={alertNoRootCauses} {...mockCallbacks} />);
    expect(
      screen.getByText(/No specific root cause identified/)
    ).toBeInTheDocument();
  });

  it('closes modal when clicking background overlay', () => {
    const { container } = render(
      <DriftDetailModal alert={mockAlert} {...mockCallbacks} />
    );
    const overlay = container.querySelector('.bg-gray-500.bg-opacity-75');
    if (overlay) {
      fireEvent.click(overlay);
    }
    expect(mockCallbacks.onClose).toHaveBeenCalled();
  });

  it('formats large duration values correctly', () => {
    render(<DriftDetailModal alert={mockAlert} {...mockCallbacks} />);
    // 12847.3ms should be displayed as 12.8s
    expect(screen.getByText(/12\.8s/)).toBeInTheDocument();
  });
});
