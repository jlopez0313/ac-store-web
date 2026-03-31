import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export default function PortalMenu({ anchorRef, onClose, children }: any) {
    const [coords, setCoords] = useState({ top: 0, left: 0 });
    const menuRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {

            if (menuRef?.current && !menuRef.current?.contains(e.target)) {
                onClose();
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [onClose]);

    useEffect(() => {
        const rect = anchorRef?.current?.getBoundingClientRect();
        const menuWidth = menuRef?.current.offsetWidth ?? 200;

        setCoords({
            top: rect.bottom + 4,
            left: rect.left - menuWidth + 40,
        });
    }, []);

    return createPortal(
        <div
            ref={menuRef}
            className="absolute bg-white shadow-lg rounded-md p-2 z-[9999] border right-0"
            style={{
                position: "fixed",
                top: coords.top,
                left: coords.left,
                width: '250px'
            }}
        >
            {children}
        </div>,
        document.body
    );
}
