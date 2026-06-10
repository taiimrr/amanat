import { z } from 'zod'

export const CreateContractBody = z.object({
  businessId:         z.string().uuid(),
  contractType:       z.enum(['MUDARABA', 'MUSHARAKA', 'MURABAHA', 'IJARA', 'SALAM', 'WAKALA']),
  principalRM:        z.number().positive(),
  bankFeeCapPct:      z.number().min(0).max(1),
  depositorSplitPct:  z.number().min(0).max(1),
  sector:             z.enum(['GREEN_ENERGY', 'SME_FINANCING', 'AFFORDABLE_HOUSING', 'TRADE_FINANCE', 'AGRICULTURE']),
  startDate:          z.string().datetime(),
  endDate:            z.string().datetime().optional(),
  // MURABAHA-specific Shariah flags
  markupFixedAtSigning:   z.boolean().optional(),
  markupAccruesOverTime:  z.boolean().optional(),
  lateFeeGoesToCharity:   z.boolean().optional(),
})

export type CreateContractBodyType = z.infer<typeof CreateContractBody>
