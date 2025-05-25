import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import DiscoveryNotifications, { useDiscoveryNotifications } from '../components/notifications/DiscoveryNotifications.jsx';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>
  },
  AnimatePresence: ({ children }) => children
}));

// Mock Web Audio API properly
Object.defineProperty(window, 'AudioContext', {
  writable: true,
  value: vi.fn().mockImplementation(() => ({
    createOscillator: vi.fn(() => ({
      connect: vi.fn(),
      frequency: { setValueAtTime: vi.fn() },
      start: vi.fn(),
      stop: vi.fn()
    })),
    createGain: vi.fn(() => ({
      connect: vi.fn(),
      gain: {
        setValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn()
      }
    })),
    destination: {},
    currentTime: 0
  }))
});

Object.defineProperty(window, 'webkitAudioContext', {
  writable: true,
  value: window.AudioContext
});

describe('DiscoveryNotifications', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    delete window.addDiscoveryNotification;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should render without notifications initially', () => {
    render(<DiscoveryNotifications />);
    
    const hint = screen.getByText('Explore to discover new areas');
    expect(hint).toBeInTheDocument();
  });

  it('should add and display a notification', async () => {
    render(<DiscoveryNotifications autoRemoveTime={10000} />);
    
    // Wait for the component to set up the global function
    await waitFor(() => {
      expect(window.addDiscoveryNotification).toBeDefined();
    });

    // Add a notification
    window.addDiscoveryNotification({
      type: 'RESOURCE_CACHE',
      x: 10,
      y: 20,
      details: 'Gold deposits found'
    });

    await waitFor(() => {
      expect(screen.getByText('Resource Cache Found')).toBeInTheDocument();
      expect(screen.getByText(/Rich deposits found at \(10, 20\)/)).toBeInTheDocument();
    });
  });

  it('should display different discovery types correctly', async () => {
    render(<DiscoveryNotifications />);
    
    await waitFor(() => {
      expect(window.addDiscoveryNotification).toBeDefined();
    });

    // Test different discovery types
    const discoveries = [
      { type: 'HIDDEN_ENEMY', x: 15, y: 25, title: 'Enemy Detected' },
      { type: 'ANCIENT_RUINS', x: 30, y: 40, title: 'Ancient Ruins Found' },
      { type: 'WATER_SOURCE', x: 5, y: 5, title: 'Water Source Located' }
    ];

    discoveries.forEach(discovery => {
      window.addDiscoveryNotification(discovery);
    });

    await waitFor(() => {
      expect(screen.getByText('Enemy Detected')).toBeInTheDocument();
      expect(screen.getByText('Ancient Ruins Found')).toBeInTheDocument();
      expect(screen.getByText('Water Source Located')).toBeInTheDocument();
    });
  });

  it('should remove notification when close button is clicked', async () => {
    render(<DiscoveryNotifications />);
    
    await waitFor(() => {
      expect(window.addDiscoveryNotification).toBeDefined();
    });

    window.addDiscoveryNotification({
      type: 'TILE_DISCOVERED',
      x: 1,
      y: 1
    });

    await waitFor(() => {
      expect(screen.getByText('Area Explored')).toBeInTheDocument();
    });

    const closeButton = screen.getByRole('button', { name: '✕' });
    fireEvent.click(closeButton);

    await waitFor(() => {
      expect(screen.queryByText('Area Explored')).not.toBeInTheDocument();
    });
  });

  it('should auto-remove notifications after timeout', async () => {
    render(<DiscoveryNotifications autoRemoveTime={2000} />);
    
    await waitFor(() => {
      expect(window.addDiscoveryNotification).toBeDefined();
    });

    window.addDiscoveryNotification({
      type: 'RESOURCE_CACHE',
      x: 10,
      y: 20
    });

    await waitFor(() => {
      expect(screen.getByText('Resource Cache Found')).toBeInTheDocument();
    });

    // Fast-forward time
    vi.advanceTimersByTime(2000);

    await waitFor(() => {
      expect(screen.queryByText('Resource Cache Found')).not.toBeInTheDocument();
    });
  });

  it('should limit maximum number of notifications', async () => {
    render(<DiscoveryNotifications maxNotifications={2} />);
    
    await waitFor(() => {
      expect(window.addDiscoveryNotification).toBeDefined();
    });

    // Add 3 notifications but only 2 should be displayed
    for (let i = 0; i < 3; i++) {
      window.addDiscoveryNotification({
        type: 'TILE_DISCOVERED',
        x: i,
        y: i
      });
    }

    await waitFor(() => {
      const notifications = screen.getAllByText('Area Explored');
      expect(notifications).toHaveLength(2);
    });
  });

  it('should clear all notifications when clear button is clicked', async () => {
    render(<DiscoveryNotifications />);
    
    await waitFor(() => {
      expect(window.addDiscoveryNotification).toBeDefined();
    });

    // Add multiple notifications
    for (let i = 0; i < 3; i++) {
      window.addDiscoveryNotification({
        type: 'TILE_DISCOVERED',
        x: i,
        y: i
      });
    }

    await waitFor(() => {
      const notifications = screen.getAllByText('Area Explored');
      expect(notifications).toHaveLength(3);
    });

    const clearButton = screen.getByRole('button', { name: /Clear All/ });
    fireEvent.click(clearButton);

    await waitFor(() => {
      expect(screen.queryByText('Area Explored')).not.toBeInTheDocument();
    });
  });

  it('should toggle sound on/off', async () => {
    render(<DiscoveryNotifications enableSounds={true} />);
    
    await waitFor(() => {
      expect(window.addDiscoveryNotification).toBeDefined();
    });

    window.addDiscoveryNotification({
      type: 'RESOURCE_CACHE',
      x: 10,
      y: 20
    });

    await waitFor(() => {
      expect(screen.getByText('Resource Cache Found')).toBeInTheDocument();
    });

    const soundButton = screen.getByRole('button', { name: '🔊' });
    expect(soundButton).toBeInTheDocument();

    fireEvent.click(soundButton);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: '🔇' })).toBeInTheDocument();
    });
  });

  it('should show/hide discovery history', async () => {
    render(<DiscoveryNotifications enablePersistence={true} />);
    
    await waitFor(() => {
      expect(window.addDiscoveryNotification).toBeDefined();
    });

    // Add a significant discovery (not TILE_DISCOVERED)
    window.addDiscoveryNotification({
      type: 'ANCIENT_RUINS',
      x: 50,
      y: 60
    });

    await waitFor(() => {
      expect(screen.getByText('Ancient Ruins Found')).toBeInTheDocument();
    });

    // History button should appear
    await waitFor(() => {
      const historyButton = screen.getByRole('button', { name: /History/ });
      expect(historyButton).toBeInTheDocument();
      
      fireEvent.click(historyButton);
    });

    await waitFor(() => {
      expect(screen.getByText('🗂️ Discovery History')).toBeInTheDocument();
    });
  });

  it('should format discovery messages correctly', async () => {
    render(<DiscoveryNotifications />);
    
    await waitFor(() => {
      expect(window.addDiscoveryNotification).toBeDefined();
    });

    const testCases = [
      {
        discovery: { type: 'SCOUT_EXHAUSTED', scoutId: 'scout-123' },
        expectedMessage: 'Scout scout-123 needs rest'
      },
      {
        discovery: { type: 'EXPLORATION_MILESTONE', percentage: 25 },
        expectedMessage: '25% of map explored'
      },
      {
        discovery: { type: 'NPC_NEST', x: 42, y: 38 },
        expectedMessage: 'Friendly settlement at (42, 38)'
      }
    ];

    for (const testCase of testCases) {
      window.addDiscoveryNotification(testCase.discovery);
      
      await waitFor(() => {
        expect(screen.getByText(testCase.expectedMessage)).toBeInTheDocument();
      });
    }
  });

  it('should play notification sounds when enabled', async () => {
    render(<DiscoveryNotifications enableSounds={true} />);
    
    await waitFor(() => {
      expect(window.addDiscoveryNotification).toBeDefined();
    });

    window.addDiscoveryNotification({
      type: 'RESOURCE_CACHE',
      x: 10,
      y: 20
    });

    await waitFor(() => {
      expect(window.AudioContext).toHaveBeenCalled();
    });
  });
});

