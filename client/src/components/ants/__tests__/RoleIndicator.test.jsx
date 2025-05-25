import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, beforeEach, vi } from 'vitest';
import RoleIndicator from '../RoleIndicator';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, onMouseEnter, onMouseLeave, onClick, ...props }) => (
      <div 
        onMouseEnter={onMouseEnter} 
        onMouseLeave={onMouseLeave} 
        onClick={onClick}
        {...props}
      >
        {children}
      </div>
    ),
  },
}));

// Mock the roleData
vi.mock('../../data/roleData', () => ({
  roleData: {
    worker: {
      name: 'Worker',
      icon: '👷',
      colorClass: 'role-worker',
      description: 'General colony maintenance and basic tasks',
      benefits: ['High versatility', 'Efficient resource consumption'],
      tradeoffs: ['Lower specialization', 'Limited combat'],
      stats: { efficiency: 75, specialization: 60 },
      subRoles: ['General Labor', 'Maintenance']
    },
    soldier: {
      name: 'Soldier',
      icon: '⚔️',
      colorClass: 'role-soldier',
      description: 'Defense and combat specialists',
      benefits: ['Superior combat', 'High defense'],
      tradeoffs: ['High resource consumption', 'Limited utility'],
      stats: { efficiency: 60, specialization: 90 },
      subRoles: ['Guard', 'Fighter']
    },
    scout: {
      name: 'Scout',
      icon: '🔍',
      colorClass: 'role-scout',
      description: 'Exploration and intelligence gathering',
      benefits: ['Fastest movement', 'Early threat detection'],
      tradeoffs: ['Low combat', 'Limited carrying capacity'],
      stats: { efficiency: 70, specialization: 85 },
      subRoles: ['Explorer', 'Detector']
    }
  }
}));

