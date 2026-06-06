import { z } from 'zod'

const PASSWORD_RULE = /^(?=.*[A-Z])(?=.*\d).{8,}$/

export const RegisterBody = z.object({
  email: z.string().email(),
  password: z.string().regex(PASSWORD_RULE, 'Must be 8+ chars with at least one uppercase letter and one number'),
  role: z.enum(['DEPOSITOR', 'BUSINESS']),
  // DEPOSITOR
  displayName: z.string().min(1).max(100).optional(),
  // BUSINESS
  legalName: z.string().min(1).max(200).optional(),
  sector: z.enum(['GREEN_ENERGY', 'SME_FINANCING', 'AFFORDABLE_HOUSING', 'TRADE_FINANCE', 'AGRICULTURE']).optional(),
  description: z.string().min(10).optional(),
}).superRefine((data, ctx) => {
  if (data.role === 'DEPOSITOR' && !data.displayName) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'displayName is required for DEPOSITOR', path: ['displayName'] })
  }
  if (data.role === 'BUSINESS') {
    if (!data.legalName)   ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'legalName is required for BUSINESS',   path: ['legalName'] })
    if (!data.sector)      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'sector is required for BUSINESS',      path: ['sector'] })
    if (!data.description) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'description is required for BUSINESS', path: ['description'] })
  }
})

export const LoginBody = z.object({
  email: z.string().email(),
  password: z.string(),
})

export type RegisterBodyType = z.infer<typeof RegisterBody>
export type LoginBodyType   = z.infer<typeof LoginBody>
