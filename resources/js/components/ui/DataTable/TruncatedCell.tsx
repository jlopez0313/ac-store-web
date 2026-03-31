import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import React, { useEffect, useRef, useState } from 'react';

interface TruncatedCellProps {
    children: React.ReactNode;
}

export const TruncatedCell = ({ children }: TruncatedCellProps) => {
    const [isTruncated, setIsTruncated] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    const checkTruncation = () => {
        if (ref.current) {
            setIsTruncated(ref.current.scrollWidth > ref.current.offsetWidth);
        }
    };

    useEffect(() => {
        // Initial check
        checkTruncation();

        // Check on resize
        const resizeObserver = new ResizeObserver(() => checkTruncation());
        if (ref.current) {
            resizeObserver.observe(ref.current);
        }

        return () => {
            resizeObserver.disconnect();
        };
    }, [children]);

    const content = (
        <div
            ref={ref}
            className="truncate w-full"
            onMouseEnter={checkTruncation}
        >
            {children}
        </div>
    );

    // If it's a string or number, we can show it in a tooltip
    // If it's a React element, it might be more complex, but we still try to show it
    if (!isTruncated) {
        return content;
    }

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    {content}
                </TooltipTrigger>
                <TooltipContent className="max-w-md break-words">
                    {children}
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
};
