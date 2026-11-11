import type { ButtonHTMLAttributes, PropsWithChildren } from 'react'

type Props = PropsWithChildren<ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'quiet' }>

export default function PrimaryButton({ children, variant = 'primary', className = '', ...props }: Props) {
  return <button className={`button button-${variant} ${className}`} {...props}>{children}</button>
}
