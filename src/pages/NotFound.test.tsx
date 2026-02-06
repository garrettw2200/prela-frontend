import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import NotFound from './NotFound';

function renderNotFound() {
  return render(
    <BrowserRouter>
      <NotFound />
    </BrowserRouter>
  );
}

describe('NotFound', () => {
  it('renders 404 heading', () => {
    renderNotFound();

    const heading = screen.getByRole('heading', { name: /404/i });
    expect(heading).toBeInTheDocument();
  });

  it('renders page not found message', () => {
    renderNotFound();

    expect(screen.getByText(/page not found/i)).toBeInTheDocument();
  });

  it('renders link to home page', () => {
    renderNotFound();

    const homeLink = screen.getByRole('link', { name: /go home/i });
    expect(homeLink).toBeInTheDocument();
    expect(homeLink).toHaveAttribute('href', '/');
  });

  it('has proper styling classes', () => {
    renderNotFound();

    const container = screen.getByText(/page not found/i).closest('div');
    expect(container).toHaveClass('text-center', 'py-12');
  });

  it('has primary button styling on home link', () => {
    renderNotFound();

    const homeLink = screen.getByRole('link', { name: /go home/i });
    expect(homeLink).toHaveClass('btn-primary');
  });

  it('renders in correct order', () => {
    renderNotFound();

    const heading = screen.getByRole('heading', { name: /404/i });
    const message = screen.getByText(/page not found/i);
    const link = screen.getByRole('link', { name: /go home/i });

    // Check that elements appear in the correct order in the DOM
    const container = heading.closest('div');
    const children = Array.from(container?.children || []);

    const headingIndex = children.indexOf(heading);
    const messageIndex = children.indexOf(message);
    const linkIndex = children.indexOf(link);

    expect(headingIndex).toBeLessThan(messageIndex);
    expect(messageIndex).toBeLessThan(linkIndex);
  });
});
