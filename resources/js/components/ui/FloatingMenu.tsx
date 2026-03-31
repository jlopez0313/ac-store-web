import {
    LucideIcon
} from "lucide-react";
import { useRef } from "react";
import { Icon } from "./icon";

type Action = {
    title: string;
    action: (id: number, item: any) => void;
    icon: LucideIcon;
}

type Props = {
    item: any,
    actions: Action[]
    onClose: () => void;
}

export const FloatingMenu = ({ actions, item, onClose }: Props) => {
    const ref = useRef(null);

    return (
        <div ref={ref}>
            {
                actions.map((action, idx) => {
                    return <button key={idx}
                        className="flex items-center gap-3 w-full px-4 py-2 hover:bg-gray-100 text-sm cursor-pointer"
                        onClick={() =>{
                            action.action(item.id ?? item.hide_id, item);
                            onClose();
                        }}
                    >
                        <Icon
                            iconNode={action.icon}
                            className=" w-5 h-5"
                        />
                        <span className="text-left"> {action.title} </span>
                    </button>
                })
            }
        </div>
    );
};
