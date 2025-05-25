import { renderHook, act } from '@testing-library/react'
import { useColonyForm } from '../useColonyForm'

describe('useColonyForm', () => {
  test('should initialize with default values', () => {
    const { result } = renderHook(() => useColonyForm())
    
    expect(result.current.formData.name).toBe('')
    expect(result.current.formData.description).toBe('')
    expect(result.current.formData.difficulty).toBe('Easy')
    expect(result.current.formData.attributes.strength).toBe(5)
    expect(result.current.formData.attributes.speed).toBe(5)
    expect(result.current.formData.attributes.intelligence).toBe(5)
    expect(result.current.formData.attributes.defense).toBe(5)
    expect(result.current.currentStep).toBe(1)
  })

  test('should update form data correctly', () => {
    const { result } = renderHook(() => useColonyForm())
    
    act(() => {
      result.current.updateFormData('name', 'Test Colony')
    })
    
    expect(result.current.formData.name).toBe('Test Colony')
  })

  test('should validate attribute total equals 20', () => {
    const { result } = renderHook(() => useColonyForm())
    
    // Set attributes to total more than 20
    act(() => {
      result.current.updateFormData('attributes', {
        strength: 8,
        speed: 8,
        intelligence: 8,
        defense: 8
      })
    })
    
    expect(result.current.getAttributeTotal()).toBe(32)
    expect(result.current.isFormValid()).toBe(false)
  })

  test('should validate name length', () => {
    const { result } = renderHook(() => useColonyForm())
    
    act(() => {
      result.current.updateFormData('name', 'ab') // Too short
    })
    
    expect(result.current.getValidationErrors().name).toBeTruthy()
    
    act(() => {
      result.current.updateFormData('name', 'Valid Colony Name')
    })
    
    expect(result.current.getValidationErrors().name).toBeFalsy()
  })

  test('should navigate between steps correctly', () => {
    const { result } = renderHook(() => useColonyForm())
    
    expect(result.current.currentStep).toBe(1)
    
    act(() => {
      result.current.nextStep()
    })
    
    expect(result.current.currentStep).toBe(2)
    
    act(() => {
      result.current.prevStep()
    })
    
    expect(result.current.currentStep).toBe(1)
  })

  test('should apply colony type bonuses correctly', () => {
    const { result } = renderHook(() => useColonyForm())
    
    act(() => {
      result.current.updateFormData('colonyType', 'aggressive')
    })
    
    const finalAttributes = result.current.getFinalAttributes()
    expect(finalAttributes.strength).toBeGreaterThan(result.current.formData.attributes.strength)
  })
}) 