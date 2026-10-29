import React from 'react';
import { render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import {
  ListPageSkeleton,
  OverviewSkeleton,
} from '../src/components/skeletons';
it('keeps the list heading and a table-shaped fallback instead of a page spinner', () => {
  const { container } = render(
    <ListPageSkeleton title="The squad." description="Your players" />,
  );
  expect(
    screen.getByRole('heading', { name: 'The squad.' }),
  ).toBeInTheDocument();
  expect(screen.getByRole('status')).toHaveAttribute('aria-busy', 'true');
  expect(container.querySelectorAll('tbody tr')).toHaveLength(8);
  expect(screen.queryByText('Opening the matchbook…')).not.toBeInTheDocument();
});
it('reserves the overview summary and section layout', () => {
  const { container } = render(<OverviewSkeleton />);
  expect(
    screen.getByRole('heading', { name: 'Your clubhouse.' }),
  ).toBeInTheDocument();
  expect(container.querySelectorAll('.summary-row > div')).toHaveLength(4);
  expect(
    container.querySelectorAll('.overview-grid .section-panel'),
  ).toHaveLength(2);
});
