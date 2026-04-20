import logo from '@/img/logo.svg';
import { cn } from '@/lib/utils';
import { ImgHTMLAttributes } from 'react';

export default function AppLogoIcon({ className, ...props }: ImgHTMLAttributes<HTMLImageElement>) {
    return (
        <img
            {...props}
            src={logo}
            alt="Logo"
            className={cn("w-10 h-10 brightness-0 invert", className)}
        />
    );
}

