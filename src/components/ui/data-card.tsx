import { cn } from '@/lib/utils'
import { ReactNode } from 'react'

export interface DataCardProps {
    children: ReactNode;
    className?: string;
    padding?: 'none' | 'sm' | 'md' | 'lg'; // 0, 12, 16, 24
}

export const DataCard = ({ children, className, padding = 'md' }: DataCardProps) => {
    return (
        <div className={cn(
            "bg-black/80 backdrop-blur-md border border-white/10 rounded-sm relative overflow-hidden",
            {
                'p-0': padding === 'none',
                'p-3': padding === 'sm',
                'p-4': padding === 'md',
                'p-6': padding === 'lg',
            },
            className
        )}>
            {children}
        </div>
    )
}

export interface DataCardHeaderProps {
    title: string;
    action?: ReactNode;
    className?: string;
}

export const DataCardHeader = ({ title, action, className }: DataCardHeaderProps) => (
    <div className={cn("flex items-center justify-between mb-3", className)}>
        <h3 className="text-sm font-medium text-white">{title}</h3>
        {action && <div>{action}</div>}
    </div>
)

export const PrimaryButton = ({ children, onClick, className }: { children: ReactNode, onClick?: () => void, className?: string }) => (
    <button 
        onClick={onClick}
        className={cn("bg-white text-black text-xs font-medium rounded-sm px-4 py-2 hover:bg-gray-200 transition-colors duration-150 ease-out flex items-center justify-center", className)}
    >
        {children}
    </button>
)

export const OutlineButton = ({ children, onClick, className }: { children: ReactNode, onClick?: () => void, className?: string }) => (
    <button 
        onClick={onClick}
        className={cn("border border-white/20 text-white/80 text-xs rounded-sm px-4 py-2 hover:bg-white/10 hover:text-white transition-colors duration-150 ease-out flex items-center justify-center", className)}
    >
        {children}
    </button>
)
