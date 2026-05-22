import { UserProfile } from "@/hooks/use-auth"

export const getRedirectPath = (role: string | null | undefined): string => {
  if (!role) return "/login"
  
  switch (role.toLowerCase()) {
    case "instructor":
      return "/instructor"
    case "admin":
    case "superadmin":
    case "super_admin":
      return "/admin"
    case "student":
    default:
      return "/dashboard"
  }
}

export const getPortalName = (role: string | null | undefined): string => {
  if (!role) return "Student"
  
  switch (role.toLowerCase()) {
    case "instructor":
      return "Instructor"
    case "admin":
    case "superadmin":
    case "super_admin":
      return "Admin"
    default:
      return "Student"
  }
}
