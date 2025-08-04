import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect } from 'vitest';
import LandingPage from './LandingPage';

describe('LandingPage', () => {
  it('renders welcome message', () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    );
    expect(screen.getByText(/Welcome to SpeedyInfra/i)).toBeInTheDocument();
  });
});
