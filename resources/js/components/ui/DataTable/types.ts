import { LucideIcon } from "lucide-react";

export type Action = {
	title: string;
	action: (id: number, item: any) => void;
	icon: LucideIcon;
	hide?: boolean | ((row: any) => boolean);
}