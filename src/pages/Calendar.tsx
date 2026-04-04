import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, CheckCircle2, Wallet, Clock } from 'lucide-react';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  isSameMonth, 
  isSameDay, 
  addDays, 
  eachDayOfInterval 
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn, formatCurrency } from '../lib/utils';
import { googleSheetsService } from '../services/dataService';
import { motion, AnimatePresence } from 'motion/react';

export default function Calendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadEvents() {
      setLoading(true);
      const [tasks, finance] = await Promise.all([
        googleSheetsService.fetchData('Tarefas'),
        googleSheetsService.fetchData('Financeiro')
      ]);
      
      const taskEvents = tasks.map((t: any) => ({
        id: t.id,
        title: t.title,
        description: t.description,
        date: new Date(t.date),
        type: 'task',
        status: t.status
      }));

      const financeEvents = finance.map((f: any) => ({
        id: f.id,
        title: f.description,
        amount: f.amount,
        date: new Date(f.date),
        type: 'finance',
        financeType: f.type
      }));

      setEvents([...taskEvents, ...financeEvents]);
      setLoading(false);
    }
    loadEvents();
  }, []);

  const selectedDateEvents = events.filter(event => isSameDay(event.date, selectedDate));

  const renderHeader = () => {
    return (
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold capitalize text-slate-900 dark:text-white">
            {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
          </h1>
          <p className="text-slate-500 dark:text-slate-400">Gerencie seus compromissos e finanças no tempo.</p>
        </div>
        <div className="flex items-center gap-3 bg-white dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <button 
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all text-slate-600 dark:text-slate-400"
          >
            <ChevronLeft size={20} />
          </button>
          <button 
            onClick={() => {
              setCurrentMonth(new Date());
              setSelectedDate(new Date());
            }}
            className="px-4 py-2 text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl transition-all"
          >
            Hoje
          </button>
          <button 
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all text-slate-600 dark:text-slate-400"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
    );
  };

  const renderDays = () => {
    const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    return (
      <div className="grid grid-cols-7 mb-4">
        {days.map(day => (
          <div key={day} className="text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
            {day}
          </div>
        ))}
      </div>
    );
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const calendarDays = eachDayOfInterval({
      start: startDate,
      end: endDate,
    });

    return (
      <div className="grid grid-cols-7 gap-2">
        {calendarDays.map((day, i) => {
          const dayEvents = events.filter(event => isSameDay(event.date, day));
          const isSelected = isSameDay(day, selectedDate);
          const isToday = isSameDay(day, new Date());
          const isCurrentMonth = isSameMonth(day, monthStart);
          
          return (
            <motion.button
              whileHover={{ scale: 0.98 }}
              whileTap={{ scale: 0.95 }}
              key={i}
              onClick={() => setSelectedDate(day)}
              className={cn(
                "relative min-h-[100px] md:min-h-[120px] p-2 rounded-3xl border transition-all text-left flex flex-col group",
                isSelected 
                  ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-none z-10" 
                  : cn(
                      "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-900",
                      !isCurrentMonth && "opacity-40"
                    )
              )}
            >
              <div className="flex justify-between items-center mb-2">
                <span className={cn(
                  "text-sm font-bold w-7 h-7 flex items-center justify-center rounded-xl",
                  isToday && !isSelected && "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400",
                  isSelected && "bg-white/20"
                )}>
                  {format(day, 'd')}
                </span>
                {dayEvents.length > 0 && !isSelected && (
                  <div className="flex -space-x-1">
                    {Array.from(new Set(dayEvents.map(e => e.type))).map(type => (
                      <div 
                        key={type}
                        className={cn(
                          "w-1.5 h-1.5 rounded-full border border-white dark:border-slate-900",
                          type === 'task' ? "bg-amber-500" : "bg-emerald-500"
                        )}
                      />
                    ))}
                  </div>
                )}
              </div>

              <div className="flex-1 space-y-1 overflow-hidden">
                {dayEvents.slice(0, 2).map(event => (
                  <div 
                    key={event.id}
                    className={cn(
                      "text-[9px] px-2 py-1 rounded-lg truncate font-bold",
                      isSelected 
                        ? "bg-white/20 text-white" 
                        : event.type === 'task' 
                          ? "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400" 
                          : "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400"
                    )}
                  >
                    {event.title}
                  </div>
                ))}
                {dayEvents.length > 2 && (
                  <div className={cn(
                    "text-[8px] font-black text-center uppercase tracking-wider mt-1",
                    isSelected ? "text-white/60" : "text-slate-400"
                  )}>
                    + {dayEvents.length - 2} itens
                  </div>
                )}
              </div>
            </motion.button>
          );
        })}
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
      <div className="lg:col-span-3 space-y-4">
        {renderHeader()}
        <div className="bg-slate-50 dark:bg-slate-950 p-4 md:p-6 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-inner">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentMonth.toString()}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {renderDays()}
              {renderCells()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Side Panel: Day Details */}
      <div className="lg:col-span-1">
        <div className="sticky top-8 space-y-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {format(selectedDate, "EEEE, d 'de' MMMM", { locale: ptBR })}
              </h2>
              <p className="text-sm text-slate-500">Eventos para este dia</p>
            </div>

            <div className="space-y-4">
              {selectedDateEvents.length > 0 ? (
                selectedDateEvents.map(event => (
                  <div 
                    key={event.id}
                    className="flex gap-4 p-4 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800"
                  >
                    <div className={cn(
                      "w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0",
                      event.type === 'task' 
                        ? "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400" 
                        : "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
                    )}>
                      {event.type === 'task' ? <CheckCircle2 size={20} /> : <Wallet size={20} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm truncate">{event.title}</p>
                      {event.type === 'finance' ? (
                        <p className={cn(
                          "text-xs font-black mt-1",
                          event.financeType === 'income' ? "text-emerald-600" : "text-rose-600"
                        )}>
                          {event.financeType === 'income' ? '+' : '-'} {formatCurrency(event.amount)}
                        </p>
                      ) : (
                        <p className="text-xs text-slate-500 mt-1 line-clamp-1">{event.description || 'Sem descrição'}</p>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                    <Clock size={32} />
                  </div>
                  <p className="text-slate-400 text-sm">Nenhum evento agendado para este dia.</p>
                </div>
              )}
            </div>

            <button className="w-full mt-6 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-100 dark:shadow-none">
              <Plus size={20} />
              Novo Evento
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
