import React, { useState, useEffect } from 'react';
import { Plus, TrendingUp, TrendingDown, Filter, Download, Trash2 } from 'lucide-react';
import { googleSheetsService } from '../services/dataService';
import { Transaction } from '../types';
import { formatCurrency, formatDate, cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export default function Finance() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTransaction, setNewTransaction] = useState<Partial<Transaction>>({
    type: 'income',
    date: new Date().toISOString().split('T')[0],
    category: 'Geral'
  });

  useEffect(() => {
    loadTransactions();
  }, []);

  async function loadTransactions() {
    setLoading(true);
    const data = await googleSheetsService.fetchData('Financeiro');
    setTransactions(data);
    setLoading(false);
  }

  async function handleAddTransaction(e: React.FormEvent) {
    e.preventDefault();
    const transaction: Transaction = {
      id: Math.random().toString(36).substr(2, 9),
      ...newTransaction as Transaction,
      amount: Number(newTransaction.amount)
    };
    
    await googleSheetsService.appendData('Financeiro', transaction);
    setShowAddModal(false);
    loadTransactions();
    setNewTransaction({
      type: 'income',
      date: new Date().toISOString().split('T')[0],
      category: 'Geral'
    });
  }

  async function handleDeleteTransaction(id: string) {
    await googleSheetsService.deleteData('Financeiro', id);
    loadTransactions();
  }

  function handleExport() {
    if (transactions.length === 0) return;

    // CSV Headers
    const headers = ['Data', 'Tipo', 'Descrição', 'Categoria', 'Valor'];
    
    // Convert transactions to CSV rows
    const rows = transactions.map(t => [
      formatDate(t.date),
      t.type === 'income' ? 'Entrada' : 'Saída',
      `"${t.description.replace(/"/g, '""')}"`,
      t.category,
      t.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })
    ]);

    // Combine headers and rows
    const csvContent = [
      headers.join(';'),
      ...rows.map(row => row.join(';'))
    ].join('\n');

    // Create blob and download
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `financeiro_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((acc, curr) => acc + Number(curr.amount), 0);
  
  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, curr) => acc + Number(curr.amount), 0);

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Financeiro</h1>
          <p className="text-slate-500">Gerencie suas receitas e despesas com facilidade.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 transition-all">
            <Filter size={20} />
          </button>
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-semibold transition-all shadow-lg shadow-indigo-200 dark:shadow-none"
          >
            <Plus size={20} />
            Novo Registro
          </button>
        </div>
      </header>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-emerald-500 p-6 rounded-3xl text-white shadow-lg shadow-emerald-100 dark:shadow-none">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-white/20 rounded-xl">
              <TrendingUp size={24} />
            </div>
            <span className="text-sm font-medium opacity-80">Entradas</span>
          </div>
          <h2 className="text-3xl font-bold">{formatCurrency(totalIncome)}</h2>
        </div>
        <div className="bg-rose-500 p-6 rounded-3xl text-white shadow-lg shadow-rose-100 dark:shadow-none">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-white/20 rounded-xl">
              <TrendingDown size={24} />
            </div>
            <span className="text-sm font-medium opacity-80">Saídas</span>
          </div>
          <h2 className="text-3xl font-bold">{formatCurrency(totalExpense)}</h2>
        </div>
        <div className="bg-indigo-600 p-6 rounded-3xl text-white shadow-lg shadow-indigo-100 dark:shadow-none">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-white/20 rounded-xl">
              <TrendingUp size={24} />
            </div>
            <span className="text-sm font-medium opacity-80">Saldo Total</span>
          </div>
          <h2 className="text-3xl font-bold">{formatCurrency(totalIncome - totalExpense)}</h2>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h3 className="font-semibold">Últimas Transações</h3>
          <button 
            onClick={handleExport}
            className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"
            title="Exportar para CSV"
          >
            <Download size={20} />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 text-xs uppercase tracking-wider">
                <th className="px-6 py-4 font-semibold">Data</th>
                <th className="px-6 py-4 font-semibold">Descrição</th>
                <th className="px-6 py-4 font-semibold">Categoria</th>
                <th className="px-6 py-4 font-semibold">Valor</th>
                <th className="px-6 py-4 font-semibold text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {transactions.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-4 text-sm text-slate-500">{formatDate(t.date)}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-2 h-2 rounded-full",
                        t.type === 'income' ? "bg-emerald-500" : "bg-rose-500"
                      )} />
                      <span className="font-medium">{t.description}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full text-xs font-medium text-slate-600 dark:text-slate-400">
                      {t.category}
                    </span>
                  </td>
                  <td className={cn(
                    "px-6 py-4 font-semibold",
                    t.type === 'income' ? "text-emerald-600" : "text-rose-600"
                  )}>
                    {t.type === 'income' ? '+' : '-'} {formatCurrency(t.amount)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => handleDeleteTransaction(t.id)}
                      className="p-2 text-slate-400 hover:text-rose-500 transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {transactions.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    Nenhuma transação encontrada. Comece adicionando uma!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-xl font-bold">Novo Registro</h3>
              </div>
              <form onSubmit={handleAddTransaction} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl">
                  <button
                    type="button"
                    onClick={() => setNewTransaction({...newTransaction, type: 'income'})}
                    className={cn(
                      "py-2 rounded-xl text-sm font-semibold transition-all",
                      newTransaction.type === 'income' ? "bg-white dark:bg-slate-700 text-emerald-600 shadow-sm" : "text-slate-500"
                    )}
                  >
                    Receita
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewTransaction({...newTransaction, type: 'expense'})}
                    className={cn(
                      "py-2 rounded-xl text-sm font-semibold transition-all",
                      newTransaction.type === 'expense' ? "bg-white dark:bg-slate-700 text-rose-600 shadow-sm" : "text-slate-500"
                    )}
                  >
                    Despesa
                  </button>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-500">Descrição</label>
                  <input
                    required
                    type="text"
                    value={newTransaction.description || ''}
                    onChange={(e) => setNewTransaction({...newTransaction, description: e.target.value})}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Ex: Aluguel, Salário..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-500">Valor</label>
                    <input
                      required
                      type="number"
                      step="0.01"
                      value={newTransaction.amount || ''}
                      onChange={(e) => setNewTransaction({...newTransaction, amount: Number(e.target.value)})}
                      className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="0,00"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-500">Data</label>
                    <input
                      required
                      type="date"
                      value={newTransaction.date || ''}
                      onChange={(e) => setNewTransaction({...newTransaction, date: e.target.value})}
                      className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-500">Categoria</label>
                  <select
                    value={newTransaction.category || 'Geral'}
                    onChange={(e) => setNewTransaction({...newTransaction, category: e.target.value})}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Geral">Geral</option>
                    <option value="Alimentação">Alimentação</option>
                    <option value="Transporte">Transporte</option>
                    <option value="Lazer">Lazer</option>
                    <option value="Saúde">Saúde</option>
                    <option value="Educação">Educação</option>
                  </select>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl font-semibold hover:bg-slate-200 transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-semibold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 dark:shadow-none"
                  >
                    Salvar
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
