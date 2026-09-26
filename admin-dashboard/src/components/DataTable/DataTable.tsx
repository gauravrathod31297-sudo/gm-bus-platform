
import React, { useMemo, useState } from 'react';
import {
  Table, TableHeader, TableRow, TableHeaderCell, TableBody, TableCell,
  Checkbox, Button, Text, Spinner, makeStyles, tokens,
} from '@fluentui/react-components';
import {
  ChevronLeftRegular, ChevronRightRegular,
  ArrowSortRegular, ArrowUpRegular, ArrowDownRegular,
} from '@fluentui/react-icons';

export interface Column<T> {
  key: string;
  label: string;
  sortable?: boolean;
  width?: string | number;
  render?: (row: T) => React.ReactNode;
  getValue?: (row: T) => string | number | Date | null | undefined;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  getRowId: (row: T) => string;
  loading?: boolean;
  selectable?: boolean;
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
  pageSize?: number;
  pageSizeOptions?: number[];
  emptyMessage?: string;
  rowActions?: (row: T) => React.ReactNode;
  onRowClick?: (row: T) => void;
}

const useStyles = makeStyles({
  wrapper: { display: 'flex', flexDirection: 'column', gap: '12px' },
  tableWrap: {
    overflowX: 'auto',
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: '8px',
    background: tokens.colorNeutralBackground1,
  },
  headerCell: {
    cursor: 'pointer',
    userSelect: 'none',
    whiteSpace: 'nowrap',
  },
  headerInner: { display: 'flex', alignItems: 'center', gap: '6px' },
  pagination: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap',
  },
  pagerBtns: { display: 'flex', alignItems: 'center', gap: '6px' },
  muted: { color: tokens.colorNeutralForeground3 },
  row: { '&:hover': { background: tokens.colorNeutralBackground2 } },
  pageSizeSelect: {
    padding: '4px 8px',
    borderRadius: '4px',
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    background: tokens.colorNeutralBackground1,
    color: tokens.colorNeutralForeground1,
    fontSize: '13px',
  },
});

type SortDir = 'asc' | 'desc';

