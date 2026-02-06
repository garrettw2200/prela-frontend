import { describe, it, expect } from 'vitest';
import { render } from '../../test/utils';
import { LoadingSkeleton } from './LoadingSkeleton';

describe('LoadingSkeleton', () => {
  it('renders 5 skeleton rows', () => {
    const { container } = render(<LoadingSkeleton />);
    // Component creates 5 divs using Array(5)
    const rows = container.querySelectorAll('.divide-y > div');
    expect(rows).toHaveLength(5);
  });

  it('has pulse animation class', () => {
    const { container } = render(<LoadingSkeleton />);
    const animatedElement = container.querySelector('.animate-pulse');
    expect(animatedElement).toBeInTheDocument();
  });

  it('renders skeleton structure correctly', () => {
    const { container } = render(<LoadingSkeleton />);

    // Check for main container
    expect(container.querySelector('.space-y-4')).toBeInTheDocument();
    // Check for header section
    expect(container.querySelector('.flex.items-center.justify-between')).toBeInTheDocument();
    // Check for content container
    expect(container.querySelector('.divide-y')).toBeInTheDocument();
  });

  it('has proper Tailwind classes for styling', () => {
    const { container } = render(<LoadingSkeleton />);
    const mainContainer = container.querySelector('.space-y-4');

    expect(mainContainer).toHaveClass('space-y-4');
    expect(mainContainer).toHaveClass('animate-pulse');
  });

  it('renders skeleton bars', () => {
    const { container } = render(<LoadingSkeleton />);
    const skeletonBars = container.querySelectorAll('.bg-gray-200');

    // Should have multiple skeleton bars (header + rows)
    expect(skeletonBars.length).toBeGreaterThan(5);
  });
});
