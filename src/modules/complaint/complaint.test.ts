/// <reference types="vitest" />
import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest'
import type { Mock } from 'vitest'
import Fastify from 'fastify'
import complaintRoutes from './complaint.routes'

import {
  createComplaint,
  getAllComplaints,
  getComplaintsByPosition,
  getComplaintsByOrder,
  getComplaintsByCustomer,
} from './complaint.service'

// Mock the service module to isolate route tests
vi.mock('./complaint.service')

describe('Complaint routes', () => {
  let app: ReturnType<typeof Fastify>

  const mockComplaint = {
    id: '11111111-1111-1111-1111-111111111111',
    positionId: '22222222-2222-2222-2222-222222222222',
    ComplaintReason: 'WRONG_SIZE' as const,
    ComplaintKind: 'INTERN' as const,
    orderId: '33333333-3333-3333-3333-333333333333',
    customerId: '44444444-4444-4444-4444-444444444444',
  }

  beforeAll(async () => {
    app = Fastify()
    app.register(complaintRoutes, { prefix: '/complaints' })
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('POST /complaints should call createComplaint and return its result', async () => {
    (createComplaint as Mock).mockResolvedValue(mockComplaint)

    const payload = {
      positionId: mockComplaint.positionId,
      ComplaintReason: mockComplaint.ComplaintReason,
      ComplaintKind: mockComplaint.ComplaintKind,
      createNewOrder: true,
    }

    const response = await app.inject({ method: 'POST', url: '/complaints', payload })

    expect(response.statusCode).toBe(200)
    expect(createComplaint).toHaveBeenCalledWith(payload)
    expect(response.json()).toEqual(mockComplaint)
  })

  it('GET /complaints should call getAllComplaints and return its result', async () => {
    (getAllComplaints as Mock).mockResolvedValue([mockComplaint])

    const response = await app.inject({ method: 'GET', url: '/complaints' })

    expect(response.statusCode).toBe(200)
    expect(getAllComplaints).toHaveBeenCalled()
    expect(response.json()).toEqual([mockComplaint])
  })

  it('GET /complaints?positionId=ID should call getComplaintsByPosition and return its result', async () => {
    (getComplaintsByPosition as Mock).mockResolvedValue([mockComplaint])

    const url = `/complaints?positionId=${mockComplaint.positionId}`
    const response = await app.inject({ method: 'GET', url })

    expect(response.statusCode).toBe(200)
    expect(getComplaintsByPosition).toHaveBeenCalledWith(mockComplaint.positionId)
    expect(response.json()).toEqual([mockComplaint])
  })

  it('GET /complaints?orderId=ID should call getComplaintsByOrder and return its result', async () => {
    (getComplaintsByOrder as Mock).mockResolvedValue([mockComplaint])

    const url = `/complaints?orderId=${mockComplaint.orderId}`
    const response = await app.inject({ method: 'GET', url })

    expect(response.statusCode).toBe(200)
    expect(getComplaintsByOrder).toHaveBeenCalledWith(mockComplaint.orderId)
    expect(response.json()).toEqual([mockComplaint])
  })

  it('GET /complaints?customerId=ID should call getComplaintsByCustomer and return its result', async () => {
    (getComplaintsByCustomer as Mock).mockResolvedValue([mockComplaint])

    const url = `/complaints?customerId=${mockComplaint.customerId}`
    const response = await app.inject({ method: 'GET', url })

    expect(response.statusCode).toBe(200)
    expect(getComplaintsByCustomer).toHaveBeenCalledWith(mockComplaint.customerId)
    expect(response.json()).toEqual([mockComplaint])
  })
})
