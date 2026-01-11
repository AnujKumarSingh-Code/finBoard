'use client';

import { useState, useMemo, useEffect } from 'react';

import { Search, ChevronUp, ChevronDown, TrendingUp, TrendingDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { WidgetConfig } from '@/types';

import { parseGainersLosers, normalizeDataForDisplay } from '@/lib/api';

import { formatCurrency, formatPercentage, cn } from '@/utils';
import { Input } from '@/components/ui';

interface TableWidgetProps {
  widget: WidgetConfig;
  data: unknown;
}

const ITEMS_PER_PAGE_OPTIONS = [5, 10, 20, 50];

export function TableWidget({ widget, data }: TableWidgetProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<string | null>(null);

  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [activeTab, setActiveTab] = useState<'gainers' | 'losers' | 'active'>('gainers');

  const [currentPage, setCurrentPage] = useState(1);

  const [itemsPerPage, setItemsPerPage] = useState(10);

  const tableData = useMemo(() => {

    // Check if its gainers/losers data
    const gainersLosers = parseGainersLosers(data);
    if (gainersLosers) {
      switch (activeTab) {
        case 'gainers':
          return gainersLosers.gainers;
        case 'losers':
          return gainersLosers.losers;
        case 'active':
          return gainersLosers.mostActive;
        default:
          return gainersLosers.gainers;
      }
    }



    // Fallback to generic data normalization
    return normalizeDataForDisplay(data);
  }, [data, activeTab]);



  const isGainersLosersData = useMemo(() => {
    return parseGainersLosers(data) !== null;
  }, [data]);

  const columns = useMemo(() => {
    if (!tableData.length) return [];

    const row = tableData[0];
    return Object.keys(row).filter(key => 
      !key.startsWith('_') && 
      key !== 'id'
    );
  }, [tableData]);


  const filteredData = useMemo(() => {
    let result = [...tableData];


    // Filter by search query
    if (searchQuery) {
      result = result.filter((row) =>
        Object.values(row).some((value) =>
          String(value).toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    }



    // Sort
    if (sortField) {
      result.sort((a, b) => {
        const aVal = (a as Record<string, unknown>)[sortField];
        const bVal = (b as Record<string, unknown>)[sortField];

        if (typeof aVal === 'number' && typeof bVal === 'number') 
          {
          return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
        }



        const aStr = String(aVal || '').replace(/[%$,]/g, '');
        const bStr = String(bVal || '').replace(/[%$,]/g, '');


        const aNum = parseFloat(aStr);
        const bNum = parseFloat(bStr);

        if (!isNaN(aNum) && !isNaN(bNum)) 
          {
          return sortDirection === 'asc' ? aNum - bNum : bNum - aNum;
        }




        return sortDirection === 'asc'
          ? aStr.localeCompare(bStr)
          : bStr.localeCompare(aStr);
      });
    }



    return result;
  }, [tableData, searchQuery, sortField, sortDirection]);



  // Pagination calculations
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;

  const paginatedData = filteredData.slice(startIndex, endIndex);



  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, activeTab, sortField, sortDirection, itemsPerPage]);

  // Ensure current page is valid
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);



  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };



  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };



  // Generate page numbers to show
  const getPageNumbers = (): (number | 'ellipsis')[] => {
    const pages: (number | 'ellipsis')[] = [];
    const maxVisible = 5;



    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      if (currentPage > 3) {
        pages.push('ellipsis');
      }

      // Show pages around current
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) 
      {
        pages.push(i);
      }

      if (currentPage < totalPages - 2) {
        pages.push('ellipsis');
      }

      // Always show last page
      if (totalPages > 1) {
        pages.push(totalPages);
      }
    }

    return pages;
  };



  const formatValue = (key: string, value: unknown): React.ReactNode => 
  {

    if (value === null || value === undefined) return '-';

    const strValue = String(value);


    // Check if its a percentage
    if (key.toLowerCase().includes('percent') || strValue.includes('%')) {

      const num = parseFloat(strValue.replace('%', ''));

      if (!isNaN(num)) {
        return (
          <span className={cn(
            'inline-flex items-center gap-1  font-medium',
            num >= 0 ? 'text-success-600 dark:text-success-400' : 'text-danger-600 dark:text-danger-400'
          )}>
            {num >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {formatPercentage(num)}
          </span>
        );
      }
    }


    // Check if its a price/ currency
    if (key.toLowerCase().includes('price') || key.toLowerCase().includes('change_amount')) {
      const num = parseFloat(strValue.replace(/[$,]/g, ''));


      if (!isNaN(num)) {

        if (key.toLowerCase().includes('change')) 
        {
          return (
            <span className={cn(
              'font-medium',
              num >= 0 ? 'text-success-600 dark:text-success-400' : 'text-danger-600 dark:text-danger-400'
            )}>
              {num >= 0 ? '+' : ''}{formatCurrency(num)}
            </span>
          );
        }
        return formatCurrency(num);
      }
    }



    // Check if its a volume number
    if (key.toLowerCase().includes('volume')) {
      const num = parseFloat(strValue.replace(/,/g, ''));

      if (!isNaN(num)) 
      {
        return new Intl.NumberFormat('en-US', { notation: 'compact' }).format(num);
      }
    }


    return strValue;
  };



  const formatColumnName = (key: string): string => {
    return key
      .replace(/_/g, ' ')
      .replace(/([A-Z])/g, ' $1')
      .trim()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  if (!tableData.length) {
    return (
      <div className="flex items-center justify-center h-full text-surface-500">
        No data available
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">

      {/* Tabs for gainers/losers */}
      {isGainersLosersData && (
        <div className="flex gap-1 p-1 bg-surface-100 dark:bg-surface-700 rounded-lg mb-3">
          {(['gainers', 'losers', 'active'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                'flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-all',
                activeTab === tab
                  ? 'bg-white dark:bg-surface-600 text-surface-900 dark:text-white shadow-sm'
                  : 'text-surface-500 hover:text-surface-700 dark:hover:text-surface-300'
              )}
            >
              {tab === 'gainers' ? '🚀 Gainers' : tab === 'losers' ? '📉 Losers' : '📊 Active'}
            </button>
          ))}
        </div>
      )}



      {/* Search and Items Per Page */}
      <div className="flex items-center gap-2 mb-3">
        <div className="flex-1">
          <Input
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
            className="text-sm"
          />
        </div>


        <select
          value={itemsPerPage}
          onChange={(e) => setItemsPerPage(Number(e.target.value))}
          className="px-2 py-2 text-xs bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-lg text-surface-600 dark:text-surface-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          {ITEMS_PER_PAGE_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option} / page
            </option>
          ))}
        </select>

      </div>



      {/* Table */}
      <div className="flex-1 overflow-auto rounded-lg border border-surface-200 dark:border-surface-700">
        <table className="w-full text-sm">
          <thead className="bg-surface-50 dark:bg-surface-800 sticky top-0">
            <tr>
              {columns.map((col) => (
                <th
                  key={col}
                  onClick={() => handleSort(col)}
                  className="px-3 py-2 text-left font-semibold text-surface-600 dark:text-surface-300 cursor-pointer hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors whitespace-nowrap"
                >
                  <div className="flex items-center gap-1">
                    {formatColumnName(col)}
                    {sortField === col && (
                      sortDirection === 'asc'
                        ? <ChevronUp className="w-3 h-3" />
                        : <ChevronDown className="w-3 h-3" />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((row, idx) => (
              <tr
                key={idx}
                className="hover:bg-surface-50 dark:hover:bg-surface-700/50 transition-colors"
              >
                {columns.map((col) => (
                  <td
                    key={col}
                    className="px-3 py-2 border-t border-surface-100 dark:border-surface-700 whitespace-nowrap"
                  >
                    {formatValue(col, (row as Record<string, unknown>)[col])}
                  </td>
                ))}
              </tr>
            ))}
            {paginatedData.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="px-3 py-8 text-center text-surface-400">
                  No results found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>



      {/* Pagination Controls */}
      <div className="flex items-center justify-between mt-3 pt-2 border-t border-surface-100 dark:border-surface-800">
        {/* Info */}
        <div className="text-xs text-surface-400">
          {filteredData.length > 0 ? (
            <>
              Showing {startIndex + 1}-{Math.min(endIndex, filteredData.length)} of {filteredData.length}
            </>
          ) : (
            'No items'
          )}
        </div>


        {/* Page Controls */}
        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            {/* First Page */}
            <button
              onClick={() => goToPage(1)}
              disabled={currentPage === 1}
              className={cn(
                'p-1.5 rounded-md transition-colors',
                currentPage === 1
                  ? 'text-surface-300 dark:text-surface-600 cursor-not-allowed'
                  : 'text-surface-500 hover:bg-surface-100 dark:hover:bg-surface-700 hover:text-surface-700 dark:hover:text-surface-300'
              )}
              title="First page"
            >
              <ChevronsLeft className="w-4 h-4" />
            </button>


            {/* Previous Page */}
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              className={cn(
                'p-1.5 rounded-md transition-colors',
                currentPage === 1
                  ? 'text-surface-300 dark:text-surface-600 cursor-not-allowed'
                  : 'text-surface-500 hover:bg-surface-100 dark:hover:bg-surface-700 hover:text-surface-700 dark:hover:text-surface-300'
              )}
              title="Previous page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Page Numbers */}
            <div className="flex items-center gap-1 mx-1">
              {getPageNumbers().map((page, idx) => (
                page === 'ellipsis' ? (
                  <span key={`ellipsis-${idx}`} className="px-1 text-surface-400">
                    ...
                  </span>
                ) : (
                  <button
                    key={page}
                    onClick={() => goToPage(page)}
                    className={cn(
                      'min-w-[28px] h-7 px-2 text-xs font-medium rounded-md transition-colors',
                      currentPage === page
                        ? 'bg-primary-500 text-white'
                        : 'text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-700'
                    )}
                  >
                    {page}
                  </button>
                )
              ))}
            </div>

            {/* Next Page */}
            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={cn(
                'p-1.5 rounded-md transition-colors',
                currentPage === totalPages
                  ? 'text-surface-300 dark:text-surface-600 cursor-not-allowed'
                  : 'text-surface-500 hover:bg-surface-100 dark:hover:bg-surface-700 hover:text-surface-700 dark:hover:text-surface-300'
              )}
              title="Next page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {/* Last Page */}
            <button
              onClick={() => goToPage(totalPages)}
              disabled={currentPage === totalPages}
              className={cn(
                'p-1.5 rounded-md transition-colors',
                currentPage === totalPages
                  ? 'text-surface-300 dark:text-surface-600 cursor-not-allowed'
                  : 'text-surface-500 hover:bg-surface-100 dark:hover:bg-surface-700 hover:text-surface-700 dark:hover:text-surface-300'
              )}
              title="Last page"
            >
              <ChevronsRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}