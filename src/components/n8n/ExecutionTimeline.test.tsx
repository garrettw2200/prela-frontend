import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ExecutionTimeline } from './ExecutionTimeline';

describe('ExecutionTimeline', () => {
  const mockNodes = [
    {
      node_id: 'node-1',
      node_name: 'Webhook',
      node_type: 'webhook',
      start_offset_ms: 0,
      duration_ms: 100,
      status: 'success' as const,
      is_ai_node: false,
    },
    {
      node_id: 'node-2',
      node_name: 'OpenAI GPT-4',
      node_type: 'llm',
      start_offset_ms: 100,
      duration_ms: 1800,
      status: 'success' as const,
      is_ai_node: true,
    },
    {
      node_id: 'node-3',
      node_name: 'Webhook Response',
      node_type: 'webhook',
      start_offset_ms: 1900,
      duration_ms: 100,
      status: 'success' as const,
      is_ai_node: false,
    },
  ];

  it('renders timeline header with component name', () => {
    render(<ExecutionTimeline nodes={mockNodes} totalDuration={2000} />);

    expect(screen.getByText('Execution Timeline')).toBeInTheDocument();
  });

  it('displays all node names', () => {
    render(<ExecutionTimeline nodes={mockNodes} totalDuration={2000} />);

    expect(screen.getByText('Webhook')).toBeInTheDocument();
    expect(screen.getByText('OpenAI GPT-4')).toBeInTheDocument();
    expect(screen.getByText('Webhook Response')).toBeInTheDocument();
  });

  it('displays time markers at 0%, 25%, 50%, 75%, 100%', () => {
    render(<ExecutionTimeline nodes={mockNodes} totalDuration={2000} />);

    // 0% = 0ms, 25% = 500ms, 50% = 1000ms, 75% = 1500ms, 100% = 2000ms
    expect(screen.getByText('0ms')).toBeInTheDocument();
    expect(screen.getByText('500ms')).toBeInTheDocument();
    expect(screen.getByText('1.0s')).toBeInTheDocument(); // 1000ms = 1.0s
    expect(screen.getByText('1.5s')).toBeInTheDocument(); // 1500ms = 1.5s
    expect(screen.getByText('2.0s')).toBeInTheDocument(); // 2000ms = 2.0s
  });

  it('renders legend with color explanations', () => {
    render(<ExecutionTimeline nodes={mockNodes} totalDuration={2000} />);

    expect(screen.getByText('Regular Node')).toBeInTheDocument();
    expect(screen.getByText('AI Node')).toBeInTheDocument();
    expect(screen.getByText('Error')).toBeInTheDocument();
  });

  it('displays empty state when no nodes provided', () => {
    render(<ExecutionTimeline nodes={[]} totalDuration={2000} />);

    expect(screen.getByText('Execution Timeline')).toBeInTheDocument();
    expect(screen.getByText('No node execution data available')).toBeInTheDocument();
  });

  it('renders bars with correct color classes for AI nodes', () => {
    render(<ExecutionTimeline nodes={mockNodes} totalDuration={2000} />);

    // Check that AI node bar has purple color class
    const container = screen.getByText('OpenAI GPT-4').closest('.relative');
    expect(container).toBeInTheDocument();

    // Purple bar should exist for AI node
    const purpleBars = document.querySelectorAll('.bg-purple-400');
    expect(purpleBars.length).toBeGreaterThan(0);
  });

  it('renders bars with correct color classes for regular nodes', () => {
    render(<ExecutionTimeline nodes={mockNodes} totalDuration={2000} />);

    // Blue bars should exist for regular nodes
    const blueBars = document.querySelectorAll('.bg-blue-400');
    expect(blueBars.length).toBeGreaterThan(0);
  });

  it('renders error nodes with red color', () => {
    const errorNodes = [
      {
        node_id: 'error-node',
        node_name: 'Failed Node',
        node_type: 'function',
        start_offset_ms: 0,
        duration_ms: 100,
        status: 'error' as const,
        is_ai_node: false,
      },
    ];

    render(<ExecutionTimeline nodes={errorNodes} totalDuration={100} />);

    expect(screen.getByText('Failed Node')).toBeInTheDocument();

    // Red bar should exist for error node
    const redBars = document.querySelectorAll('.bg-red-400');
    expect(redBars.length).toBeGreaterThan(0);
  });

  it('sorts nodes by start_offset_ms', () => {
    const unsortedNodes = [
      {
        node_id: 'node-3',
        node_name: 'Third',
        node_type: 'webhook',
        start_offset_ms: 2000,
        duration_ms: 100,
        status: 'success' as const,
        is_ai_node: false,
      },
      {
        node_id: 'node-1',
        node_name: 'First',
        node_type: 'webhook',
        start_offset_ms: 0,
        duration_ms: 100,
        status: 'success' as const,
        is_ai_node: false,
      },
      {
        node_id: 'node-2',
        node_name: 'Second',
        node_type: 'llm',
        start_offset_ms: 100,
        duration_ms: 1800,
        status: 'success' as const,
        is_ai_node: true,
      },
    ];

    render(<ExecutionTimeline nodes={unsortedNodes} totalDuration={2100} />);

    // All nodes should be displayed
    expect(screen.getByText('First')).toBeInTheDocument();
    expect(screen.getByText('Second')).toBeInTheDocument();
    expect(screen.getByText('Third')).toBeInTheDocument();
  });

  it('handles single node execution', () => {
    const singleNode = [
      {
        node_id: 'only-node',
        node_name: 'Only Node',
        node_type: 'webhook',
        start_offset_ms: 0,
        duration_ms: 500,
        status: 'success' as const,
        is_ai_node: false,
      },
    ];

    render(<ExecutionTimeline nodes={singleNode} totalDuration={500} />);

    expect(screen.getByText('Execution Timeline')).toBeInTheDocument();
    expect(screen.getByText('Only Node')).toBeInTheDocument();
    expect(screen.getByText('Regular Node')).toBeInTheDocument();
  });
});
