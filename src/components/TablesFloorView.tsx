import React, { useState } from 'react';
import { 
  Users, 
  Coffee, 
  Clock, 
  User, 
  Filter, 
  DollarSign,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Plus
} from 'lucide-react';

interface Table {
  id: string;
  number: string;
  status: 'available' | 'occupied' | 'reserved';
  capacity: number;
  currentOrderTotal?: number;
  waiterName?: string;
  shape: 'round' | 'square';
  zone: 'Principal' | 'Terraza' | 'Bar/VIP';
  elapsedMinutes?: number;
  customerName?: string;
}

const MOCK_TABLES: Table[] = [
  { id: 't1', number: '1', status: 'available', capacity: 4, shape: 'square', zone: 'Principal' },
  { id: 't2', number: '2', status: 'occupied', capacity: 2, currentOrderTotal: 345, waiterName: 'Carlos M.', shape: 'round', zone: 'Principal', elapsedMinutes: 45, customerName: 'Familia Perez' },
  { id: 't3', number: '3', status: 'available', capacity: 6, shape: 'square', zone: 'Principal' },
  { id: 't4', number: '4', status: 'reserved', capacity: 4, waiterName: 'Sofía R.', shape: 'square', zone: 'Principal', customerName: 'Mesa de Negocios' },
  { id: 't5', number: '5', status: 'occupied', capacity: 8, currentOrderTotal: 1280, waiterName: 'Carlos M.', shape: 'square', zone: 'Principal', elapsedMinutes: 75, customerName: 'Cumpleaños Pedro' },
  { id: 't6', number: '6', status: 'available', capacity: 2, shape: 'round', zone: 'Principal' },
  
  { id: 't7', number: '10', status: 'available', capacity: 4, shape: 'square', zone: 'Terraza' },
  { id: 't8', number: '11', status: 'occupied', capacity: 4, currentOrderTotal: 620, waiterName: 'Sofía R.', shape: 'round', zone: 'Terraza', elapsedMinutes: 30, customerName: 'Ana Gomez' },
  { id: 't9', number: '12', status: 'occupied', capacity: 6, currentOrderTotal: 490, waiterName: 'Luis P.', shape: 'square', zone: 'Terraza', elapsedMinutes: 15, customerName: 'Marta Soler' },
  { id: 't10', number: '13', status: 'reserved', capacity: 4, waiterName: 'Luis P.', shape: 'round', zone: 'Terraza', customerName: 'Cena Pareja' },
  
  { id: 't11', number: 'B1', status: 'occupied', capacity: 2, currentOrderTotal: 150, waiterName: 'Diana T.', shape: 'round', zone: 'Bar/VIP', elapsedMinutes: 10, customerName: 'Bar C-1' },
  { id: 't12', number: 'B2', status: 'available', capacity: 2, shape: 'round', zone: 'Bar/VIP' },
  { id: 't13', number: 'V1', status: 'reserved', capacity: 10, waiterName: 'Diana T.', shape: 'square', zone: 'Bar/VIP', customerName: 'Reserva Especial VIP' },
];

