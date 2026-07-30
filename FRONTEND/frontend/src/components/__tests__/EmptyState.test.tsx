import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import EmptyState from '../ui/EmptyState';

describe('EmptyState', () => {
  it('renders title', () => {
    render(<EmptyState title="No hay pacientes" />);
    expect(screen.getByText('No hay pacientes')).toBeInTheDocument();
  });

  it('renders description', () => {
    render(<EmptyState title="Vacío" description="No se encontraron resultados." />);
    expect(screen.getByText('No se encontraron resultados.')).toBeInTheDocument();
  });

  it('renders action button when provided', () => {
    render(
      <EmptyState
        title="Sin datos"
        action={<button>Crear nuevo</button>}
      />
    );
    expect(screen.getByText('Crear nuevo')).toBeInTheDocument();
  });

  it('does not render description when not provided', () => {
    render(<EmptyState title="Solo título" />);
    expect(screen.queryByRole('paragraph')).not.toBeInTheDocument();
  });
});
