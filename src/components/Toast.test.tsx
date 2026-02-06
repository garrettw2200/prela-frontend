import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor, act } from '../test/utils';
import { ToastProvider, useToast } from './Toast';

// Test component to trigger toasts
function ToastTrigger() {
  const { showToast } = useToast();

  return (
    <div>
      <button onClick={() => showToast('success', 'Success message')}>
        Show Success
      </button>
      <button onClick={() => showToast('error', 'Error message')}>
        Show Error
      </button>
      <button onClick={() => showToast('info', 'Info message')}>
        Show Info
      </button>
    </div>
  );
}

describe('Toast', () => {
  it('displays success toast message', async () => {
    render(
      <ToastProvider>
        <ToastTrigger />
      </ToastProvider>
    );

    const button = screen.getByText('Show Success');
    await act(async () => {
      button.click();
    });

    expect(await screen.findByText('Success message')).toBeInTheDocument();
  });

  it('displays error toast message', async () => {
    render(
      <ToastProvider>
        <ToastTrigger />
      </ToastProvider>
    );

    const button = screen.getByText('Show Error');
    await act(async () => {
      button.click();
    });

    expect(await screen.findByText('Error message')).toBeInTheDocument();
  });

  it('displays info toast message', async () => {
    render(
      <ToastProvider>
        <ToastTrigger />
      </ToastProvider>
    );

    const button = screen.getByText('Show Info');
    await act(async () => {
      button.click();
    });

    expect(await screen.findByText('Info message')).toBeInTheDocument();
  });

  it('throws error when useToast is used outside ToastProvider', () => {
    // Suppress console.error for this test
    const originalError = console.error;
    console.error = vi.fn();

    expect(() => {
      render(<ToastTrigger />);
    }).toThrow('useToast must be used within');

    console.error = originalError;
  });
});
