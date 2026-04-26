import { MoreActions } from './MoreActions';
import { Action } from './types';

export const ActionsColumn = (actions: Action[], moreActions: Action[]) => {
	if (!actions.length && !moreActions.length) return null;

	return {
		name: 'Acciones',
		// right: true,
		// allowOverflow: true,
		// button: true,
		id: "actions",
		className: "actions-col",
		ignoreRowClick: true,
		cell: (row: any) => (
			<div className="flex gap-2">

				{
					moreActions.length ?
						<MoreActions actions={moreActions} row={row} /> : null
				}

				{actions.map((action: Action, idx: number) => {
					if (row._estado_raw === 'C' && (action.title === 'Editar' || action.title === 'Eliminar')) {
						return null;
					}

					return (
						<button
							key={idx}
							className="p-2 rounded cursor-pointer text-slate-600 hover:bg-gray-200 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-600 dark:hover:text-white transition-colors"
							title={action.title}
							onClick={() =>
								action.action(row.id, row)
							}
						>
							<action.icon className="w-5 h-5" />
						</button>
					);
				})}
			</div>
		),
	};
}
