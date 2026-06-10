import { z } from 'zod'

export const CreateAllocationBody = z.object({
  investmentId: z.string().uuid(),
  amountRM:     z.number().positive(),
})

export type CreateAllocationBodyType = z.infer<typeof CreateAllocationBody>