describe('useDiscoveryNotifications Hook', () => {
  beforeEach(() => {
    delete window.addDiscoveryNotification;
  });

  it('should provide helper functions for adding notifications', () => {
    // Mock the global function
    window.addDiscoveryNotification = vi.fn(() => 'notification-id');

    const TestComponent = () => {
      const {
        addTileDiscovery,
        addResourceDiscovery,
        addEnemyDiscovery,
        addMilestoneNotification,
        addScoutExhaustedNotification
      } = useDiscoveryNotifications();

      return (
        <div>
          <button onClick={() => addTileDiscovery(10, 20, 'test area')}>Add Tile</button>
          <button onClick={() => addResourceDiscovery(30, 40, 'gold')}>Add Resource</button>
          <button onClick={() => addEnemyDiscovery(50, 60, 'spider')}>Add Enemy</button>
          <button onClick={() => addMilestoneNotification(50, 100)}>Add Milestone</button>
          <button onClick={() => addScoutExhaustedNotification('scout-1')}>Add Scout Exhausted</button>
        </div>
      );
    };

    render(<TestComponent />);

    fireEvent.click(screen.getByText('Add Tile'));
    expect(window.addDiscoveryNotification).toHaveBeenCalledWith({
      type: 'TILE_DISCOVERED',
      x: 10,
      y: 20,
      details: 'test area'
    });

    fireEvent.click(screen.getByText('Add Resource'));
    expect(window.addDiscoveryNotification).toHaveBeenCalledWith({
      type: 'RESOURCE_CACHE',
      x: 30,
      y: 40,
      details: 'gold deposits detected'
    });

    fireEvent.click(screen.getByText('Add Enemy'));
    expect(window.addDiscoveryNotification).toHaveBeenCalledWith({
      type: 'HIDDEN_ENEMY',
      x: 50,
      y: 60,
      details: 'spider forces spotted'
    });

    fireEvent.click(screen.getByText('Add Milestone'));
    expect(window.addDiscoveryNotification).toHaveBeenCalledWith({
      type: 'EXPLORATION_MILESTONE',
      percentage: 50,
      details: '100 tiles discovered',
      x: 0,
      y: 0
    });

    fireEvent.click(screen.getByText('Add Scout Exhausted'));
    expect(window.addDiscoveryNotification).toHaveBeenCalledWith({
      type: 'SCOUT_EXHAUSTED',
      scoutId: 'scout-1',
      x: 0,
      y: 0
    });
  });

  it('should handle missing global function gracefully', () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const TestComponent = () => {
      const { addNotification } = useDiscoveryNotifications();
      
      return (
        <button onClick={() => addNotification({ type: 'TILE_DISCOVERED', x: 1, y: 1 })}>
          Add Notification
        </button>
      );
    };

    render(<TestComponent />);
    fireEvent.click(screen.getByText('Add Notification'));

    expect(consoleSpy).toHaveBeenCalledWith('Discovery notification system not initialized');
    
    consoleSpy.mockRestore();
  });
}); 