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
                        className="flex items-center gap-3 w-full px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-700/50 text-sm text-slate-700 dark:text-slate-200 cursor-pointer transition-colors group"
                        onClick={() =>{
                            action.action(item.id ?? item.hide_id, item);
                            onClose();
                        }}
                    >
                        <Icon
                            iconNode={action.icon}
                            className="w-4 h-4 text-slate-400 group-hover:text-slate-600 dark:text-slate-500 dark:group-hover:text-slate-300 transition-colors"
                        />
                        <span className="text-left font-medium"> {action.title} </span>
                    </button>
                })
            }
        </div>
    );
};
