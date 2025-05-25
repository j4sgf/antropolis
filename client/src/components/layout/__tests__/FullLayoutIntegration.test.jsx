import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, beforeEach, vi } from 'vitest';
import GameLayout from '../GameLayout';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, onClick, onMouseEnter, onMouseLeave, ...props }) => (
      <div onClick={onClick} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave} {...props}>
        {children}
      </div>
    ),
    button: ({ children, onClick, whileHover, whileTap, ...props }) => (
      <button onClick={onClick} {...props}>
        {children}
      </button>
    ),
  },
  AnimatePresence: ({ children }) => children,
}));

describe('Full Layout Integration', () => {
  const mockColonyData = {
    id: 'test-colony',
    name: 'Test Colony',
    population: 150,
    territory: '2.5 km²',
    resources: {
      food: 850,
      materials: 320,
      larvae: 45
    },
    efficiency: 87,
    morale: 92
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset any theme changes
    document.documentElement.className = '';
  });

  describe('Complete Layout Rendering', () => {
    test('renders all three panels with correct data', () => {
      render(<GameLayout colonyId="test-colony" colonyData={mockColonyData} />);
      
      // Check main layout structure
      expect(screen.getByTestId('game-layout')).toBeInTheDocument();
      expect(screen.getByTestId('left-panel')).toBeInTheDocument();
      expect(screen.getByTestId('center-panel')).toBeInTheDocument();
      expect(screen.getByTestId('right-panel')).toBeInTheDocument();
      
      // Check that panels contain expected content
      expect(screen.getByText('Colony Control')).toBeInTheDocument();
      expect(screen.getByText('Simulation View')).toBeInTheDocument();
      expect(screen.getByText('Evolution & Resources')).toBeInTheDocument();
    });

    test('applies consistent theming across all panels', () => {
      render(<GameLayout colonyId="test-colony" colonyData={mockColonyData} />);
      
      const leftPanel = screen.getByTestId('left-panel');
      const centerPanel = screen.getByTestId('center-panel');
      const rightPanel = screen.getByTestId('right-panel');
      
      // Initially all should have light theme
      expect(leftPanel).toHaveClass('light');
      expect(centerPanel).toHaveClass('light');
      expect(rightPanel).toHaveClass('light');
      
      // Toggle theme
      const themeToggle = screen.getByTitle(/Switch to Dark Theme/);
      fireEvent.click(themeToggle);
      
      // All panels should update to dark theme
      waitFor(() => {
        expect(leftPanel).toHaveClass('dark');
        expect(centerPanel).toHaveClass('dark');
        expect(rightPanel).toHaveClass('dark');
      });
    });
  });

  describe('Panel Interactions', () => {
    test('left panel collapse affects layout grid', async () => {
      render(<GameLayout colonyId="test-colony" colonyData={mockColonyData} />);
      
      const layoutGrid = document.querySelector('.layout-grid');
      expect(layoutGrid).not.toHaveClass('left-collapsed');
      
      // Collapse left panel
      const collapseButton = screen.getByTestId('left-panel-collapse');
      fireEvent.click(collapseButton);
      
      await waitFor(() => {
        expect(layoutGrid).toHaveClass('left-collapsed');
        expect(screen.queryByTestId('left-panel')).not.toBeInTheDocument();
      });
    });

    test('right panel collapse affects layout grid', async () => {
      render(<GameLayout colonyId="test-colony" colonyData={mockColonyData} />);
      
      const layoutGrid = document.querySelector('.layout-grid');
      expect(layoutGrid).not.toHaveClass('right-collapsed');
      
      // Collapse right panel
      const collapseButton = screen.getByTestId('right-panel-collapse');
      fireEvent.click(collapseButton);
      
      await waitFor(() => {
        expect(layoutGrid).toHaveClass('right-collapsed');
        expect(screen.queryByTestId('right-panel')).not.toBeInTheDocument();
      });
    });

    test('center panel fullscreen mode collapses both side panels', async () => {
      render(<GameLayout colonyId="test-colony" colonyData={mockColonyData} />);
      
      const centerPanel = screen.getByTestId('center-panel');
      const layoutGrid = document.querySelector('.layout-grid');
      
      expect(centerPanel).not.toHaveClass('fullscreen');
      expect(layoutGrid).not.toHaveClass('left-collapsed');
      expect(layoutGrid).not.toHaveClass('right-collapsed');
      
      // Toggle fullscreen
      const fullscreenButton = screen.getByTestId('center-panel-fullscreen');
      fireEvent.click(fullscreenButton);
      
      await waitFor(() => {
        expect(centerPanel).toHaveClass('fullscreen');
        expect(layoutGrid).toHaveClass('left-collapsed');
        expect(layoutGrid).toHaveClass('right-collapsed');
      });
    });
  });

  describe('Data Flow', () => {
    test('colony data is passed to all panels', () => {
      render(<GameLayout colonyId="test-colony" colonyData={mockColonyData} />);
      
      // Check that colony stats appear in left panel
      expect(screen.getByText('150')).toBeInTheDocument(); // population
      expect(screen.getByText('2.5 km²')).toBeInTheDocument(); // territory
      expect(screen.getByText('850')).toBeInTheDocument(); // food
      expect(screen.getByText('87%')).toBeInTheDocument(); // efficiency
      expect(screen.getByText('92%')).toBeInTheDocument(); // morale
    });

    test('theme changes propagate to all components', async () => {
      render(<GameLayout colonyId="test-colony" colonyData={mockColonyData} />);
      
      // Initially light theme
      expect(document.documentElement.className).toBe('light');
      
      // Toggle to dark theme
      const themeToggle = screen.getByTitle(/Switch to Dark Theme/);
      fireEvent.click(themeToggle);
      
      await waitFor(() => {
        expect(document.documentElement.className).toBe('dark');
      });
      
      // Toggle back to light theme
      const lightThemeToggle = screen.getByTitle(/Switch to Light Theme/);
      fireEvent.click(lightThemeToggle);
      
      await waitFor(() => {
        expect(document.documentElement.className).toBe('light');
      });
    });
  });

  describe('Keyboard Shortcuts Integration', () => {
    test('all keyboard shortcuts work across the full layout', async () => {
      render(<GameLayout colonyId="test-colony" colonyData={mockColonyData} />);
      
      const leftPanel = screen.getByTestId('left-panel');
      const rightPanel = screen.getByTestId('right-panel');
      const centerPanel = screen.getByTestId('center-panel');
      
      // Test Ctrl+Q (left panel toggle)
      fireEvent.keyDown(document, { key: 'q', ctrlKey: true });
      await waitFor(() => {
        expect(screen.queryByTestId('left-panel')).not.toBeInTheDocument();
      });
      
      // Test Ctrl+E (right panel toggle)
      fireEvent.keyDown(document, { key: 'e', ctrlKey: true });
      await waitFor(() => {
        expect(screen.queryByTestId('right-panel')).not.toBeInTheDocument();
      });
      
      // Test Ctrl+F (fullscreen)
      fireEvent.keyDown(document, { key: 'f', ctrlKey: true });
      await waitFor(() => {
        expect(centerPanel).toHaveClass('fullscreen');
      });
      
      // Test Escape (restore panels)
      fireEvent.keyDown(document, { key: 'Escape' });
      await waitFor(() => {
        expect(screen.getByTestId('left-panel')).toBeInTheDocument();
        expect(screen.getByTestId('right-panel')).toBeInTheDocument();
        expect(centerPanel).not.toHaveClass('fullscreen');
      });
      
      // Test Ctrl+T (theme toggle)
      fireEvent.keyDown(document, { key: 't', ctrlKey: true });
      await waitFor(() => {
        expect(document.documentElement.className).toBe('dark');
      });
    });
  });

  describe('Responsive Behavior', () => {
    test('layout adapts to different screen sizes', () => {
      // Mock window.matchMedia for responsive testing
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(query => ({
          matches: query.includes('max-width: 768px'),
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });
      
      render(<GameLayout colonyId="test-colony" colonyData={mockColonyData} />);
      
      // Layout should render without errors on mobile
      expect(screen.getByTestId('game-layout')).toBeInTheDocument();
      expect(screen.getByTestId('left-panel')).toBeInTheDocument();
      expect(screen.getByTestId('center-panel')).toBeInTheDocument();
      expect(screen.getByTestId('right-panel')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    test('layout renders gracefully with missing colony data', () => {
      render(<GameLayout colonyId="test-colony" colonyData={null} />);
      
      // Should still render all panels
      expect(screen.getByTestId('game-layout')).toBeInTheDocument();
      expect(screen.getByTestId('left-panel')).toBeInTheDocument();
      expect(screen.getByTestId('center-panel')).toBeInTheDocument();
      expect(screen.getByTestId('right-panel')).toBeInTheDocument();
      
      // Should use default/mock data
      expect(screen.getByText('Colony Control')).toBeInTheDocument();
      expect(screen.getByText('Simulation View')).toBeInTheDocument();
      expect(screen.getByText('Evolution & Resources')).toBeInTheDocument();
    });

    test('layout handles incomplete colony data gracefully', () => {
      const incompleteData = {
        id: 'test-colony',
        population: 100
        // Missing other properties
      };
      
      render(<GameLayout colonyId="test-colony" colonyData={incompleteData} />);
      
      // Should render without errors
      expect(screen.getByTestId('game-layout')).toBeInTheDocument();
      expect(screen.getByText('100')).toBeInTheDocument(); // population from data
    });
  });

  describe('Accessibility', () => {
    test('all interactive elements have proper labels and roles', () => {
      render(<GameLayout colonyId="test-colony" colonyData={mockColonyData} />);
      
      // Check button labels
      expect(screen.getByTitle('Collapse Panel (Ctrl+Q)')).toBeInTheDocument();
      expect(screen.getByTitle('Collapse Panel (Ctrl+E)')).toBeInTheDocument();
      expect(screen.getByTitle(/Switch to Dark Theme/)).toBeInTheDocument();
      expect(screen.getByTitle('Keyboard Shortcuts')).toBeInTheDocument();
    });

    test('keyboard navigation works properly', () => {
      render(<GameLayout colonyId="test-colony" colonyData={mockColonyData} />);
      
      // Focus should be manageable via keyboard
      const themeButton = screen.getByTitle(/Switch to Dark Theme/);
      themeButton.focus();
      expect(document.activeElement).toBe(themeButton);
    });
  });

  describe('Performance', () => {
    test('layout renders efficiently with large datasets', () => {
      const largeColonyData = {
        ...mockColonyData,
        population: 10000,
        resources: {
          food: 50000,
          materials: 25000,
          larvae: 500
        }
      };
      
      const startTime = performance.now();
      render(<GameLayout colonyId="test-colony" colonyData={largeColonyData} />);
      const endTime = performance.now();
      
      // Should render in reasonable time (< 100ms for this test)
      expect(endTime - startTime).toBeLessThan(100);
      
      // Should display the large numbers correctly
      expect(screen.getByText('10000')).toBeInTheDocument();
      expect(screen.getByText('50000')).toBeInTheDocument();
    });
  });
}); 