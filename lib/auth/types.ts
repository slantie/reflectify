export const ADMIN_DESIGNATIONS = ["SUPER_ADMIN", "HOD", "AsstProf", "LabAsst"] as const

export type AdminDesignation = (typeof ADMIN_DESIGNATIONS)[number]

export type AdminSession = {
  adminId: string
  designation: AdminDesignation
  isSuper: boolean
}

export type LoginActionState = {
  error?: string
  fieldErrors?: {
    email?: string[]
    password?: string[]
  }
}
