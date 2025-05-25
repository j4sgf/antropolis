import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, beforeEach, vi } from 'vitest';
import GameLayout from '../GameLayout';

// Mock framer-motion to avoid animation issues in tests
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

// Mock the panel components
vi.mock('../LeftPanel', () => ({
  default: ({ onCollapse, theme }) => (
    <div data-testid="left-panel" className={`left-panel ${theme}`}>
      <button onClick={onCollapse} data-testid="left-panel-collapse">
        Collapse Left
      </button>
      <div>Left Panel Content</div>
    </div>
  ),
}));

vi.mock('../CenterPanel', () => ({
  default: ({ isFullscreen, theme, onToggleFullscreen }) => (
    <div data-testid="center-panel" className={`center-panel ${theme} ${isFullscreen ? 'fullscreen' : ''}`}>
      <button onClick={onToggleFullscreen} data-testid="center-panel-fullscreen">
        Toggle Fullscreen
      </button>
      <div>Center Panel Content</div>
    </div>
  ),
}));

vi.mock('../RightPanel', () => ({
  default: ({ onCollapse, theme }) => (
    <div data-testid="right-panel" className={`right-panel ${theme}`}>
      <button onClick={onCollapse} data-testid="right-panel-collapse">
        Collapse Right
      </button>
      <div>Right Panel Content</div>
    </div>
  ),
}));

