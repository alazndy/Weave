import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

// A simple component to test
const Welcome = ({ name }: { name: string }) => <h1>Hello, {name}!</h1>;

describe('Welcome Component', () => {
  it('renders the correct greeting', () => {
    render(<Welcome name="Weave" />);
    expect(screen.getByRole('heading')).toHaveTextContent('Hello, Weave!');
  });
});
