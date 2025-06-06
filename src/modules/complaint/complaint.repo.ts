import { prisma } from '../../plugins/prisma'

export const getComplaintsByPosition = (positionId: string) =>
  prisma.complaint.findMany({
    where: { positionId },
    include: {
      position: {
        include: {
          order: {
            include: {
              positions: true,
              customer: true,
            },
          },
        },
      },
    },
  })

export const getComplaintsByOrder = (orderId: string) =>
  prisma.complaint.findMany({
    where: { position: { orderId } },
    include: {
      position: {
        include: {
          order: {
            include: {
              positions: true,
              customer: true,
            },
          },
        },
      },
    },
  })

export const getComplaintsByCustomer = (customerId: string) =>
  prisma.complaint.findMany({
    where: { position: { order: { customerId } } },
    include: {
      position: {
        include: {
          order: {
            include: {
              positions: true,
              customer: true,
            },
          },
        },
      },
    },
  })

export const getAllComplaints = () =>
  prisma.complaint.findMany({
    include: {
      position: {
        include: {
          order: {
            include: {
              positions: true,
              customer: true,
            },
          },
        },
      },
    },
  })
