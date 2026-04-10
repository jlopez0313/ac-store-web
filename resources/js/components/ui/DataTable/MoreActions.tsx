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
				className="p-2 rounded hover:bg-gray-200"
				title='Más acciones'
			>
				<MoreVertical className="w-4 h-4" />
			</button>

			{open && (
				<div className="absolute right-0 z-50 mt-1 w-40 rounded-md border bg-white shadow-lg">
					<PortalMenu
						anchorRef={anchorRef}
						onClose={() => setOpen(false)}
					>
						<FloatingMenu onClose={() => setOpen(false)} actions={actions} item={row} />
					</PortalMenu>
				</div>
			)}
		</div>
	);
};
