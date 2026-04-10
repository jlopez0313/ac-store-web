
export const customStyles = {
  header: {
    style: {
      minHeight: '56px',
    },
  },
  headRow: {
    style: {
      backgroundColor: '#f8fafc', // bg-slate-50
      borderTopWidth: '1px',
      borderTopColor: '#e2e8f0', // border-slate-200
      borderBottomWidth: '1px',
      borderBottomColor: '#e2e8f0', // border-slate-200
      minHeight: '48px',
    },
  },
  headCells: {
    style: {
      fontSize: '12px',
      fontWeight: '700',
      color: '#334155', // text-slate-700
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      paddingLeft: '16px',
      paddingRight: '16px',
    } as any
  },
  rows: {
    style: {
      minHeight: '60px', 
      borderBottomStyle: 'solid' as any,
      borderBottomWidth: '1px',
      borderBottomColor: '#f1f5f9', // border-slate-100
      '&:hover': {
        backgroundColor: '#f8fafc', // hover:bg-slate-50
        transition: 'all 0.2s ease',
      },
    },
  },
  cells: {
    style: {
      fontSize: '14px',
      color: '#1e293b', // text-slate-800
      paddingLeft: '16px',
      paddingRight: '16px',
    }
  },
  pagination: {
    style: {
      borderTopWidth: '1px',
      borderTopColor: '#e2e8f0',
      fontSize: '13px',
      color: '#64748b',
    }
  }
}