export function DataTable<T>({
  columns,
  data,
  getRowId,
  loading,
  selectable,
  selectedIds = [],
  onSelectionChange,
  pageSize: initialPageSize = 10,
  pageSizeOptions = [10, 25, 50, 100],
  emptyMessage = 'No data',
  rowActions,
  onRowClick,
}: DataTableProps<T>) {
  const styles = useStyles();
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  const sorted = useMemo(() => {
    if (!sortKey) return data;
    const col = columns.find((c) => c.key === sortKey);
    if (!col) return data;
    const getVal = col.getValue || ((row: T) => (row as any)[col.key]);
    const arr = [...data];
    arr.sort((a, b) => {
      const av = getVal(a);
      const bv = getVal(b);
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      let cmp = 0;
      if (av instanceof Date && bv instanceof Date) cmp = av.getTime() - bv.getTime();
      else if (typeof av === 'number' && typeof bv === 'number') cmp = av - bv;
      else
        cmp = String(av).localeCompare(String(bv), undefined, {
          numeric: true,
          sensitivity: 'base',
        });
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return arr;
  }, [data, sortKey, sortDir, columns]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const currentPage = Math.min(page, totalPages);

  const pageData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sorted.slice(start, start + pageSize);
  }, [sorted, currentPage, pageSize]);

  const allSelected =
    pageData.length > 0 && pageData.every((r) => selectedIds.includes(getRowId(r)));
  const someSelected =
    !allSelected && pageData.some((r) => selectedIds.includes(getRowId(r)));

  const toggleSort = (key: string) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const toggleAll = () => {
    if (!onSelectionChange) return;
    if (allSelected) {
      onSelectionChange(
        selectedIds.filter((id) => !pageData.some((r) => getRowId(r) === id))
      );
    } else {
      const add = pageData.map(getRowId).filter((id) => !selectedIds.includes(id));
      onSelectionChange([...selectedIds, ...add]);
    }
  };

  const toggleRow = (id: string) => {
    if (!onSelectionChange) return;
    if (selectedIds.includes(id))
      onSelectionChange(selectedIds.filter((x) => x !== id));
    else onSelectionChange([...selectedIds, id]);
  };

  const colSpan =
    columns.length + (selectable ? 1 : 0) + (rowActions ? 1 : 0);

  return (
    <div className={styles.wrapper}>
      <div className={styles.tableWrap}>
        <Table size="small" aria-label="data table">
          <TableHeader>
            <TableRow>
              {selectable && (
                <TableHeaderCell style={{ width: 40 }}>
                  <Checkbox
                    checked={allSelected ? true : someSelected ? 'mixed' : false}
                    onChange={toggleAll}
                  />
                </TableHeaderCell>
              )}
              {columns.map((col) => (
                <TableHeaderCell
                  key={col.key}
                  style={{ width: col.width }}
                  className={col.sortable ? styles.headerCell : undefined}
                  onClick={col.sortable ? () => toggleSort(col.key) : undefined}
                >
                  <div className={styles.headerInner}>
                    <span>{col.label}</span>
                    {col.sortable &&
                      (sortKey === col.key ? (
                        sortDir === 'asc' ? (
                          <ArrowUpRegular fontSize={14} />
                        ) : (
                          <ArrowDownRegular fontSize={14} />
                        )
                      ) : (
                        <ArrowSortRegular fontSize={14} style={{ opacity: 0.4 }} />
                      ))}
                  </div>
                </TableHeaderCell>
              ))}
              {rowActions && <TableHeaderCell style={{ width: 60 }} />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={colSpan}>
                  <div style={{ display: 'flex', justifyContent: 'center', padding: 24 }}>
                    <Spinner label="Loading…" />
                  </div>
                </TableCell>
              </TableRow>
            ) : pageData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={colSpan}>
                  <div style={{ textAlign: 'center', padding: 32 }}>
                    <Text className={styles.muted}>{emptyMessage}</Text>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              pageData.map((row) => {
                const id = getRowId(row);
                return (
                  <TableRow
                    key={id}
                    className={styles.row}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                    style={onRowClick ? { cursor: 'pointer' } : undefined}
                  >
                    {selectable && (
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.includes(id)}
                          onChange={() => toggleRow(id)}
                        />
                      </TableCell>
                    )}
                    {columns.map((col) => (
                      <TableCell key={col.key}>
                        {col.render
                          ? col.render(row)
                          : (() => {
                              const v = (row as any)[col.key];
                              return v == null ? '—' : String(v);
                            })()}
                      </TableCell>
                    ))}
                    {rowActions && <TableCell>{rowActions(row)}</TableCell>}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <div className={styles.pagination}>
        <Text className={styles.muted}>
          {sorted.length === 0
            ? '0'
            : `${(currentPage - 1) * pageSize + 1}–${Math.min(
                currentPage * pageSize,
                sorted.length
              )}`}{' '}
          of {sorted.length}
          {selectable && selectedIds.length > 0
            ? ` · ${selectedIds.length} selected`
            : ''}
        </Text>
        <div className={styles.pagerBtns}>
          <select
            className={styles.pageSizeSelect}
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(1);
            }}
          >
            {pageSizeOptions.map((n) => (
              <option key={n} value={n}>
                {n} / page
              </option>
            ))}
          </select>
          <Button
            appearance="subtle"
            icon={<ChevronLeftRegular />}
            disabled={currentPage <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          />
          <Text>
            Page {currentPage} / {totalPages}
          </Text>
          <Button
            appearance="subtle"
            icon={<ChevronRightRegular />}
            disabled={currentPage >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          />
        </div>
      </div>
    </div>
  );
}

export default DataTable;
