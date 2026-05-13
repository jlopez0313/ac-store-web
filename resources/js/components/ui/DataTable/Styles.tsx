
export const customStyles = {
  header: {
    style: {
      minHeight: '56px',
      backgroundColor: 'var(--card)',
    },
  },
  headRow: {
    style: {
      backgroundColor: 'var(--muted)',
      borderTopWidth: '1px',
      borderTopColor: 'var(--border)',
      borderBottomWidth: '1px',
      borderBottomColor: 'var(--border)',
      minHeight: '48px',
    },
  },
  headCells: {
    style: {
      fontSize: '12px',
      fontWeight: '700',
      color: 'var(--muted-foreground)',
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      paddingLeft: '16px',
      paddingRight: '16px',
      borderRightWidth: '1px',
      borderRightColor: 'var(--border)',
    } as any
  },
  rows: {
    style: {
      minHeight: '45px',
      backgroundColor: 'var(--card)',
      color: 'var(--card-foreground)',
      borderBottomStyle: 'solid' as any,
      borderBottomWidth: '1px',
      borderBottomColor: 'var(--border)',
      '&:hover': {
        backgroundColor: 'var(--muted)',
        transition: 'all 0.2s ease',
      },
    },
  },
  cells: {
    style: {
      fontSize: '13px',
      color: 'var(--card-foreground)',
      paddingLeft: '16px',
      paddingRight: '16px',
      borderRightWidth: '1px',
      borderRightColor: 'var(--border)',
    }
  },
  pagination: {
    style: {
      backgroundColor: 'var(--card)',
      color: 'var(--muted-foreground)',
      borderTopWidth: '1px',
      borderTopColor: 'var(--border)',
      fontSize: '13px',
    },
    pageButtonsStyle: {
      fill: 'var(--muted-foreground)',
      '&:disabled': {
        fill: 'var(--muted-foreground)',
        opacity: 0.3,
      },
      '&:hover:not(:disabled)': {
        backgroundColor: 'var(--muted)',
      },
      '&:focus': {
        backgroundColor: 'var(--muted)',
      },
    },
  },
}