import '@testing-library/jest-dom';
import { afterEach, beforeEach } from 'vitest';

// Clear localStorage before each test to ensure isolation
beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  localStorage.clear();
});
