import { MoreVertical } from 'lucide-react';
import { useRef, useState } from 'react';
import { FloatingMenu } from '../FloatingMenu';
import PortalMenu from '../PortalMenu';
import { Action } from './types';

type Props = {
	actions: Action[];
	row: any;
};


export const MoreActions = ({ actions, row }: Props) => {

	const [open, setOpen] = useState(false);
	const anchorRef = useRef();

	return (
		<div className="relative">
			<button
				ref={anchorRef}
				onClick={() => setOpen(!open)}
				className="p-2 rounded cursor-pointer text-slate-600 hover:bg-gray-200 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-600 dark:hover:text-white transition-colors"
				title='Más acciones'
			>
				<MoreVertical className="w-4 h-4" />
			</button>

			{open && (
				<PortalMenu
					anchorRef={anchorRef}
					onClose={() => setOpen(false)}
				>
					<FloatingMenu onClose={() => setOpen(false)} actions={actions} item={row} />
				</PortalMenu>
			)}
		</div>
	);
};
