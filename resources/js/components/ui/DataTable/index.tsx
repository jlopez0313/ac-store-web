import { useMemo } from 'react';
import DataTable, { SortOrder, TableColumn } from 'react-data-table-component';
import { ActionsColumn } from './Actions';
import { customStyles } from './Styles';
import { Action } from './types';

import { paginationOptions } from './lang/es';
import { Loading } from './Loading';

import { TruncatedCell } from './TruncatedCell';

type Props = {
	data: any[];
	total: number;
	columns: any[];
	caption?: string;
	actions?: Action[];
	sortServer?: boolean;
	serverSide?: boolean;
	processing?: boolean;
	currentPage?: number;
	moreActions?: Action[];
	paginationServer?: boolean;
	paginationPerPage?: number;
	topActions?: React.ReactNode;
	noDataComponent?: React.ReactNode;
	onSort: (selectedColumn: TableColumn<any>, sortDirection: SortOrder, sortedRows: any[]) => void;
	fetchPage: (page: number) => void;
	setPageSize: (size: number) => void;
	fixedHeaderScrollHeight?: string;
}

export const DataGrid = ({
	data,
	columns,
	total,
	caption = '',
	sortServer = true,
	serverSide = false,
	processing = false,
	paginationServer = false,
	actions = [],
	moreActions = [],
	currentPage = 1,
	paginationPerPage = 10,
	topActions,
	noDataComponent = "No hay registros para mostrar",
	onSort,
	fetchPage,
	setPageSize,
	fixedHeaderScrollHeight = '540px'
}: Props) => {

	const actionCol = ActionsColumn(actions, moreActions);

	const cols = useMemo(() => {
		const enhancedColumns = columns.map(col => {
			if (col.id === 'actions' || col.ignoreRowClick || col.noTruncate) return col;

			return {
				...col,
				cell: (row: any, index: number) => {
					const content = col.cell ? col.cell(row, index) : col.selector ? col.selector(row, index) : '';
					return <TruncatedCell>{content}</TruncatedCell>;
				}
			};
		});
		return actionCol ? [...enhancedColumns, actionCol] : enhancedColumns;
	}, [columns, actionCol]);

	return (
		<DataTable

			title={caption}
			columns={cols}
			data={data}
			customStyles={customStyles}
			progressPending={serverSide && processing}
			progressComponent={serverSide && <Loading />}
			paginationRowsPerPageOptions={[1, 2, 10, 25, 50, 100]}

			pagination
			paginationServer={paginationServer}
			paginationTotalRows={total}
			paginationDefaultPage={currentPage}
			paginationPerPage={paginationPerPage}

			sortServer={sortServer}
			onSort={onSort}

			subHeader={!!topActions}
			subHeaderComponent={topActions}
			subHeaderAlign={'right' as any}

			onChangePage={fetchPage}
			onChangeRowsPerPage={setPageSize}

			responsive={true}
			fixedHeader={true}
			persistTableHead={true}
			fixedHeaderScrollHeight={fixedHeaderScrollHeight}

			paginationComponentOptions={paginationOptions}
			noDataComponent={noDataComponent}
		/>
	)
}