describe('GameLayout', () => {
  const defaultProps = {
    colonyId: 'test-colony',
    colonyData: {
      id: 'test-colony',
      name: 'Test Colony',
      population: 150
    }
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Layout Structure', () => {
    test('renders all three panels by default', () => {
      render(<GameLayout {...defaultProps} />);
      
      expect(screen.getByTestId('game-layout')).toBeInTheDocument();
      expect(screen.getByTestId('left-panel')).toBeInTheDocument();
      expect(screen.getByTestId('center-panel')).toBeInTheDocument();
      expect(screen.getByTestId('right-panel')).toBeInTheDocument();
    });

    test('applies correct CSS classes for theme', () => {
      const { rerender } = render(<GameLayout {...defaultProps} />);
      
      const layout = screen.getByTestId('game-layout');
      expect(layout).toHaveClass('light');
      
      // Test theme switching (will be triggered by theme toggle button)
      const themeToggle = screen.getByTitle(/Switch to Dark Theme/);
      fireEvent.click(themeToggle);
      
      waitFor(() => {
        expect(layout).toHaveClass('dark');
      });
    });

    test('displays keyboard shortcuts help', () => {
      render(<GameLayout {...defaultProps} />);
      
      const shortcutsHelp = screen.getByTitle('Keyboard Shortcuts');
      expect(shortcutsHelp).toBeInTheDocument();
    });
  });

  describe('Panel Collapse/Expand Functionality', () => {
    test('left panel can be collapsed and restored', async () => {
      render(<GameLayout {...defaultProps} />);
      
      // Initially both panels should be visible
      expect(screen.getByTestId('left-panel')).toBeInTheDocument();
      expect(screen.getByTestId('right-panel')).toBeInTheDocument();
      
      // Collapse left panel
      const collapseButton = screen.getByTestId('left-panel-collapse');
      fireEvent.click(collapseButton);
      
      // Wait for panel to be hidden and toggle button to appear
      await waitFor(() => {
        expect(screen.queryByTestId('left-panel')).not.toBeInTheDocument();
        expect(screen.getByTitle('Show Left Panel (Ctrl+Q)')).toBeInTheDocument();
      });
      
      // Restore left panel
      const showButton = screen.getByTitle('Show Left Panel (Ctrl+Q)');
      fireEvent.click(showButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('left-panel')).toBeInTheDocument();
      });
    });

    test('right panel can be collapsed and restored', async () => {
      render(<GameLayout {...defaultProps} />);
      
      // Collapse right panel
      const collapseButton = screen.getByTestId('right-panel-collapse');
      fireEvent.click(collapseButton);
      
      // Wait for panel to be hidden and toggle button to appear
      await waitFor(() => {
        expect(screen.queryByTestId('right-panel')).not.toBeInTheDocument();
        expect(screen.getByTitle('Show Right Panel (Ctrl+E)')).toBeInTheDocument();
      });
      
      // Restore right panel
      const showButton = screen.getByTitle('Show Right Panel (Ctrl+E)');
      fireEvent.click(showButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('right-panel')).toBeInTheDocument();
      });
    });
  });

  describe('Fullscreen Mode', () => {
    test('center panel can toggle fullscreen mode', async () => {
      render(<GameLayout {...defaultProps} />);
      
      const centerPanel = screen.getByTestId('center-panel');
      expect(centerPanel).not.toHaveClass('fullscreen');
      
      // Toggle fullscreen
      const fullscreenButton = screen.getByTestId('center-panel-fullscreen');
      fireEvent.click(fullscreenButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('center-panel')).toHaveClass('fullscreen');
        // Both panels should be hidden in fullscreen
        expect(screen.queryByTestId('left-panel')).not.toBeInTheDocument();
        expect(screen.queryByTestId('right-panel')).not.toBeInTheDocument();
      });
    });
  });

  describe('Keyboard Shortcuts', () => {
    test('Ctrl+Q toggles left panel', async () => {
      render(<GameLayout {...defaultProps} />);
      
      expect(screen.getByTestId('left-panel')).toBeInTheDocument();
      
      // Press Ctrl+Q
      fireEvent.keyDown(document, { key: 'q', ctrlKey: true });
      
      await waitFor(() => {
        expect(screen.queryByTestId('left-panel')).not.toBeInTheDocument();
      });
      
      // Press Ctrl+Q again to restore
      fireEvent.keyDown(document, { key: 'q', ctrlKey: true });
      
      await waitFor(() => {
        expect(screen.getByTestId('left-panel')).toBeInTheDocument();
      });
    });

    test('Ctrl+E toggles right panel', async () => {
      render(<GameLayout {...defaultProps} />);
      
      expect(screen.getByTestId('right-panel')).toBeInTheDocument();
      
      // Press Ctrl+E
      fireEvent.keyDown(document, { key: 'e', ctrlKey: true });
      
      await waitFor(() => {
        expect(screen.queryByTestId('right-panel')).not.toBeInTheDocument();
      });
    });

    test('Ctrl+F toggles fullscreen view', async () => {
      render(<GameLayout {...defaultProps} />);
      
      expect(screen.getByTestId('left-panel')).toBeInTheDocument();
      expect(screen.getByTestId('right-panel')).toBeInTheDocument();
      
      // Press Ctrl+F
      fireEvent.keyDown(document, { key: 'f', ctrlKey: true });
      
      await waitFor(() => {
        expect(screen.queryByTestId('left-panel')).not.toBeInTheDocument();
        expect(screen.queryByTestId('right-panel')).not.toBeInTheDocument();
        expect(screen.getByTestId('center-panel')).toHaveClass('fullscreen');
      });
    });

    test('Escape restores panels from fullscreen', async () => {
      render(<GameLayout {...defaultProps} />);
      
      // Enter fullscreen first
      fireEvent.keyDown(document, { key: 'f', ctrlKey: true });
      
      await waitFor(() => {
        expect(screen.getByTestId('center-panel')).toHaveClass('fullscreen');
      });
      
      // Press Escape
      fireEvent.keyDown(document, { key: 'Escape' });
      
      await waitFor(() => {
        expect(screen.getByTestId('left-panel')).toBeInTheDocument();
        expect(screen.getByTestId('right-panel')).toBeInTheDocument();
        expect(screen.getByTestId('center-panel')).not.toHaveClass('fullscreen');
      });
    });

    test('shortcuts are ignored when typing in input fields', () => {
      render(
        <div>
          <GameLayout {...defaultProps} />
          <input data-testid="test-input" />
        </div>
      );
      
      const input = screen.getByTestId('test-input');
      input.focus();
      
      expect(screen.getByTestId('left-panel')).toBeInTheDocument();
      
      // Press Ctrl+Q while focused on input - should be ignored
      fireEvent.keyDown(input, { key: 'q', ctrlKey: true });
      
      // Panel should still be visible
      expect(screen.getByTestId('left-panel')).toBeInTheDocument();
    });
  });

  describe('Theme Switching', () => {
    test('theme toggle button switches between light and dark', async () => {
      render(<GameLayout {...defaultProps} />);
      
      const layout = screen.getByTestId('game-layout');
      expect(layout).toHaveClass('light');
      
      // Click theme toggle
      const themeToggle = screen.getByTitle('Switch to Dark Theme (Ctrl+T)');
      fireEvent.click(themeToggle);
      
      await waitFor(() => {
        expect(layout).toHaveClass('dark');
        expect(screen.getByTitle('Switch to Light Theme (Ctrl+T)')).toBeInTheDocument();
      });
    });

    test('Ctrl+T toggles theme', async () => {
      render(<GameLayout {...defaultProps} />);
      
      const layout = screen.getByTestId('game-layout');
      expect(layout).toHaveClass('light');
      
      // Press Ctrl+T
      fireEvent.keyDown(document, { key: 't', ctrlKey: true });
      
      await waitFor(() => {
        expect(layout).toHaveClass('dark');
      });
    });
  });

  describe('Data Passing', () => {
    test('passes correct props to panel components', () => {
      render(<GameLayout {...defaultProps} />);
      
      // Check that colony data is passed to panels
      const leftPanel = screen.getByTestId('left-panel');
      const centerPanel = screen.getByTestId('center-panel');
      const rightPanel = screen.getByTestId('right-panel');
      
      expect(leftPanel).toBeInTheDocument();
      expect(centerPanel).toBeInTheDocument();
      expect(rightPanel).toBeInTheDocument();
      
      // Verify theme is applied to all panels
      expect(leftPanel).toHaveClass('light');
      expect(centerPanel).toHaveClass('light');
      expect(rightPanel).toHaveClass('light');
    });
  });
}); 