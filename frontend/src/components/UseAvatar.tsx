interface UserAvatarProps {
  fullName: string
  size?: "sm" | "md" | "lg"
  className?: string
}

const UserAvatar = ({ fullName, size = "md", className = "" }: UserAvatarProps) => {
  const sizeClasses = {
    sm: "w-6 h-6 text-xs",
    md: "w-8 h-8 text-sm",
    lg: "w-12 h-12 text-lg",
  }

  const getInitials = (name: string) => {
    const parts = name.split(" ")
    if (parts.length === 1) {
      return parts[0].charAt(0).toUpperCase()
    } else if (parts.length > 1) {
      return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
    }
    return ""
  }

  return (
    <div
      className={`
        ${sizeClasses[size]} 
        bg-gradient-to-r from-purple-600 to-pink-600
        rounded-full
        flex items-center justify-center
        text-white font-medium
        ${className}
      `}
    >
      {getInitials(fullName)}
    </div>
  )
}

export default UserAvatar
