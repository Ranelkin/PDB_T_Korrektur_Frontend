import React from 'react';

const Button = ({
  children,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  fullWidth = false,
  onClick,
  type = 'button',
  icon,
  iconPosition = 'left',
  className = '',
}) => {
  // Base styles
  const baseStyles = "font-medium rounded focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-colors";
  
  // Variant styles
  const variantStyles = {
    primary: "bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500",
    secondary: "bg-gray-200 hover:bg-gray-300 text-gray-800 focus:ring-gray-400",
    success: "bg-green-600 hover:bg-green-700 text-white focus:ring-green-500",
    danger: "bg-red-600 hover:bg-red-700 text-white focus:ring-red-500",
    outline: "bg-transparent border border-blue-600 text-blue-600 hover:bg-blue-50 focus:ring-blue-500",
    ghost: "bg-transparent hover:bg-gray-100 text-gray-800 focus:ring-gray-400",
  };
  
  // Size styles
  const sizeStyles = {
    small: "py-1 px-3 text-sm",
    medium: "py-2 px-4 text-base",
    large: "py-3 px-6 text-lg",
  };
  
  // Width styles
  const widthStyles = fullWidth ? "w-full" : "";
  
  // Disabled styles
  const disabledStyles = disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer";
  
  return (
    <button
      type={type}
      className={`
        ${baseStyles}
        ${variantStyles[variant] || variantStyles.primary}
        ${sizeStyles[size] || sizeStyles.medium}
        ${widthStyles}
        ${disabledStyles}
        ${iconPosition === 'right' ? 'flex-row-reverse' : 'flex-row'}
        ${icon ? 'inline-flex items-center justify-center' : ''}
        ${className}
      `}
      onClick={onClick}
      disabled={disabled}
    >
      {icon && (
        <span className={`${iconPosition === 'left' ? 'mr-2' : 'ml-2'}`}>
          {icon}
        </span>
      )}
      {children}
    </button>
  );
};

export default Button;