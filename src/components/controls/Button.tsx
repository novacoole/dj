interface ButtonProps {
  children: React.ReactNode
  onClick?: () => void
  variant?: 'primary' | 'secondary' | 'danger' | 'success'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  active?: boolean
}

const Button = ({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  active = false
}: ButtonProps) => {
  const baseClasses = 'font-semibold rounded-lg transition-all duration-200 select-none border-2'
  
  const variantClasses = {
    primary: `
      bg-mixxx-blue hover:bg-blue-600 active:bg-blue-700 
      border-mixxx-blue hover:border-blue-600
      text-white
    `,
    secondary: `
      bg-gray-600 hover:bg-gray-500 active:bg-gray-700
      border-gray-600 hover:border-gray-500
      text-white
    `,
    danger: `
      bg-mixxx-red hover:bg-red-600 active:bg-red-700
      border-mixxx-red hover:border-red-600
      text-white
    `,
    success: `
      bg-mixxx-green hover:bg-green-500 active:bg-green-600
      border-mixxx-green hover:border-green-500
      text-black
    `
  }

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  }

  const disabledClasses = 'opacity-50 cursor-not-allowed hover:bg-current'
  const activeClasses = 'brightness-125 shadow-lg'

  return (
    <button
      onClick={disabled ? undefined : onClick}
      className={`
        ${baseClasses}
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${disabled ? disabledClasses : 'cursor-pointer'}
        ${active ? activeClasses : ''}
      `}
      disabled={disabled}
    >
      {children}
    </button>
  )
}

export default Button