import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Skeleton from '../ui/Skeleton';

describe('Skeleton', () => {
  it('renders with default count (1)', () => {
    const { container } = render(<Skeleton />);
    const skeletons = container.querySelectorAll('.animate-skeleton');
    expect(skeletons.length).toBe(1);
  });

  it('renders multiple skeletons when count prop provided', () => {
    const { container } = render(<Skeleton count={3} />);
    const skeletons = container.querySelectorAll('.animate-skeleton');
    expect(skeletons.length).toBe(3);
  });

  it('renders zero skeletons when count is 0', () => {
    const { container } = render(<Skeleton count={0} />);
    const skeletons = container.querySelectorAll('.animate-skeleton');
    expect(skeletons.length).toBe(0);
  });
});