export default function TablesFloorView() {
  const [selectedZone, setSelectedZone] = useState<'Todas' | 'Principal' | 'Terraza' | 'Bar/VIP'>('Todas');
  const [selectedStatus, setSelectedStatus] = useState<'All' | 'available' | 'occupied' | 'reserved'>('All');
  const [activeTable, setActiveTable] = useState<Table | null>(null);

  // Filter logic
  const filteredTables = MOCK_TABLES.filter(t => {
    const matchesZone = selectedZone === 'Todas' || t.zone === selectedZone;
    const matchesStatus = selectedStatus === 'All' || t.status === selectedStatus;
    return matchesZone && matchesStatus;
  });

  // Calculate statistics
  const totalTables = MOCK_TABLES.length;
  const availableCount = MOCK_TABLES.filter(t => t.status === 'available').length;
  const occupiedCount = MOCK_TABLES.filter(t => t.status === 'occupied').length;
  const reservedCount = MOCK_TABLES.filter(t => t.status === 'reserved').length;

  return (
    <div className="p-6 bg-slate-50 dark:bg-slate-950 min-h-screen text-slate-800 dark:text-slate-100 flex flex-col space-y-6">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <h2 className="text-2xl font-black tracking-tight flex items-center gap-2">
            <Coffee className="w-6 h-6 text-[var(--brand-primary,#6366f1)]" />
            <span>Plano de Mesas y Salón</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Visualiza y gestiona las comandas, estados y distribución táctil de las mesas.
          </p>
        </div>

        {/* Action button */}
        <button
          type="button"
          onClick={() => alert('Próximamente: Integración para agregar mesas y zonas dinámicas')}
          className="px-4 py-2.5 bg-[var(--brand-primary,#6366f1)] hover:bg-[color-mix(in_srgb,var(--brand-primary,#6366f1)_90%,black)] text-white font-extrabold text-xs rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer transition select-none active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Agregar Mesa</span>
        </button>
      </div>

      {/* Summary Statistics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase font-black tracking-wider text-slate-400">Total Mesas</p>
            <h4 className="text-xl font-black mt-1">{totalTables}</h4>
          </div>
          <div className="w-10 h-10 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center font-bold text-slate-500 text-sm">
            📊
          </div>
        </div>

        <button
          onClick={() => setSelectedStatus(selectedStatus === 'available' ? 'All' : 'available')}
          className={`bg-white dark:bg-slate-900 border rounded-2xl p-4 shadow-sm flex items-center justify-between cursor-pointer text-left transition select-none hover:shadow-md ${
            selectedStatus === 'available' ? 'border-[var(--brand-primary,#6366f1)] ring-1 ring-[var(--brand-primary,#6366f1)]' : 'border-slate-200 dark:border-slate-800'
          }`}
        >
          <div>
            <p className="text-[10px] uppercase font-black tracking-wider text-emerald-500">Disponibles</p>
            <h4 className="text-xl font-black mt-1 text-emerald-600 dark:text-emerald-400">{availableCount}</h4>
          </div>
          <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </button>

        <button
          onClick={() => setSelectedStatus(selectedStatus === 'occupied' ? 'All' : 'occupied')}
          className={`bg-white dark:bg-slate-900 border rounded-2xl p-4 shadow-sm flex items-center justify-between cursor-pointer text-left transition select-none hover:shadow-md ${
            selectedStatus === 'occupied' ? 'border-[var(--brand-primary,#6366f1)] ring-1 ring-[var(--brand-primary,#6366f1)]' : 'border-slate-200 dark:border-slate-800'
          }`}
        >
          <div>
            <p className="text-[10px] uppercase font-black tracking-wider text-rose-500">Ocupadas</p>
            <h4 className="text-xl font-black mt-1 text-rose-600 dark:text-rose-400">{occupiedCount}</h4>
          </div>
          <div className="w-10 h-10 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 rounded-xl flex items-center justify-center">
            <Coffee className="w-5 h-5" />
          </div>
        </button>

        <button
          onClick={() => setSelectedStatus(selectedStatus === 'reserved' ? 'All' : 'reserved')}
          className={`bg-white dark:bg-slate-900 border rounded-2xl p-4 shadow-sm flex items-center justify-between cursor-pointer text-left transition select-none hover:shadow-md ${
            selectedStatus === 'reserved' ? 'border-[var(--brand-primary,#6366f1)] ring-1 ring-[var(--brand-primary,#6366f1)]' : 'border-slate-200 dark:border-slate-800'
          }`}
        >
          <div>
            <p className="text-[10px] uppercase font-black tracking-wider text-amber-500">Reservadas</p>
            <h4 className="text-xl font-black mt-1 text-amber-600 dark:text-amber-400">{reservedCount}</h4>
          </div>
          <div className="w-10 h-10 bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 rounded-xl flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </button>
      </div>

      {/* Navigation Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-2xl shadow-sm">
        <div className="flex items-center space-x-1.5 overflow-x-auto max-w-full">
          {(['Todas', 'Principal', 'Terraza', 'Bar/VIP'] as const).map(zone => (
            <button
              key={zone}
              onClick={() => setSelectedZone(zone)}
              className={`px-4 py-2 text-xs font-black rounded-xl transition cursor-pointer select-none border ${
                selectedZone === zone
                  ? 'bg-[var(--brand-primary,#6366f1)] border-[var(--brand-primary,#6366f1)] text-white shadow-sm'
                  : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              {zone}
            </button>
          ))}
        </div>

        {/* Legend Indicator */}
        <div className="flex flex-wrap gap-4 text-[10px] font-black uppercase text-slate-500 tracking-wider">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span>Libre</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
            <span>Ocupada</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span>Reservada</span>
          </div>
        </div>
      </div>

      {/* Main Floor Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Tables Floor Area */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm min-h-[500px]">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-extrabold text-sm text-slate-500 uppercase tracking-wider">
              Distribución: {selectedZone}
            </h3>
            <span className="text-xs bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full font-bold text-slate-500">
              Mostrando {filteredTables.length} mesas
            </span>
          </div>

          {filteredTables.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
              <p className="text-slate-400 dark:text-slate-500 font-bold text-sm">No hay mesas con los filtros activos.</p>
              <button 
                onClick={() => { setSelectedZone('Todas'); setSelectedStatus('All'); }}
                className="text-xs text-[var(--brand-primary,#6366f1)] hover:underline font-extrabold"
              >
                Limpiar Filtros
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
              {filteredTables.map(table => {
                const isSelected = activeTable?.id === table.id;
                
                // Color variations based on status
                let statusClasses = '';
                let statusColor = '';
                if (table.status === 'available') {
                  statusClasses = 'border-emerald-200 dark:border-emerald-950/60 bg-emerald-50/50 dark:bg-emerald-950/10 hover:border-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300';
                  statusColor = 'var(--color-emerald-500)';
                } else if (table.status === 'occupied') {
                  statusClasses = 'border-rose-200 dark:border-rose-950/60 bg-rose-50/50 dark:bg-rose-950/10 hover:border-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-rose-800 dark:text-rose-350';
                  statusColor = 'var(--color-rose-500)';
                } else if (table.status === 'reserved') {
                  statusClasses = 'border-amber-200 dark:border-amber-950/60 bg-amber-50/50 dark:bg-amber-950/10 hover:border-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/20 text-amber-800 dark:text-amber-350';
                  statusColor = 'var(--color-amber-500)';
                }

                return (
                  <button
                    key={table.id}
                    onClick={() => setActiveTable(table)}
                    className={`h-40 rounded-3xl border-2 flex flex-col justify-between p-4.5 cursor-pointer text-left transition duration-200 relative select-none hover:shadow-md active:scale-95 focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary,#6366f1)] focus:ring-offset-2 ${statusClasses} ${
                      isSelected ? 'border-[var(--brand-primary,#6366f1)] hover:border-[var(--brand-primary,#6366f1)] ring-2 ring-[var(--brand-primary,#6366f1)]' : ''
                    }`}
                  >
                    {/* Top Row: Mesa ID / Zone Badge */}
                    <div className="flex justify-between items-center w-full">
                      <span className="text-xs bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 px-2 py-0.5 rounded-lg text-slate-500 font-extrabold shadow-sm">
                        {table.zone}
                      </span>
                      <span 
                        className={`w-2.5 h-2.5 rounded-full ${
                          table.status === 'occupied' ? 'animate-pulse' : ''
                        }`}
                        style={{ backgroundColor: statusColor }}
                      />
                    </div>

                    {/* Middle: Visual representation of Table Shape */}
                    <div className="flex justify-center items-center my-1.5 flex-1 relative">
                      <div 
                        className={`w-16 h-16 flex flex-col items-center justify-center shadow-inner relative transition duration-300 ${
                          table.shape === 'round' ? 'rounded-full' : 'rounded-2xl'
                        } ${
                          table.status === 'occupied' 
                            ? 'bg-rose-100 dark:bg-rose-900/30' 
                            : table.status === 'reserved'
                            ? 'bg-amber-100 dark:bg-amber-900/30'
                            : 'bg-emerald-100 dark:bg-emerald-900/30'
                        }`}
                      >
                        <span className="text-lg font-black">{table.number}</span>
                        {/* Little capacity visual dots on outer layout */}
                        <div className="absolute -top-1 px-1 bg-white dark:bg-slate-900 rounded-full border border-slate-150 dark:border-slate-800 text-[8px] font-black text-slate-500 flex items-center gap-0.5 shadow-sm">
                          <Users className="w-2 h-2" />
                          <span>{table.capacity}</span>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Row: Detail/Total */}
                    <div className="w-full flex justify-between items-end">
                      {table.status === 'occupied' ? (
                        <>
                          <div className="leading-none">
                            <p className="text-[8px] uppercase font-black text-slate-400">Comanda</p>
                            <p className="text-xs font-black text-slate-800 dark:text-slate-100">
                              ${table.currentOrderTotal}
                            </p>
                          </div>
                          <div className="flex items-center gap-0.5 text-slate-400 text-[9px] font-bold">
                            <Clock className="w-2.5 h-2.5" />
                            <span>{table.elapsedMinutes}m</span>
                          </div>
                        </>
                      ) : table.status === 'reserved' ? (
                        <div className="truncate pr-1">
                          <p className="text-[8px] uppercase font-black text-slate-400">Reserva</p>
                          <p className="text-[10px] font-extrabold truncate text-amber-700 dark:text-amber-400">
                            {table.customerName || 'Pendiente'}
                          </p>
                        </div>
                      ) : (
                        <span className="text-[9px] font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">
                          Disponible
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Selected Table Drawer/Details Sidepanel */}
        <div className="lg:col-span-4 flex flex-col space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm min-h-[500px] flex flex-col justify-between">
            {activeTable ? (
              <div className="flex-1 flex flex-col justify-between">
                
                {/* Upper Details block */}
                <div className="space-y-5">
                  <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div>
                      <h4 className="text-base font-black tracking-tight flex items-center gap-1.5">
                        <span>Mesa {activeTable.number}</span>
                        <span className="text-[10px] font-extrabold px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-500">
                          {activeTable.zone}
                        </span>
                      </h4>
                      <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">Detalle Operativo</p>
                    </div>
                    <button 
                      onClick={() => setActiveTable(null)}
                      className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-extrabold text-sm"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Status Indicator Panel */}
                  <div 
                    className="p-3.5 rounded-2xl flex items-center gap-3 border shadow-inner"
                    style={{
                      backgroundColor: activeTable.status === 'occupied' 
                        ? 'color-mix(in srgb, var(--brand-accent, #a855f7) 6%, white)'
                        : activeTable.status === 'reserved'
                        ? 'bg-amber-50/50'
                        : 'color-mix(in srgb, var(--brand-primary, #6366f1) 6%, white)',
                      borderColor: activeTable.status === 'occupied'
                        ? 'color-mix(in srgb, var(--brand-accent, #a855f7) 12%, transparent)'
                        : activeTable.status === 'reserved'
                        ? 'var(--color-amber-100)'
                        : 'color-mix(in srgb, var(--brand-primary, #6366f1) 12%, transparent)'
                    }}
                  >
                    <span className="text-2xl">
                      {activeTable.status === 'occupied' ? '🍽️' : activeTable.status === 'reserved' ? '📅' : '🟢'}
                    </span>
                    <div>
                      <h5 className="text-xs font-black uppercase tracking-wide">
                        {activeTable.status === 'occupied' ? 'Mesa Ocupada' : activeTable.status === 'reserved' ? 'Mesa Reservada' : 'Disponible / Libre'}
                      </h5>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">
                        Capacidad de comensales: {activeTable.capacity} personas
                      </p>
                    </div>
                  </div>

                  {/* Table details lists */}
                  <div className="space-y-3.5">
                    {activeTable.customerName && (
                      <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-150 dark:border-slate-800">
                        <span className="text-[8px] font-black uppercase text-slate-400 block tracking-wider">Cliente</span>
                        <span className="text-xs font-extrabold text-slate-700 dark:text-slate-200 mt-0.5 block">{activeTable.customerName}</span>
                      </div>
                    )}

                    {activeTable.waiterName && (
                      <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-150 dark:border-slate-800 flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-[var(--brand-primary,#6366f1)]/10 text-[var(--brand-primary,#6366f1)] flex items-center justify-center">
                          <User className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-[8px] font-black uppercase text-slate-400 block tracking-wider">Mesero Asignado</span>
                          <span className="text-xs font-extrabold text-slate-700 dark:text-slate-200">{activeTable.waiterName}</span>
                        </div>
                      </div>
                    )}

                    {activeTable.status === 'occupied' && (
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-150 dark:border-slate-800">
                          <span className="text-[8px] font-black uppercase text-slate-400 block tracking-wider">Monto Cuenta</span>
                          <span className="text-sm font-black text-rose-600 dark:text-rose-400 mt-0.5 block">${activeTable.currentOrderTotal}</span>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-150 dark:border-slate-800">
                          <span className="text-[8px] font-black uppercase text-slate-400 block tracking-wider">Tiempo Transcurrido</span>
                          <span className="text-sm font-bold text-slate-700 dark:text-slate-200 mt-0.5 block flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 inline text-slate-400" />
                            {activeTable.elapsedMinutes} min
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Mock Active items in current order */}
                  {activeTable.status === 'occupied' && (
                    <div className="space-y-2 mt-4">
                      <span className="text-[8px] font-black uppercase text-slate-400 tracking-wider">Artículos Consumidos (Pre-Comanda)</span>
                      <div className="border border-slate-150 dark:border-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                        <div className="p-2.5 flex justify-between bg-slate-50/50 dark:bg-slate-800/20">
                          <span className="font-semibold">2x Pizza Especial Napolitana</span>
                          <span className="font-extrabold text-slate-650 dark:text-slate-300">$640</span>
                        </div>
                        <div className="p-2.5 flex justify-between bg-slate-50/50 dark:bg-slate-800/20">
                          <span className="font-semibold">1x Pasta Alfredo con Pollo</span>
                          <span className="font-extrabold text-slate-650 dark:text-slate-300">$280</span>
                        </div>
                        <div className="p-2.5 flex justify-between bg-slate-50/50 dark:bg-slate-800/20">
                          <span className="font-semibold">4x Cervezas Premium Importadas</span>
                          <span className="font-extrabold text-slate-650 dark:text-slate-300">$360</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Bottom Action buttons */}
                <div className="space-y-2.5 pt-5 border-t border-slate-100 dark:border-slate-800 mt-5">
                  {activeTable.status === 'available' ? (
                    <button
                      type="button"
                      onClick={() => {
                        alert(`Abriendo Comanda para Mesa ${activeTable.number}`);
                        setActiveTable(prev => prev ? { ...prev, status: 'occupied', currentOrderTotal: 0, waiterName: 'Carlos M.' } : null);
                      }}
                      className="w-full py-3 bg-[var(--brand-primary,#6366f1)] hover:bg-[color-mix(in_srgb,var(--brand-primary,#6366f1)_90%,black)] active:scale-98 text-white font-extrabold text-xs rounded-xl shadow transition cursor-pointer text-center uppercase tracking-wider"
                    >
                      Apertura de Mesa 🍽️
                    </button>
                  ) : activeTable.status === 'occupied' ? (
                    <div className="flex gap-2.5">
                      <button
                        type="button"
                        onClick={() => alert('Abriendo Catálogo para adicionar platillos...')}
                        className="flex-1 py-3 bg-slate-800 hover:bg-slate-900 active:scale-98 text-white font-extrabold text-xs rounded-xl transition cursor-pointer text-center"
                      >
                        + Adicionar
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          alert(`Mesa ${activeTable.number} liberada (Venta completada de $${activeTable.currentOrderTotal})`);
                          setActiveTable(prev => prev ? { ...prev, status: 'available', currentOrderTotal: undefined, waiterName: undefined, customerName: undefined } : null);
                        }}
                        className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-extrabold text-xs rounded-xl shadow transition cursor-pointer text-center"
                      >
                        Cobrar Mesa 💰
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        alert(`Mesa ${activeTable.number} ocupada por llegada de reserva`);
                        setActiveTable(prev => prev ? { ...prev, status: 'occupied', currentOrderTotal: 0, waiterName: 'Luis P.' } : null);
                      }}
                      className="w-full py-3 bg-amber-600 hover:bg-amber-700 active:scale-98 text-white font-extrabold text-xs rounded-xl shadow transition cursor-pointer text-center uppercase tracking-wider"
                    >
                      Registrar Entrada de Reserva
                    </button>
                  )}

                  {activeTable.status !== 'available' && (
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`¿Estás seguro de liberar y limpiar la Mesa ${activeTable.number}?`)) {
                          setActiveTable(prev => prev ? { ...prev, status: 'available', currentOrderTotal: undefined, waiterName: undefined, customerName: undefined } : null);
                        }
                      }}
                      className="w-full py-2.5 bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-600 font-extrabold text-[10px] uppercase rounded-xl transition cursor-pointer text-center tracking-wide"
                    >
                      Liberar sin Cobro / Cancelar
                    </button>
                  )}
                </div>

              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-400 py-10">
                <HelpCircle className="w-10 h-10 mb-2 stroke-1" />
                <h5 className="font-extrabold text-xs uppercase tracking-wider text-slate-500">Mesa no seleccionada</h5>
                <p className="text-[10px] text-slate-400 mt-1 max-w-[200px] mx-auto leading-relaxed">
                  Toca cualquier mesa del plano para gestionar comanda, tiempo, mesero asignado o realizar cobros rápidos.
                </p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
