import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ConfirmModal from '../ui/ConfirmModal';

describe('ConfirmModal', () => {
  const defaultProps = {
    isOpen: true,
    title: 'Eliminar paciente',
    message: '¿Estás seguro de eliminar este paciente?',
    onConfirm: vi.fn(),
    onCancel: vi.fn(),
  };

  it('renders with correct title and message', () => {
    render(<ConfirmModal {...defaultProps} />);
    expect(screen.getByText('Eliminar paciente')).toBeInTheDocument();
    expect(screen.getByText('¿Estás seguro de eliminar este paciente?')).toBeInTheDocument();
  });

  it('calls onConfirm when confirm button clicked', () => {
    render(<ConfirmModal {...defaultProps} />);
    fireEvent.click(screen.getByText('Deshabilitar'));
    expect(defaultProps.onConfirm).toHaveBeenCalledTimes(1);
  });

  it('calls onCancel when cancel button clicked', () => {
    render(<ConfirmModal {...defaultProps} />);
    fireEvent.click(screen.getByText('Cancelar'));
    expect(defaultProps.onCancel).toHaveBeenCalledTimes(1);
  });

  it('shows confirm button text from props', () => {
    render(<ConfirmModal {...defaultProps} confirmText="Sí, eliminar" />);
    expect(screen.getByText('Sí, eliminar')).toBeInTheDocument();
  });

  it('does not render when isOpen is false', () => {
    render(<ConfirmModal {...defaultProps} isOpen={false} />);
    expect(screen.queryByText('Eliminar paciente')).not.toBeInTheDocument();
  });
});
