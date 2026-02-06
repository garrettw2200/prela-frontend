import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import DriftAlertBanner from './DriftAlertBanner';
import { DriftAlert } from '../../api/drift';

// Mock the DriftDetailModal component
vi.mock('./DriftDetailModal', () => ({
  default: () => <div data-testid="drift-detail-modal">Mock Modal</div>,
}));

describe('DriftAlertBanner', () => {
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
    ],
    root_causes: [
      {
        type: 'model_change',
        description: 'Model changed: gpt-4, gpt-4o',
        confidence: 0.9,
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

  it('renders nothing when no alerts', () => {
    const { container } = render(<DriftAlertBanner alerts={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders single alert with correct title', () => {
    render(<DriftAlertBanner alerts={[mockAlert]} />);
    expect(screen.getByText('Drift Alert: Agent behavior changed')).toBeInTheDocument();
  });

  it('renders multiple alerts with count', () => {
    const alerts = [mockAlert, { ...mockAlert, agent_name: 'writer' }];
    render(<DriftAlertBanner alerts={alerts} />);
    expect(screen.getByText('2 Drift Alerts Detected')).toBeInTheDocument();
  });

  it('displays agent name', () => {
    render(<DriftAlertBanner alerts={[mockAlert]} />);
    expect(screen.getByText('researcher')).toBeInTheDocument();
  });

  it('displays metric name', () => {
    render(<DriftAlertBanner alerts={[mockAlert]} />);
    expect(screen.getByText('duration')).toBeInTheDocument();
  });

  it('displays baseline and current values', () => {
    render(<DriftAlertBanner alerts={[mockAlert]} />);
    expect(screen.getByText(/Baseline:/)).toBeInTheDocument();
    expect(screen.getByText(/Current:/)).toBeInTheDocument();
  });

  it('displays change percentage with correct direction', () => {
    render(<DriftAlertBanner alerts={[mockAlert]} />);
    expect(screen.getByText(/\+145\.0%/)).toBeInTheDocument();
  });

  it('shows investigate button', () => {
    render(<DriftAlertBanner alerts={[mockAlert]} />);
    expect(screen.getByText('Investigate')).toBeInTheDocument();
  });

  it('shows mark as expected button', () => {
    render(<DriftAlertBanner alerts={[mockAlert]} />);
    expect(screen.getByText('Mark as Expected')).toBeInTheDocument();
  });

  it('opens modal when investigate clicked', () => {
    render(<DriftAlertBanner alerts={[mockAlert]} />);

    fireEvent.click(screen.getByText('Investigate'));

    expect(screen.getByTestId('drift-detail-modal')).toBeInTheDocument();
  });

  it('calls onDismiss when dismiss button clicked', () => {
    const onDismiss = vi.fn();
    render(<DriftAlertBanner alerts={[mockAlert]} onDismiss={onDismiss} />);

    const dismissButtons = screen.getAllByLabelText('Dismiss alert');
    fireEvent.click(dismissButtons[0]);

    expect(onDismiss).toHaveBeenCalledWith(mockAlert);
  });

  it('calls onMarkAsExpected when mark as expected clicked', () => {
    const onMarkAsExpected = vi.fn();
    render(
      <DriftAlertBanner alerts={[mockAlert]} onMarkAsExpected={onMarkAsExpected} />
    );

    fireEvent.click(screen.getByText('Mark as Expected'));

    expect(onMarkAsExpected).toHaveBeenCalledWith(mockAlert);
  });

  it('hides alert after dismissing', () => {
    render(<DriftAlertBanner alerts={[mockAlert]} />);

    const dismissButtons = screen.getAllByLabelText('Dismiss alert');
    fireEvent.click(dismissButtons[0]);

    expect(screen.queryByText('researcher')).not.toBeInTheDocument();
  });

  it('displays critical severity with red styling', () => {
    const criticalAlert = {
      ...mockAlert,
      anomalies: [{ ...mockAlert.anomalies[0], severity: 'critical' as const }],
    };
    const { container } = render(<DriftAlertBanner alerts={[criticalAlert]} />);

    const banner = container.querySelector('.bg-red-50');
    expect(banner).toBeInTheDocument();
  });

  it('displays low severity with blue styling', () => {
    const lowAlert = {
      ...mockAlert,
      anomalies: [{ ...mockAlert.anomalies[0], severity: 'low' as const }],
    };
    const { container } = render(<DriftAlertBanner alerts={[lowAlert]} />);

    const banner = container.querySelector('.bg-blue-50');
    expect(banner).toBeInTheDocument();
  });

  it('shows additional anomaly count when multiple anomalies', () => {
    const multiAnomalyAlert = {
      ...mockAlert,
      anomalies: [
        mockAlert.anomalies[0],
        { ...mockAlert.anomalies[0], metric_name: 'token_usage' },
        { ...mockAlert.anomalies[0], metric_name: 'cost' },
      ],
    };
    render(<DriftAlertBanner alerts={[multiAnomalyAlert]} />);

    expect(screen.getByText('+2 more')).toBeInTheDocument();
  });

  it('shows "Show more alerts" button when more than 3 alerts', () => {
    const alerts = Array.from({ length: 5 }, (_, i) => ({
      ...mockAlert,
      agent_name: `agent-${i}`,
    }));
    render(<DriftAlertBanner alerts={alerts} />);

    expect(screen.getByText(/Show 2 more alerts/)).toBeInTheDocument();
  });

  it('displays dismiss all button when multiple alerts', () => {
    const alerts = [mockAlert, { ...mockAlert, agent_name: 'writer' }];
    render(<DriftAlertBanner alerts={alerts} />);

    expect(screen.getByLabelText('Dismiss all alerts')).toBeInTheDocument();
  });

  it('dismisses all alerts when dismiss all clicked', () => {
    const alerts = [mockAlert, { ...mockAlert, agent_name: 'writer' }];
    render(<DriftAlertBanner alerts={alerts} />);

    fireEvent.click(screen.getByLabelText('Dismiss all alerts'));

    expect(screen.queryByText('researcher')).not.toBeInTheDocument();
    expect(screen.queryByText('writer')).not.toBeInTheDocument();
  });

  it('formats duration in milliseconds correctly', () => {
    const alert = {
      ...mockAlert,
      anomalies: [{ ...mockAlert.anomalies[0], current_value: 500 }],
    };
    render(<DriftAlertBanner alerts={[alert]} />);

    expect(screen.getByText(/500ms/)).toBeInTheDocument();
  });

  it('formats duration in seconds correctly', () => {
    const alert = {
      ...mockAlert,
      anomalies: [{ ...mockAlert.anomalies[0], current_value: 5000 }],
    };
    render(<DriftAlertBanner alerts={[alert]} />);

    expect(screen.getByText(/5\.0s/)).toBeInTheDocument();
  });
});
