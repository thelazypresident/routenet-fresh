import React, { useState } from 'react';
import { Download, FileSpreadsheet, FileText, ArrowLeft } from 'lucide-react';
import { useApp } from '../components/contexts/AppContext';

import { useQuery } from '@tanstack/react-query';
import { getLocalTransactions } from '@/database/transactionRepository';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import DatePicker from '../components/ui/DatePicker';
import { formatMoney, formatDate as formatDateUtil } from '../components/utils/formatters';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function ExportsData() {
  const { theme, user, formatPrefs } = useApp();
  const isDark = theme === 'dark';
  
  const [dateRange, setDateRange] = useState({
    start: '',
    end: ''
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ['transactions', user?.email],
    queryFn: () => getLocalTransactions(),
    enabled: true
  });

  const exportToExcel = () => {
    const filtered = filterTransactions();
    
    const totalIncome = filtered.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const totalExpenses = filtered.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const netIncome = totalIncome - totalExpenses;
    
    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'Date,Type,Category,Amount,Description,Platform\n';
    
    filtered.forEach(t => {
      csvContent += `${formatDateUtil(t.date, formatPrefs)},${t.type},${getCategoryLabel(t)},${formatCurrencyExport(t.amount)},"${t.description || ''}","${t.platform || ''}"\n`;
    });
    
    csvContent += '\n';
    csvContent += `Total Income,,,${formatCurrencyExport(totalIncome)}\n`;
    csvContent += `Total Expenses,,,${formatCurrencyExport(totalExpenses)}\n`;
    csvContent += `Net Income,,,${formatCurrencyExport(netIncome)}\n`;
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `transactions_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('Transactions exported');
  };

  const exportToGoogleSheets = () => {
    const filtered = filterTransactions();
    
    const totalIncome = filtered.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const totalExpenses = filtered.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const netIncome = totalIncome - totalExpenses;
    
    let csvContent = 'Date,Type,Category,Amount,Description,Platform\n';
    filtered.forEach(t => {
      csvContent += `${formatDateUtil(t.date, formatPrefs)},${t.type},${getCategoryLabel(t)},${formatCurrencyExport(t.amount)},"${t.description || ''}","${t.platform || ''}"\n`;
    });
    csvContent += '\n';
    csvContent += `Total Income,,,${formatCurrencyExport(totalIncome)}\n`;
    csvContent += `Total Expenses,,,${formatCurrencyExport(totalExpenses)}\n`;
    csvContent += `Net Income,,,${formatCurrencyExport(netIncome)}\n`;
    
    window.open(`https://docs.google.com/spreadsheets/d/create?usp=drive_web`, '_blank');
    
    toast.success('Opening Google Sheets - paste the exported data there');
  };

  const filterTransactions = () => {
    let filtered = transactions;
    
    if (dateRange.start) {
      filtered = filtered.filter(t => t.date >= dateRange.start);
    }
    if (dateRange.end) {
      filtered = filtered.filter(t => t.date <= dateRange.end);
    }
    
    return filtered;
  };

  const canExport = dateRange.start && dateRange.end;

  const guardExport = (fn) => {
    if (!canExport) return;
    fn();
  };

  const formatCurrencyExport = (amount) => {
    return formatMoney(amount, formatPrefs);
  };

  const getCategoryLabel = (transaction) => {
    const incomeLabels = {
      gross_income: 'Driver Earnings / Payout',
      tip: 'Tip',
      other: 'Other Income'
    };
    const expenseLabels = {
      fuel: 'Fuel',
      food: 'Food',
      load: 'Load',
      topup: 'Top-Up',
      maintenance: 'Maintenance',
      other: 'Others'
    };
    
    if (transaction.type === 'income') {
      return incomeLabels[transaction.category] || transaction.category;
    }
    return expenseLabels[transaction.category] || transaction.category;
  };

  const exportToPDF = () => {
    const parseLocalYMD = (ymd) => {
      if (!ymd) return null;
      const [y, m, d] = ymd.split('-').map(Number);
      return new Date(y, m - 1, d);
    };
    
    const filtered = filterTransactions().sort((a, b) => new Date(b.date) - new Date(a.date));
    
    const incomeTransactions = filtered.filter(t => t.type === 'income');
    const expenseTransactions = filtered.filter(t => t.type === 'expense');
    
    const totalIncome = incomeTransactions.reduce((sum, t) => sum + t.amount, 0);
    const totalExpenses = expenseTransactions.reduce((sum, t) => sum + t.amount, 0);
    const netIncome = totalIncome - totalExpenses;
    
    const incomeByCategory = {};
    incomeTransactions.forEach(t => {
      const label = getCategoryLabel(t);
      incomeByCategory[label] = (incomeByCategory[label] || 0) + t.amount;
    });
    
    const expenseByCategory = {};
    expenseTransactions.forEach(t => {
      const label = getCategoryLabel(t);
      expenseByCategory[label] = (expenseByCategory[label] || 0) + t.amount;
    });
    
    let dateRangeText = 'All Transactions';
    if (dateRange.start && dateRange.end) {
      if (dateRange.start === dateRange.end) {
        dateRangeText = format(parseLocalYMD(dateRange.start), 'MMM dd, yyyy');
      } else {
        dateRangeText = `${format(parseLocalYMD(dateRange.start), 'MMM dd, yyyy')} – ${format(parseLocalYMD(dateRange.end), 'MMM dd, yyyy')}`;
      }
    } else if (dateRange.start) {
      dateRangeText = `From ${format(parseLocalYMD(dateRange.start), 'MMM dd, yyyy')}`;
    } else if (dateRange.end) {
      dateRangeText = `Until ${format(parseLocalYMD(dateRange.end), 'MMM dd, yyyy')}`;
    }
    
    const generatedDate = format(new Date(), 'MMM dd, yyyy h:mm a');
    
    const userName = user?.full_name || '—';
    const userVehicle = user?.vehicle_type === 'other' 
      ? (user?.vehicle_type_other || '—') 
      : (user?.vehicle_type ? user.vehicle_type.charAt(0).toUpperCase() + user.vehicle_type.slice(1) : '—');
    const userPlatforms = user?.platforms_used?.length > 0 ? user.platforms_used.join(', ') : '—';
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>RouteNet - Transaction Report</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Arial, sans-serif; color: #1a1a1a; padding: 40px; line-height: 1.5; }
          .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #66BB6A; padding-bottom: 15px; }
          .header-logo { width: 100px; height: auto; margin: 0 auto 15px; display: block; }
          .header h1 { font-size: 24px; color: #1a1a1a; margin-bottom: 8px; }
          .header .date-range { font-size: 14px; color: #555; margin-bottom: 4px; }
          .header .generated { font-size: 12px; color: #888; }
          .user-info { margin-bottom: 25px; padding: 15px; background: #f9f9f9; border-radius: 8px; }
          .user-info-line { font-size: 13px; color: #444; margin-bottom: 4px; }
          .user-info-line:last-child { margin-bottom: 0; }
          .user-info-label { font-weight: 600; color: #333; }
          .section { margin-bottom: 25px; }
          .section-title { font-size: 16px; font-weight: 600; color: #333; margin-bottom: 12px; padding-bottom: 6px; border-bottom: 1px solid #ddd; }
          .summary-grid { display: flex; justify-content: space-between; gap: 20px; margin-bottom: 25px; }
          .summary-card { flex: 1; padding: 15px; border-radius: 8px; text-align: center; }
          .summary-card.income { background: #42A5F5; border: 1px solid #1E88E5; }
          .summary-card.expense { background: #ffebee; border: 1px solid #ef9a9a; }
          .summary-card.net { background: #66BB6A; border: 1px solid #4CAF50; }
          .summary-card .label { font-size: 12px; margin-bottom: 4px; }
          .summary-card.income .label { color: rgba(255,255,255,0.9); }
          .summary-card.expense .label { color: #666; }
          .summary-card.net .label { color: rgba(255,255,255,0.9); }
          .summary-card .amount { font-size: 18px; font-weight: 700; }
          .summary-card.income .amount { color: #fff; }
          .summary-card.expense .amount { color: #c62828; }
          .summary-card.net .amount { color: #fff; }
          .breakdown-list { margin-bottom: 20px; }
          .breakdown-item { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
          .breakdown-item:last-child { border-bottom: none; }
          .breakdown-item .category { color: #333; }
          .breakdown-item .amount { font-weight: 600; }
          .breakdown-item .amount.income { color: #2e7d32; }
          .breakdown-item .amount.expense { color: #c62828; }
          table { width: 100%; border-collapse: collapse; font-size: 12px; }
          th { background: #f5f5f5; padding: 10px 8px; text-align: left; font-weight: 600; border-bottom: 2px solid #ddd; }
          th.amount-col { text-align: right; }
          td { padding: 8px; border-bottom: 1px solid #eee; }
          td.amount { text-align: right; font-weight: 500; }
          td.amount.income { color: #2e7d32; }
          td.amount.expense { color: #c62828; }
          .no-data { text-align: center; color: #888; padding: 20px; font-style: italic; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/691eb67221759ebcd9ac9b90/a10b55a24_LOGO.jpeg" alt="RouteNet Logo" class="header-logo" />
          <h1>RouteNet – Transaction Report</h1>
          <div class="date-range">Date Range: ${dateRangeText}</div>
          <div class="generated">Generated on: ${generatedDate}</div>
        </div>
        
        <div class="user-info">
          <div class="user-info-line"><span class="user-info-label">Name:</span> ${userName}</div>
          <div class="user-info-line"><span class="user-info-label">Transportation:</span> ${userVehicle}</div>
          <div class="user-info-line"><span class="user-info-label">Platform(s):</span> ${userPlatforms}</div>
        </div>
        
        <div class="summary-grid">
          <div class="summary-card income">
            <div class="label">Gross Income</div>
            <div class="amount">${formatCurrencyExport(totalIncome)}</div>
          </div>
          <div class="summary-card expense">
            <div class="label">Total Expenses</div>
            <div class="amount">${formatCurrencyExport(totalExpenses)}</div>
          </div>
          <div class="summary-card net">
            <div class="label">Net Income</div>
            <div class="amount">${formatCurrencyExport(netIncome)}</div>
          </div>
        </div>
        
        <div class="section">
          <div class="section-title">Itemized Income Breakdown</div>
          <div class="breakdown-list">
            ${Object.keys(incomeByCategory).length > 0 
              ? Object.entries(incomeByCategory).map(([cat, amt]) => `
                <div class="breakdown-item">
                  <span class="category">${cat}</span>
                  <span class="amount income">${formatCurrencyExport(amt)}</span>
                </div>
              `).join('')
              : '<div class="no-data">No income transactions</div>'
            }
          </div>
        </div>
        
        <div class="section">
          <div class="section-title">Itemized Expense Breakdown</div>
          <div class="breakdown-list">
            ${Object.keys(expenseByCategory).length > 0 
              ? Object.entries(expenseByCategory).map(([cat, amt]) => `
                <div class="breakdown-item">
                  <span class="category">${cat}</span>
                  <span class="amount expense">${formatCurrencyExport(amt)}</span>
                </div>
              `).join('')
              : '<div class="no-data">No expense transactions</div>'
            }
          </div>
        </div>
        
        <div class="section">
          <div class="section-title">Detailed Transactions</div>
          ${filtered.length > 0 ? `
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Category</th>
                  <th>Platform</th>
                  <th>Notes</th>
                  <th class="amount-col">Amount (PHP)</th>
                </tr>
              </thead>
              <tbody>
                ${filtered.map(t => `
                  <tr>
                    <td>${format(parseLocalYMD(t.date), 'MMM dd, yyyy')}</td>
                    <td>${t.type === 'income' ? 'Income' : 'Expense'}</td>
                    <td>${getCategoryLabel(t)}</td>
                    <td>${t.platform || ''}</td>
                    <td>${t.description || ''}</td>
                    <td class="amount ${t.type}">${formatCurrencyExport(t.amount)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          ` : '<div class="no-data">No transactions found</div>'}
        </div>
      </body>
      </html>
    `;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.print();
    };
    
    toast.success('PDF export ready - use Print to save as PDF');
  };

  return (
    <div className={`min-h-screen pb-24 ${
      isDark 
        ? 'bg-gradient-to-br from-[#000000] via-[#0a1a0a] to-[#001a0a]' 
        : 'bg-gradient-to-br from-[#f0f9f0] via-white to-[#e8f5e9]'
    }`}>
      <div className="max-w-2xl mx-auto px-5 py-8 space-y-6">
        <div>
          <Label className="mb-2 block">Date Range</Label>
          <p className={`text-xs mb-4 ${isDark ? 'text-white/50' : 'text-gray-500'}`}>
            Select a date range to export specific transactions
          </p>
          <div className="space-y-3">
            <div>
              <Label className={`text-xs mb-1 block ${isDark ? 'text-white/70' : 'text-gray-600'}`}>Start Date</Label>
              <DatePicker
                value={dateRange.start}
                onChange={(value) => setDateRange(prev => ({ ...prev, start: value }))}
                placeholder="Select start date"
              />
            </div>
            <div>
              <Label className={`text-xs mb-1 block ${isDark ? 'text-white/70' : 'text-gray-600'}`}>End Date</Label>
              <DatePicker
                value={dateRange.end}
                onChange={(value) => setDateRange(prev => ({ ...prev, end: value }))}
                placeholder="Select end date"
              />
            </div>
          </div>
        </div>
        
        {!canExport && (
          <div className={`p-4 rounded-lg border ${isDark ? 'bg-red-500/10 border-red-500/30' : 'bg-red-50 border-red-200'}`}>
            <p className={`text-sm font-semibold mb-1 ${isDark ? 'text-red-400' : 'text-red-700'}`}>
              Select a date range first
            </p>
            <p className={`text-xs ${isDark ? 'text-red-400/80' : 'text-red-600'}`}>
              Please choose both Start Date and End Date to enable export.
            </p>
          </div>
        )}

        <div className={`p-4 rounded-lg ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
          <p className={`text-sm mb-2 ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
            Export will include:
          </p>
          <ul className={`text-sm space-y-1 ${isDark ? 'text-white/60' : 'text-gray-500'}`}>
            <li>• Transactions from selected date range</li>
            <li>• Total income & expenses</li>
            <li>• Net income calculation</li>
            <li>• Date range summary</li>
          </ul>
        </div>
        
        <div className="space-y-3">
          <Button 
            onClick={() => guardExport(exportToExcel)}
            disabled={!canExport}
            className="w-full bg-gradient-to-r from-[#66BB6A] via-[#A5D6A7] to-[#FACC15] hover:opacity-90 text-black font-bold py-4 rounded-full shadow-2xl disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <FileSpreadsheet className="w-5 h-5 mr-2" />
            Export as Excel (.csv)
          </Button>
          
          <Button 
            onClick={() => guardExport(exportToPDF)}
            disabled={!canExport}
            className="w-full bg-gradient-to-r from-[#66BB6A] via-[#A5D6A7] to-[#FACC15] hover:opacity-90 text-black font-bold py-4 rounded-full shadow-2xl disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <FileText className="w-5 h-5 mr-2" />
            Export as PDF
          </Button>
          
          <Button 
            onClick={() => guardExport(exportToGoogleSheets)}
            disabled={!canExport}
            variant="outline"
            className={`w-full py-4 rounded-full ${isDark ? 'border-[#66BB6A]/30 hover:bg-[#66BB6A]/10' : ''} disabled:opacity-40 disabled:cursor-not-allowed`}
          >
            <Download className="w-5 h-5 mr-2" />
            Open in Google Sheets
          </Button>
        </div>
      </div>
    </div>
  );
}