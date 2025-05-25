import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, beforeEach, vi } from 'vitest';
import AntRolePanel from '../AntRolePanel';

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, onClick, onMouseEnter, onMouseLeave, ...props }) => (
      <div onClick={onClick} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave} {...props}>
        {children}
      </div>
    ),
  },
  AnimatePresence: ({ children }) => children,
}));

describe('AntRolePanel', () => {
  const mockAnts = [
    {
      id: 'ant_1',
      role: 'worker',
      experience: 75,
      efficiency: 85,
      health: 90,
      status: 'active'
    },
    {
      id: 'ant_2',
      role: 'soldier',
      experience: 60,
      efficiency: 78,
      health: 95,
      status: 'active'
    },
    {
      id: 'ant_3',
      role: 'scout',
      experience: 45,
      efficiency: 92,
      health: 80,
      status: 'idle'
    },
    {
      id: 'ant_4',
      role: 'worker',
      experience: 55,
      efficiency: 70,
      health: 85,
      status: 'working'
    }
  ];

  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    colonyId: 'test-colony',
    ants: mockAnts,
    onRoleUpdate: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    test('renders when open', () => {
      render(<AntRolePanel {...defaultProps} />);
      
      expect(screen.getByText('Ant Role Management')).toBeInTheDocument();
      expect(screen.getByText(/Colony Ants/)).toBeInTheDocument();
      expect(screen.getByText(/4/)).toBeInTheDocument(); // Total ants count
    });

    test('does not render when closed', () => {
      render(<AntRolePanel {...defaultProps} isOpen={false} />);
      
      expect(screen.queryByText('Ant Role Management')).not.toBeInTheDocument();
    });

    test('displays all role categories with correct counts', () => {
      render(<AntRolePanel {...defaultProps} />);
      
      // Check role categories are displayed
      expect(screen.getByText('Worker')).toBeInTheDocument();
      expect(screen.getByText('Soldier')).toBeInTheDocument();
      expect(screen.getByText('Scout')).toBeInTheDocument();
      expect(screen.getByText('Nurse')).toBeInTheDocument();
      expect(screen.getByText('Builder')).toBeInTheDocument();
      expect(screen.getByText('Forager')).toBeInTheDocument();

      // Check ant counts per role
      expect(screen.getByText('2 ants')).toBeInTheDocument(); // Workers
      expect(screen.getByText('1 ants')).toBeInTheDocument(); // Soldier
    });
  });

  describe('Ant List Display', () => {
    test('displays all ants with correct information', () => {
      render(<AntRolePanel {...defaultProps} />);
      
      mockAnts.forEach(ant => {
        expect(screen.getByText(`Ant #${ant.id}`)).toBeInTheDocument();
        if (ant.experience) {
          expect(screen.getByText(new RegExp(`Exp: ${ant.experience}`))).toBeInTheDocument();
        }
      });
    });

    test('shows empty state when no ants match filter', () => {
      const propsWithEmptyAnts = { ...defaultProps, ants: [] };
      render(<AntRolePanel {...propsWithEmptyAnts} />);
      
      expect(screen.getByText('No ants found for the selected filter.')).toBeInTheDocument();
    });
  });

  describe('Filtering Functionality', () => {
    test('filters ants by role', async () => {
      render(<AntRolePanel {...defaultProps} />);
      
      const filterSelect = screen.getByDisplayValue('All Ants');
      fireEvent.change(filterSelect, { target: { value: 'worker' } });
      
      await waitFor(() => {
        expect(screen.getByText(/Colony Ants \(2\)/)).toBeInTheDocument(); // Only 2 workers
        expect(screen.getByText('Ant #ant_1')).toBeInTheDocument();
        expect(screen.getByText('Ant #ant_4')).toBeInTheDocument();
        expect(screen.queryByText('Ant #ant_2')).not.toBeInTheDocument(); // Soldier hidden
      });
    });

    test('shows all ants when filter is set to "all"', () => {
      render(<AntRolePanel {...defaultProps} />);
      
      const filterSelect = screen.getByDisplayValue('All Ants');
      fireEvent.change(filterSelect, { target: { value: 'all' } });
      
      expect(screen.getByText(/Colony Ants \(4\)/)).toBeInTheDocument();
    });
  });

  describe('Batch Mode', () => {
    test('enables batch mode when checkbox is clicked', () => {
      render(<AntRolePanel {...defaultProps} />);
      
      const batchCheckbox = screen.getByLabelText('Batch Mode');
      fireEvent.click(batchCheckbox);
      
      expect(batchCheckbox).toBeChecked();
      
      // Should show checkboxes for each ant
      const antCheckboxes = screen.getAllByRole('checkbox');
      expect(antCheckboxes.length).toBeGreaterThan(1); // Batch mode checkbox + ant checkboxes
    });

    test('shows selected count in batch mode', () => {
      render(<AntRolePanel {...defaultProps} />);
      
      // Enable batch mode
      const batchCheckbox = screen.getByLabelText('Batch Mode');
      fireEvent.click(batchCheckbox);
      
      // Select first ant
      const antCheckboxes = screen.getAllByRole('checkbox');
      const firstAntCheckbox = antCheckboxes[1]; // Skip the batch mode checkbox
      fireEvent.click(firstAntCheckbox);
      
      expect(screen.getByText('1 selected')).toBeInTheDocument();
    });
  });

  describe('Role Assignment', () => {
    test('shows role assignment controls when ant is selected', () => {
      render(<AntRolePanel {...defaultProps} />);
      
      const firstAnt = screen.getByText('Ant #ant_1');
      fireEvent.click(firstAnt);
      
      expect(screen.getByText('Select Role')).toBeInTheDocument();
      expect(screen.getByText('Assign Role')).toBeInTheDocument();
    });

    test('calls onRoleUpdate when role is assigned to single ant', async () => {
      render(<AntRolePanel {...defaultProps} />);
      
      // Select an ant
      const firstAnt = screen.getByText('Ant #ant_1');
      fireEvent.click(firstAnt);
      
      // Select a role
      const roleSelect = screen.getByDisplayValue('Select Role');
      fireEvent.change(roleSelect, { target: { value: 'soldier' } });
      
      // Click assign
      const assignButton = screen.getByText('Assign Role');
      fireEvent.click(assignButton);
      
      await waitFor(() => {
        expect(defaultProps.onRoleUpdate).toHaveBeenCalledWith(['ant_1'], 'soldier');
      });
    });

    test('calls onRoleUpdate for batch assignment', async () => {
      render(<AntRolePanel {...defaultProps} />);
      
      // Enable batch mode
      const batchCheckbox = screen.getByLabelText('Batch Mode');
      fireEvent.click(batchCheckbox);
      
      // Select multiple ants
      const antCheckboxes = screen.getAllByRole('checkbox');
      fireEvent.click(antCheckboxes[1]); // First ant
      fireEvent.click(antCheckboxes[2]); // Second ant
      
      // Select a role
      const roleSelect = screen.getByDisplayValue('Select Role');
      fireEvent.change(roleSelect, { target: { value: 'scout' } });
      
      // Click assign
      const assignButton = screen.getByText('Assign Role');
      fireEvent.click(assignButton);
      
      await waitFor(() => {
        expect(defaultProps.onRoleUpdate).toHaveBeenCalledWith(['ant_1', 'ant_2'], 'scout');
      });
    });

    test('does not call onRoleUpdate when no role is selected', () => {
      render(<AntRolePanel {...defaultProps} />);
      
      // Select an ant
      const firstAnt = screen.getByText('Ant #ant_1');
      fireEvent.click(firstAnt);
      
      // Try to assign without selecting a role
      const assignButton = screen.getByText('Assign Role');
      fireEvent.click(assignButton);
      
      expect(defaultProps.onRoleUpdate).not.toHaveBeenCalled();
    });
  });

  describe('Loading States', () => {
    test('disables assign button during loading', async () => {
      const slowOnRoleUpdate = vi.fn(() => new Promise(resolve => setTimeout(resolve, 100)));
      const props = { ...defaultProps, onRoleUpdate: slowOnRoleUpdate };
      
      render(<AntRolePanel {...props} />);
      
      // Select an ant and role
      const firstAnt = screen.getByText('Ant #ant_1');
      fireEvent.click(firstAnt);
      
      const roleSelect = screen.getByDisplayValue('Select Role');
      fireEvent.change(roleSelect, { target: { value: 'soldier' } });
      
      const assignButton = screen.getByText('Assign Role');
      fireEvent.click(assignButton);
      
      // Button should show loading state
      await waitFor(() => {
        expect(screen.getByText('Assigning...')).toBeInTheDocument();
      });
    });
  });

  describe('User Interactions', () => {
    test('closes panel when close button is clicked', () => {
      render(<AntRolePanel {...defaultProps} />);
      
      const closeButton = screen.getByLabelText('Close panel');
      fireEvent.click(closeButton);
      
      expect(defaultProps.onClose).toHaveBeenCalled();
    });

    test('closes panel when overlay is clicked', () => {
      render(<AntRolePanel {...defaultProps} />);
      
      const overlay = screen.getByRole('generic', { hidden: true }); // The overlay div
      fireEvent.click(overlay);
      
      expect(defaultProps.onClose).toHaveBeenCalled();
    });

    test('does not close panel when content is clicked', () => {
      render(<AntRolePanel {...defaultProps} />);
      
      const content = screen.getByText('Ant Role Management').closest('div');
      fireEvent.click(content);
      
      expect(defaultProps.onClose).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    test('has proper ARIA labels', () => {
      render(<AntRolePanel {...defaultProps} />);
      
      expect(screen.getByLabelText('Close panel')).toBeInTheDocument();
      expect(screen.getByLabelText('Batch Mode')).toBeInTheDocument();
    });

    test('has proper form controls', () => {
      render(<AntRolePanel {...defaultProps} />);
      
      // Select an ant to show role controls
      const firstAnt = screen.getByText('Ant #ant_1');
      fireEvent.click(firstAnt);
      
      const roleSelect = screen.getByRole('combobox');
      expect(roleSelect).toBeInTheDocument();
      
      const assignButton = screen.getByRole('button', { name: /assign role/i });
      expect(assignButton).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    test('handles onRoleUpdate errors gracefully', async () => {
      const errorOnRoleUpdate = vi.fn().mockRejectedValue(new Error('Assignment failed'));
      const props = { ...defaultProps, onRoleUpdate: errorOnRoleUpdate };
      
      // Spy on console.error to verify error logging
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      render(<AntRolePanel {...props} />);
      
      // Select an ant and role
      const firstAnt = screen.getByText('Ant #ant_1');
      fireEvent.click(firstAnt);
      
      const roleSelect = screen.getByDisplayValue('Select Role');
      fireEvent.change(roleSelect, { target: { value: 'soldier' } });
      
      const assignButton = screen.getByText('Assign Role');
      fireEvent.click(assignButton);
      
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Failed to update ant roles:', expect.any(Error));
      });
      
      consoleSpy.mockRestore();
    });
  });
}); 