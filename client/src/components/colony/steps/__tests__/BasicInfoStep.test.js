import { render, screen, fireEvent } from '@testing-library/react'
import { BasicInfoStep } from '../BasicInfoStep'

// Mock the useColonyForm hook
const mockUseColonyForm = {
  formData: {
    name: '',
    description: '',
    difficulty: 'Easy'
  },
  updateFormData: vi.fn(),
  getValidationErrors: vi.fn(() => ({}))
}

vi.mock('../../../hooks/useColonyForm', () => ({
  useColonyForm: () => mockUseColonyForm
}))

describe('BasicInfoStep', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('renders all form elements', () => {
    render(<BasicInfoStep />)
    
    expect(screen.getByLabelText(/colony name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument()
    expect(screen.getByText(/difficulty/i)).toBeInTheDocument()
    expect(screen.getByText(/easy/i)).toBeInTheDocument()
    expect(screen.getByText(/medium/i)).toBeInTheDocument()
    expect(screen.getByText(/hard/i)).toBeInTheDocument()
  })

  test('calls updateFormData when colony name changes', () => {
    render(<BasicInfoStep />)
    
    const nameInput = screen.getByLabelText(/colony name/i)
    fireEvent.change(nameInput, { target: { value: 'My Colony' } })
    
    expect(mockUseColonyForm.updateFormData).toHaveBeenCalledWith('name', 'My Colony')
  })

  test('calls updateFormData when description changes', () => {
    render(<BasicInfoStep />)
    
    const descriptionInput = screen.getByLabelText(/description/i)
    fireEvent.change(descriptionInput, { target: { value: 'A test colony' } })
    
    expect(mockUseColonyForm.updateFormData).toHaveBeenCalledWith('description', 'A test colony')
  })

  test('calls updateFormData when difficulty changes', () => {
    render(<BasicInfoStep />)
    
    const mediumRadio = screen.getByRole('radio', { name: /medium/i })
    fireEvent.click(mediumRadio)
    
    expect(mockUseColonyForm.updateFormData).toHaveBeenCalledWith('difficulty', 'Medium')
  })

  test('displays validation errors', () => {
    mockUseColonyForm.getValidationErrors.mockReturnValue({
      name: 'Name is too short'
    })
    
    render(<BasicInfoStep />)
    
    expect(screen.getByText('Name is too short')).toBeInTheDocument()
  })

  test('shows character count for name and description', () => {
    mockUseColonyForm.formData.name = 'Test'
    mockUseColonyForm.formData.description = 'Test description'
    
    render(<BasicInfoStep />)
    
    expect(screen.getByText('4/20')).toBeInTheDocument()
    expect(screen.getByText('16/200')).toBeInTheDocument()
  })
}) 