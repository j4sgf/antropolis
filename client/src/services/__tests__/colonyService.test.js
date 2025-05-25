import { colonyService } from '../colonyService'

// Mock fetch globally
global.fetch = vi.fn()

describe('colonyService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    fetch.mockClear()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('createColony', () => {
    test('should make POST request with colony data', async () => {
      const mockColonyData = {
        name: 'Test Colony',
        attributes: { strength: 5, speed: 5, intelligence: 5, defense: 5 },
        colonyType: 'balanced',
        color: 'forest-green'
      }

      const mockResponse = {
        id: 1,
        ...mockColonyData,
        created_at: new Date().toISOString()
      }

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      })

      const result = await colonyService.createColony(mockColonyData)

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/colonies'),
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(mockColonyData)
        }
      )
      expect(result).toEqual(mockResponse)
    })

    test('should throw error when request fails', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request'
      })

      await expect(colonyService.createColony({})).rejects.toThrow('Failed to create colony: 400')
    })

    test('should handle network errors', async () => {
      fetch.mockRejectedValueOnce(new Error('Network error'))

      await expect(colonyService.createColony({})).rejects.toThrow('Network error')
    })
  })

  describe('getColonies', () => {
    test('should fetch all colonies', async () => {
      const mockColonies = [
        { id: 1, name: 'Colony 1' },
        { id: 2, name: 'Colony 2' }
      ]

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockColonies
      })

      const result = await colonyService.getColonies()

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/colonies'),
        expect.objectContaining({
          method: 'GET'
        })
      )
      expect(result).toEqual(mockColonies)
    })
  })

  describe('getColony', () => {
    test('should fetch specific colony by id', async () => {
      const mockColony = { id: 1, name: 'Test Colony' }

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockColony
      })

      const result = await colonyService.getColony(1)

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/colonies/1'),
        expect.objectContaining({
          method: 'GET'
        })
      )
      expect(result).toEqual(mockColony)
    })

    test('should throw error for invalid colony id', async () => {
      await expect(colonyService.getColony(null)).rejects.toThrow('Colony ID is required')
    })
  })

  describe('simulateColonyTick', () => {
    test('should simulate one tick for colony', async () => {
      const mockTickResult = {
        resources: { food: 150, materials: 75 },
        population: 120,
        events: ['Found new food source']
      }

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockTickResult
      })

      const result = await colonyService.simulateColonyTick(1)

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/colonies/1/simulate'),
        expect.objectContaining({
          method: 'POST'
        })
      )
      expect(result).toEqual(mockTickResult)
    })
  })
}) 