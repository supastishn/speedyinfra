import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect } from 'vitest';
import LandingPage from './LandingPage';
import { AuthProvider } from './AuthContext';

describe('LandingPage', () => {
  it('renders welcome message', () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <LandingPage />
        </AuthProvider>
      </MemoryRouter>
    );
    expect(screen.getByText(/Welcome to SpeedyInfra/i)).toBeInTheDocument();
  });
});