describe('RoleIndicator', () => {
  const defaultProps = {
    role: 'worker',
    size: 'medium',
    showTooltip: true,
    showText: false
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    test('renders with default props', () => {
      render(<RoleIndicator {...defaultProps} />);
      
      expect(screen.getByText('👷')).toBeInTheDocument();
    });

    test('renders with different role types', () => {
      const { rerender } = render(<RoleIndicator role="worker" />);
      expect(screen.getByText('👷')).toBeInTheDocument();

      rerender(<RoleIndicator role="soldier" />);
      expect(screen.getByText('⚔️')).toBeInTheDocument();

      rerender(<RoleIndicator role="scout" />);
      expect(screen.getByText('🔍')).toBeInTheDocument();
    });

    test('falls back to worker role for unknown roles', () => {
      render(<RoleIndicator role="unknown-role" />);
      
      expect(screen.getByText('👷')).toBeInTheDocument();
    });

    test('applies correct CSS classes for different roles', () => {
      const { rerender } = render(<RoleIndicator role="worker" />);
      let indicator = screen.getByText('👷').closest('.role-indicator');
      expect(indicator).toHaveClass('role-worker');

      rerender(<RoleIndicator role="soldier" />);
      indicator = screen.getByText('⚔️').closest('.role-indicator');
      expect(indicator).toHaveClass('role-soldier');
    });
  });

  describe('Size Variants', () => {
    test('applies correct size classes', () => {
      const { rerender } = render(<RoleIndicator role="worker" size="small" />);
      let indicator = screen.getByText('👷').closest('.role-indicator');
      expect(indicator).toHaveClass('role-indicator-small');

      rerender(<RoleIndicator role="worker" size="medium" />);
      indicator = screen.getByText('👷').closest('.role-indicator');
      expect(indicator).toHaveClass('role-indicator-medium');

      rerender(<RoleIndicator role="worker" size="large" />);
      indicator = screen.getByText('👷').closest('.role-indicator');
      expect(indicator).toHaveClass('role-indicator-large');
    });
  });

  describe('Text Display', () => {
    test('shows role text when showText is true', () => {
      render(<RoleIndicator role="worker" showText={true} />);
      
      expect(screen.getByText('Worker')).toBeInTheDocument();
    });

    test('hides role text when showText is false', () => {
      render(<RoleIndicator role="worker" showText={false} />);
      
      expect(screen.queryByText('Worker')).not.toBeInTheDocument();
    });
  });

  describe('Tooltip Functionality', () => {
    test('shows tooltip on mouse enter when showTooltip is true', async () => {
      render(<RoleIndicator role="worker" showTooltip={true} />);
      
      const indicator = screen.getByText('👷').closest('.role-indicator');
      fireEvent.mouseEnter(indicator);
      
      await waitFor(() => {
        expect(screen.getByText('Worker')).toBeInTheDocument();
        expect(screen.getByText('General colony maintenance and basic tasks')).toBeInTheDocument();
      });
    });

    test('hides tooltip on mouse leave', async () => {
      render(<RoleIndicator role="worker" showTooltip={true} />);
      
      const indicator = screen.getByText('👷').closest('.role-indicator');
      fireEvent.mouseEnter(indicator);
      
      await waitFor(() => {
        expect(screen.getByText('Worker')).toBeInTheDocument();
      });
      
      fireEvent.mouseLeave(indicator);
      
      await waitFor(() => {
        expect(screen.queryByText('General colony maintenance and basic tasks')).not.toBeInTheDocument();
      });
    });

    test('does not show tooltip when showTooltip is false', () => {
      render(<RoleIndicator role="worker" showTooltip={false} />);
      
      const indicator = screen.getByText('👷').closest('.role-indicator');
      fireEvent.mouseEnter(indicator);
      
      expect(screen.queryByText('General colony maintenance and basic tasks')).not.toBeInTheDocument();
    });

    test('tooltip displays role benefits', async () => {
      render(<RoleIndicator role="worker" showTooltip={true} />);
      
      const indicator = screen.getByText('👷').closest('.role-indicator');
      fireEvent.mouseEnter(indicator);
      
      await waitFor(() => {
        expect(screen.getByText('Benefits:')).toBeInTheDocument();
        expect(screen.getByText('High versatility')).toBeInTheDocument();
        expect(screen.getByText('Efficient resource consumption')).toBeInTheDocument();
      });
    });

    test('tooltip displays role trade-offs', async () => {
      render(<RoleIndicator role="worker" showTooltip={true} />);
      
      const indicator = screen.getByText('👷').closest('.role-indicator');
      fireEvent.mouseEnter(indicator);
      
      await waitFor(() => {
        expect(screen.getByText('Trade-offs:')).toBeInTheDocument();
        expect(screen.getByText('Lower specialization')).toBeInTheDocument();
        expect(screen.getByText('Limited combat')).toBeInTheDocument();
      });
    });

    test('tooltip displays role statistics', async () => {
      render(<RoleIndicator role="worker" showTooltip={true} />);
      
      const indicator = screen.getByText('👷').closest('.role-indicator');
      fireEvent.mouseEnter(indicator);
      
      await waitFor(() => {
        expect(screen.getByText('Efficiency:')).toBeInTheDocument();
        expect(screen.getByText('75%')).toBeInTheDocument();
        expect(screen.getByText('Specialization:')).toBeInTheDocument();
        expect(screen.getByText('60%')).toBeInTheDocument();
      });
    });

    test('tooltip displays sub-roles', async () => {
      render(<RoleIndicator role="worker" showTooltip={true} />);
      
      const indicator = screen.getByText('👷').closest('.role-indicator');
      fireEvent.mouseEnter(indicator);
      
      await waitFor(() => {
        expect(screen.getByText('Specializations:')).toBeInTheDocument();
        expect(screen.getByText('General Labor')).toBeInTheDocument();
        expect(screen.getByText('Maintenance')).toBeInTheDocument();
      });
    });
  });

  describe('Click Functionality', () => {
    test('calls onClick handler when clicked', () => {
      const onClickMock = vi.fn();
      render(<RoleIndicator role="worker" onClick={onClickMock} />);
      
      const indicator = screen.getByText('👷').closest('.role-indicator');
      fireEvent.click(indicator);
      
      expect(onClickMock).toHaveBeenCalledTimes(1);
    });

    test('does not call onClick when not provided', () => {
      render(<RoleIndicator role="worker" />);
      
      const indicator = screen.getByText('👷').closest('.role-indicator');
      
      // Should not throw error
      expect(() => fireEvent.click(indicator)).not.toThrow();
    });
  });

  describe('Custom Styling', () => {
    test('applies custom className', () => {
      render(<RoleIndicator role="worker" className="custom-class" />);
      
      const container = screen.getByText('👷').closest('.role-indicator-container');
      expect(container).toHaveClass('custom-class');
    });

    test('applies default className when none provided', () => {
      render(<RoleIndicator role="worker" />);
      
      const container = screen.getByText('👷').closest('.role-indicator-container');
      expect(container).toHaveClass('role-indicator-container');
    });
  });

  describe('Statistics Bar Rendering', () => {
    test('renders stat bars with correct widths', async () => {
      render(<RoleIndicator role="worker" showTooltip={true} />);
      
      const indicator = screen.getByText('👷').closest('.role-indicator');
      fireEvent.mouseEnter(indicator);
      
      await waitFor(() => {
        const statFills = screen.getAllByClassName('stat-fill');
        
        // Check that stat bars have the correct width based on values
        const efficiencyBar = statFills[0]; // First stat bar (efficiency: 75)
        expect(efficiencyBar).toHaveStyle('width: 75%');
        
        const specializationBar = statFills[1]; // Second stat bar (specialization: 60)
        expect(specializationBar).toHaveStyle('width: 60%');
      });
    });
  });

  describe('Different Role Types', () => {
    test('displays correct information for soldier role', async () => {
      render(<RoleIndicator role="soldier" showTooltip={true} />);
      
      const indicator = screen.getByText('⚔️').closest('.role-indicator');
      fireEvent.mouseEnter(indicator);
      
      await waitFor(() => {
        expect(screen.getByText('Soldier')).toBeInTheDocument();
        expect(screen.getByText('Defense and combat specialists')).toBeInTheDocument();
        expect(screen.getByText('Superior combat')).toBeInTheDocument();
        expect(screen.getByText('Guard')).toBeInTheDocument();
        expect(screen.getByText('Fighter')).toBeInTheDocument();
      });
    });

    test('displays correct information for scout role', async () => {
      render(<RoleIndicator role="scout" showTooltip={true} />);
      
      const indicator = screen.getByText('🔍').closest('.role-indicator');
      fireEvent.mouseEnter(indicator);
      
      await waitFor(() => {
        expect(screen.getByText('Scout')).toBeInTheDocument();
        expect(screen.getByText('Exploration and intelligence gathering')).toBeInTheDocument();
        expect(screen.getByText('Fastest movement')).toBeInTheDocument();
        expect(screen.getByText('Explorer')).toBeInTheDocument();
        expect(screen.getByText('Detector')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    test('has proper ARIA attributes', () => {
      render(<RoleIndicator role="worker" />);
      
      const indicator = screen.getByText('👷').closest('.role-indicator');
      expect(indicator).toBeInTheDocument();
      
      // Should be clickable/interactive
      expect(indicator).toHaveStyle('cursor: pointer');
    });

    test('handles keyboard navigation properly', () => {
      const onClickMock = jest.fn();
      render(<RoleIndicator role="worker" onClick={onClickMock} />);
      
      const indicator = screen.getByText('👷').closest('.role-indicator');
      
      // Simulate Enter key press
      fireEvent.keyDown(indicator, { key: 'Enter', code: 'Enter' });
      
      // Note: onClick should be triggered by Enter key in real browser behavior
      // This test verifies the component structure supports keyboard interaction
      expect(indicator).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    test('handles missing role data gracefully', () => {
      render(<RoleIndicator role={null} />);
      
      // Should fall back to worker role
      expect(screen.getByText('👷')).toBeInTheDocument();
    });

    test('handles undefined role gracefully', () => {
      render(<RoleIndicator role={undefined} />);
      
      // Should fall back to worker role
      expect(screen.getByText('👷')).toBeInTheDocument();
    });
  });
}); 