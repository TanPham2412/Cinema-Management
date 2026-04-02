// Role ID constants - must match backend Role entity IDs
export const R = {
  ADMIN: 57,
  CUSTOMER: 22,
  STAFF: 73,
}

export const isAdmin = (role) => role === R.ADMIN
export const isStaff = (role) => role === R.STAFF
export const isAdminOrStaff = (role) => role === R.ADMIN || role === R.STAFF
