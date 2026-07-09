import React, { useState, useMemo } from 'react';
import { 
  LogOut, 
  Building2, 
  Users, 
  Check, 
  MapPin, 
  Utensils, 
  Clock, 
  Plus, 
  Minus, 
  Trash2, 
  Search, 
  ChevronRight, 
  Sparkles,
  DollarSign
} from 'lucide-react';
import { doc, updateDoc, setDoc, writeBatch } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';

// Interfaces mirroring the main types
interface Product {
  id: string;
  name: string;
  category: string;
  costPrice: number;
  salePrice: number;
  stock: number;
  printDestination?: 'cocina' | 'barra' | 'ninguno';
}

interface Branch {
  id: string;
  name: string;
}

interface Table {
  id: string;
  name: string;
  branchId: string;
  capacity?: number;
  status: 'libre' | 'ocupada' | 'por_cobrar';
  currentOrderId?: string;
}

interface OrderItem {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  destination: 'cocina' | 'barra' | 'ninguno';
  round: number;
  sentAt?: string;
}

interface Order {
  id: string;
  tableId: string;
  branchId: string;
  status: 'open' | 'closed';
  waiterId: string;
  waiterName: string;
  openedAt: string;
  items: OrderItem[];
  closedAt?: string;
  saleId?: string;
}

interface WaiterShellProps {
  user: any;
  companyName: string;
  currentUserMember: any;
  products: Product[];
  branches: Branch[];
  tables: Table[];
  orders: Order[];
  selectedBranchId: string;
  branding: any;
  onLogout: () => void;
  userAvailableCompanies?: any;
  onSwitchCompany?: (companyId: string) => void;
  onLeaveCompany?: () => void;
}

const formatMXN = (val: number): string => {
  if (isNaN(val) || val === undefined || val === null) return '$0.00 MXN';
  return `$${val.toFixed(2)} MXN`;
};

export default function WaiterShell({
  user,
  companyName,
  currentUserMember,
  products,
  branches,
  tables,
  orders,
  selectedBranchId,
  branding,
  onLogout,
  userAvailableCompanies = {},
  onSwitchCompany,
  onLeaveCompany
}: WaiterShellProps) {
  const [activeTab, setActiveTab] = useState<'tables' | 'my-orders'>('tables');
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  
  // Product search & category states inside the table details view
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');

  // Filter tables to only show the ones belonging to the selected branch
  const filteredTables = useMemo(() => {
    return tables.filter(t => t.branchId === selectedBranchId);
  }, [tables, selectedBranchId]);

  // Find active order for each table
  const activeOrdersMap = useMemo(() => {
    const map = new Map<string, Order>();
    orders.forEach(o => {
      if (o.status === 'open' && o.branchId === selectedBranchId) {
        map.set(o.tableId, o);
      }
    });
    return map;
  }, [orders, selectedBranchId]);

  // Get current active order for the selected table
  const currentActiveOrder = useMemo(() => {
    if (!selectedTable) return null;
    return activeOrdersMap.get(selectedTable.id) || null;
  }, [selectedTable, activeOrdersMap]);

  // Waiter's own open orders
  const myOpenOrders = useMemo(() => {
    return orders.filter(o => o.status === 'open' && o.waiterId === user.uid && o.branchId === selectedBranchId);
  }, [orders, user.uid, selectedBranchId]);

  // List of all unique product categories
  const categories = useMemo(() => {
    const cats = new Set<string>();
    products.forEach(p => p.category && cats.add(p.category));
    return ['Todos', ...Array.from(cats)];
  }, [products]);

  // Filter products based on search term and category
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCat = selectedCategory === 'Todos' || p.category === selectedCategory;
      return matchesSearch && matchesCat;
    });
  }, [products, searchTerm, selectedCategory]);

  const activeCompanyId = currentUserMember?.companyId || localStorage.getItem(`logic_active_company_${user.uid}`);

  // Create a new order and set table status to occupied
  const handleOpenTable = async (table: Table) => {
    if (!activeCompanyId) return;
    const orderId = 'ord_' + Math.floor(Math.random() * 900000 + 100000);
    const newOrder: Order = {
      id: orderId,
      tableId: table.id,
      branchId: selectedBranchId,
      status: 'open',
      waiterId: user.uid,
      waiterName: currentUserMember?.name || 'Mesero',
      openedAt: new Date().toISOString(),
      items: []
    };

    try {
      const batch = writeBatch(db);
      batch.set(doc(db, 'companies', activeCompanyId, 'orders', orderId), newOrder);
      batch.update(doc(db, 'companies', activeCompanyId, 'tables', table.id), {
        status: 'ocupada',
        currentOrderId: orderId
      });
      await batch.commit();
      
      // Update local selection to reflect state changes
      setSelectedTable({
        ...table,
        status: 'ocupada',
        currentOrderId: orderId
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `companies/${activeCompanyId}/orders/${orderId}`);
    }
  };

  // Change table status directly
  const handleUpdateTableStatus = async (table: Table, newStatus: 'libre' | 'ocupada' | 'por_cobrar') => {
    if (!activeCompanyId) return;
    try {
      await updateDoc(doc(db, 'companies', activeCompanyId, 'tables', table.id), {
        status: newStatus
      });
      setSelectedTable(prev => prev ? { ...prev, status: newStatus } : null);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `companies/${activeCompanyId}/tables/${table.id}`);
    }
  };

  // Close active order and release the table
  const handleReleaseTable = async (table: Table) => {
    if (!activeCompanyId) return;
    const order = activeOrdersMap.get(table.id);
    if (!order) return;

    const confirmRelease = window.confirm(`¿Estás seguro de liberar la ${table.name}? Se cerrará la comanda activa.`);
    if (!confirmRelease) return;

    try {
      const batch = writeBatch(db);
      batch.update(doc(db, 'companies', activeCompanyId, 'orders', order.id), {
        status: 'closed',
        closedAt: new Date().toISOString()
      });
      batch.update(doc(db, 'companies', activeCompanyId, 'tables', table.id), {
        status: 'libre',
        currentOrderId: null
      });
      await batch.commit();
      
      setSelectedTable(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `companies/${activeCompanyId}/orders/${order.id}`);
    }
  };

  // Add an item to the current order
  const handleAddItemToOrder = async (order: Order, product: Product) => {
    if (!activeCompanyId) return;
    
    // Check if the item already exists in the order (same product and not yet sent)
    const existingIndex = order.items.findIndex(
      it => it.productId === product.id && !it.sentAt
    );

    const updatedItems = [...order.items];
    if (existingIndex !== -1) {
      updatedItems[existingIndex].quantity += 1;
    } else {
      updatedItems.push({
        productId: product.id,
        name: product.name,
        quantity: 1,
        unitPrice: product.salePrice,
        destination: product.printDestination || 'ninguno',
        round: 1
      });
    }

    try {
      await updateDoc(doc(db, 'companies', activeCompanyId, 'orders', order.id), {
        items: updatedItems
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `companies/${activeCompanyId}/orders/${order.id}`);
    }
  };

  // Update item quantity in the order
  const handleUpdateItemQuantity = async (order: Order, productIndex: number, delta: number) => {
    if (!activeCompanyId) return;
    
    const updatedItems = [...order.items];
    const item = updatedItems[productIndex];
    if (item.sentAt) {
      alert("No se pueden modificar productos que ya fueron enviados a la cocina/barra.");
      return;
    }

    item.quantity += delta;
    if (item.quantity <= 0) {
      updatedItems.splice(productIndex, 1);
    }

    try {
      await updateDoc(doc(db, 'companies', activeCompanyId, 'orders', order.id), {
        items: updatedItems
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `companies/${activeCompanyId}/orders/${order.id}`);
    }
  };

  // Remove item from the order
  const handleRemoveItemFromOrder = async (order: Order, productIndex: number) => {
    if (!activeCompanyId) return;
    
    const updatedItems = [...order.items];
    const item = updatedItems[productIndex];
    if (item.sentAt) {
      alert("No se pueden eliminar productos que ya fueron enviados a la cocina/barra.");
      return;
    }

    updatedItems.splice(productIndex, 1);

    try {
      await updateDoc(doc(db, 'companies', activeCompanyId, 'orders', order.id), {
        items: updatedItems
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `companies/${activeCompanyId}/orders/${order.id}`);
    }
  };

  // Calculate order subtotal
  const orderTotalAmount = useMemo(() => {
    if (!currentActiveOrder) return 0;
    return currentActiveOrder.items.reduce((sum, it) => sum + it.unitPrice * it.quantity, 0);
  }, [currentActiveOrder]);

  const activeBranchName = branches.find(b => b.id === selectedBranchId)?.name || 'Sucursal Principal';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans select-none">
      {/* Premium Header */}
      <header 
        className="text-white shadow-md px-4 py-3 flex justify-between items-center z-15 border-b"
        style={{ 
          backgroundColor: 'var(--brand-dark, #0f172a)', 
          borderColor: 'color-mix(in srgb, var(--brand-primary, #6366f1) 30%, transparent)' 
        }}
      >
        <div className="flex items-center space-x-3 min-w-0">
          <div 
            className="p-2 rounded-xl"
            style={{ 
              backgroundColor: 'color-mix(in srgb, var(--brand-dark, #0f172a) 55%, black)',
              border: '1px solid color-mix(in srgb, var(--brand-primary, #6366f1) 30%, transparent)' 
            }}
          >
            <Utensils className="w-5 h-5 text-amber-500 animate-pulse" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-base font-black tracking-wider truncate" style={{ color: 'var(--brand-primary, #6366f1)' }}>
              {companyName}
            </span>
            <span className="text-[10px] font-bold text-slate-300 flex items-center gap-1">
              <MapPin className="w-3 h-3 text-amber-500 shrink-0" />
              {activeBranchName}
            </span>
          </div>
        </div>

        {/* User profile & controls */}
        <div className="flex items-center space-x-2">
          <div className="hidden sm:flex flex-col text-right mr-1">
            <span className="text-xs font-black text-white">{currentUserMember?.name || user.displayName || 'Mesero'}</span>
            <span className="text-[9px] text-amber-500 font-extrabold uppercase tracking-widest">🍽️ Mesero</span>
          </div>
          
          {/* Switch Company if multi-company */}
          {Object.keys(userAvailableCompanies).length > 1 && onLeaveCompany && (
            <button 
              onClick={onLeaveCompany}
              className="p-2 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 rounded-xl cursor-pointer transition shadow-sm"
              title="Cambiar de Comercio"
            >
              <Building2 className="w-4 h-4" />
            </button>
          )}

          {/* Logout */}
          <button 
            onClick={onLogout}
            className="p-2 bg-red-950/40 hover:bg-red-900/60 text-red-400 hover:text-red-300 border border-red-900/50 rounded-xl cursor-pointer transition shadow-sm"
            title="Cerrar Sesión"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Navigation Sub-header */}
      <div className="bg-white border-b border-slate-200 px-4 py-2 flex items-center justify-between shadow-sm">
        <div className="flex space-x-1.5 w-full max-w-md">
          <button
            onClick={() => { setActiveTab('tables'); setSelectedTable(null); }}
            className={`flex-1 py-2 px-3 text-xs font-black uppercase rounded-xl transition cursor-pointer text-center flex items-center justify-center gap-1.5 border ${
              activeTab === 'tables' 
                ? 'bg-indigo-50 border-indigo-200 text-indigo-700 font-black' 
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Utensils className="w-4 h-4" />
            <span>Mapa de Mesas</span>
          </button>
          <button
            onClick={() => { setActiveTab('my-orders'); setSelectedTable(null); }}
            className={`flex-1 py-2 px-3 text-xs font-black uppercase rounded-xl transition cursor-pointer text-center flex items-center justify-center gap-1.5 border relative ${
              activeTab === 'my-orders' 
                ? 'bg-indigo-50 border-indigo-200 text-indigo-700 font-black' 
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Mis Comandas</span>
            {myOpenOrders.length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-rose-500 border border-white text-white font-black text-[9px] w-5 h-5 rounded-full flex items-center justify-center shadow-sm">
                {myOpenOrders.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Main Workspace */}
      <main className="flex-grow p-4 md:p-6 flex flex-col md:flex-row gap-6 overflow-hidden">
        
        {/* VIEW 1: MAPA DE MESAS */}
        {activeTab === 'tables' && (
          <div className="flex-1 flex flex-col lg:flex-row gap-6 overflow-hidden min-h-[calc(100vh-140px)]">
            
            {/* Grid Column */}
            <div className="flex-1 overflow-y-auto pr-1">
              <div className="mb-4">
                <h2 className="text-lg font-black text-slate-800">Mesas de la Sucursal</h2>
                <p className="text-[11px] text-slate-500">Selecciona una mesa para ver su estatus actual o levantar una nueva comanda.</p>
              </div>

              {filteredTables.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center max-w-md mx-auto my-10 shadow-sm">
                  <Utensils className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                  <h3 className="font-extrabold text-sm text-slate-700">Sin mesas configuradas</h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Pídele a un administrador que registre mesas para esta sucursal en la pestaña Mi Empresa / Equipo (sección Sucursales).
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {filteredTables.map(table => {
                    const tableOrder = activeOrdersMap.get(table.id);
                    const isSelected = selectedTable?.id === table.id;
                    
                    return (
                      <button
                        key={table.id}
                        onClick={() => {
                          setSelectedTable(table);
                          setSearchTerm('');
                          setSelectedCategory('Todos');
                        }}
                        className={`p-4 rounded-2xl border text-left flex flex-col justify-between transition cursor-pointer relative shadow-sm h-32 hover:scale-[1.01] ${
                          isSelected 
                            ? 'ring-2 ring-indigo-600 border-indigo-400' 
                            : 'border-slate-200'
                        } ${
                          table.status === 'libre' 
                            ? 'bg-emerald-50/50 hover:bg-emerald-50 border-emerald-200' 
                            : table.status === 'por_cobrar'
                            ? 'bg-amber-50/50 hover:bg-amber-50 border-amber-200'
                            : 'bg-rose-50/50 hover:bg-rose-50 border-rose-200'
                        }`}
                      >
                        <div>
                          <div className="flex justify-between items-start">
                            <span className="font-black text-base text-slate-800">{table.name}</span>
                            <span className="text-[9px] text-slate-400 font-extrabold uppercase shrink-0">
                              👥 Cap. {table.capacity || 4}
                            </span>
                          </div>
                          
                          {/* Order Details Preview if Occupied */}
                          {tableOrder && (
                            <p className="text-[10px] text-slate-600 font-bold mt-1 line-clamp-1">
                              {tableOrder.items.length} art. · {formatMXN(tableOrder.items.reduce((sum, it) => sum + it.unitPrice * it.quantity, 0))}
                            </p>
                          )}
                        </div>

                        {/* Status Badge */}
                        <span className={`text-[9px] font-black uppercase py-0.5 px-2 rounded-full border w-fit ${
                          table.status === 'libre'
                            ? 'bg-emerald-100 border-emerald-300 text-emerald-800'
                            : table.status === 'por_cobrar'
                            ? 'bg-amber-100 border-amber-300 text-amber-800'
                            : 'bg-rose-100 border-rose-300 text-rose-800'
                        }`}>
                          {table.status === 'libre' ? 'Libre' : table.status === 'por_cobrar' ? 'Por Cobrar' : 'Ocupada'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Sidebar Details Drawer Column */}
            {selectedTable && (
              <div className="w-full lg:w-96 bg-white border border-slate-200 rounded-3xl p-5 shadow-sm flex flex-col overflow-hidden max-h-[calc(100vh-140px)]">
                
                {/* Table Header Details */}
                <div className="flex justify-between items-start pb-4 border-b border-slate-100 shrink-0">
                  <div>
                    <h3 className="text-base font-black text-slate-800">{selectedTable.name}</h3>
                    <p className="text-[10px] text-slate-500 font-medium">Sucursal: {activeBranchName}</p>
                  </div>
                  <button 
                    onClick={() => setSelectedTable(null)}
                    className="text-slate-400 hover:text-slate-600 font-black text-sm"
                  >
                    ✕
                  </button>
                </div>

                {/* Table Actions according to status */}
                {selectedTable.status === 'libre' ? (
                  <div className="flex-grow flex flex-col justify-center items-center p-6 text-center space-y-4 shrink-0">
                    <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center border border-emerald-100">
                      <Check className="w-8 h-8 text-emerald-600 animate-bounce" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-slate-800">La mesa está libre</h4>
                      <p className="text-xs text-slate-400 mt-1 max-w-xs">Abre la mesa para registrar comandas y asignarle un mesero activo.</p>
                    </div>
                    <button
                      onClick={() => handleOpenTable(selectedTable)}
                      className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-md transition cursor-pointer uppercase tracking-wider"
                    >
                      🚀 Abrir Mesa / Tomar Orden
                    </button>
                  </div>
                ) : (
                  <div className="flex-grow flex flex-col overflow-hidden pt-4 space-y-4">
                    {/* Status Toggle Row */}
                    <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl p-2.5 shrink-0">
                      <span className="text-[11px] font-bold text-slate-500">Estado de Mesa:</span>
                      <div className="flex space-x-1">
                        <button
                          onClick={() => handleUpdateTableStatus(selectedTable, 'ocupada')}
                          className={`px-2.5 py-1 text-[10px] font-black uppercase rounded-lg border cursor-pointer transition ${
                            selectedTable.status === 'ocupada'
                              ? 'bg-rose-50 border-rose-300 text-rose-700'
                              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          Ocupada
                        </button>
                        <button
                          onClick={() => handleUpdateTableStatus(selectedTable, 'por_cobrar')}
                          className={`px-2.5 py-1 text-[10px] font-black uppercase rounded-lg border cursor-pointer transition ${
                            selectedTable.status === 'por_cobrar'
                              ? 'bg-amber-50 border-amber-300 text-amber-700'
                              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          Cobrar
                        </button>
                      </div>
                    </div>

                    {/* Order Items Section */}
                    <div className="flex-grow flex flex-col overflow-hidden min-h-[180px]">
                      <div className="flex justify-between items-center pb-2 shrink-0">
                        <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">Comanda Activa</h4>
                        {currentActiveOrder && (
                          <span className="text-[10px] text-indigo-600 font-extrabold bg-indigo-50 border border-indigo-150 rounded px-1.5 py-0.5">
                            {currentActiveOrder.id}
                          </span>
                        )}
                      </div>

                      {/* Items List */}
                      {currentActiveOrder && currentActiveOrder.items.length > 0 ? (
                        <div className="flex-grow overflow-y-auto border border-slate-100 rounded-xl p-2.5 bg-slate-50 space-y-2">
                          {currentActiveOrder.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center bg-white border border-slate-150 p-2.5 rounded-lg shadow-sm">
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-extrabold text-slate-800 truncate">{item.name}</p>
                                <p className="text-[10px] text-slate-400 font-bold">
                                  {formatMXN(item.unitPrice)} c/u · <span className="uppercase text-[9px] text-indigo-500">{item.destination}</span>
                                </p>
                              </div>
                              <div className="flex items-center space-x-2 shrink-0 ml-3">
                                <button
                                  disabled={!!item.sentAt}
                                  onClick={() => handleUpdateItemQuantity(currentActiveOrder, idx, -1)}
                                  className={`p-1 rounded-md border cursor-pointer ${item.sentAt ? 'opacity-30 bg-slate-100' : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600'}`}
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="text-xs font-black text-slate-800 w-4 text-center">{item.quantity}</span>
                                <button
                                  disabled={!!item.sentAt}
                                  onClick={() => handleUpdateItemQuantity(currentActiveOrder, idx, 1)}
                                  className={`p-1 rounded-md border cursor-pointer ${item.sentAt ? 'opacity-30 bg-slate-100' : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600'}`}
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                                <button
                                  disabled={!!item.sentAt}
                                  onClick={() => handleRemoveItemFromOrder(currentActiveOrder, idx)}
                                  className={`p-1 rounded-md border cursor-pointer ${item.sentAt ? 'opacity-30 bg-slate-100' : 'bg-red-50 hover:bg-red-100 border-red-200 text-red-500'}`}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex-grow flex flex-col justify-center items-center border border-dashed border-slate-200 rounded-xl p-4 text-center bg-slate-50">
                          <Utensils className="w-8 h-8 text-slate-300 mb-2" />
                          <p className="text-[11px] text-slate-400 font-medium">No hay artículos agregados aún.</p>
                        </div>
                      )}

                      {/* Total Amount Panel */}
                      {currentActiveOrder && (
                        <div className="pt-3 border-t border-slate-100 shrink-0">
                          <div className="flex justify-between items-center text-slate-800">
                            <span className="text-xs font-extrabold">Monto Total:</span>
                            <span className="text-sm font-black text-indigo-700">{formatMXN(orderTotalAmount)}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Product Selection Catalog inside details */}
                    {currentActiveOrder && (
                      <div className="border border-slate-200 rounded-2xl p-3 bg-slate-50 flex flex-col overflow-hidden max-h-[300px] shrink-0">
                        {/* Search and Category filters */}
                        <div className="space-y-2 shrink-0 pb-2">
                          <div className="relative">
                            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
                            <input
                              type="text"
                              value={searchTerm}
                              onChange={e => setSearchTerm(e.target.value)}
                              placeholder="Buscar producto..."
                              className="w-full bg-white border border-slate-200 rounded-lg pl-8 pr-2 py-1 text-xs outline-none focus:border-indigo-400 font-medium text-slate-700"
                            />
                          </div>

                          {/* Horizontal Categories Slider */}
                          <div className="flex overflow-x-auto gap-1 pb-1 scrollbar-none shrink-0">
                            {categories.map(cat => (
                              <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-full border cursor-pointer shrink-0 transition ${
                                  selectedCategory === cat
                                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                                    : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                                }`}
                              >
                                {cat}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Filtered Products list */}
                        <div className="flex-grow overflow-y-auto space-y-1.5 pr-0.5">
                          {filteredProducts.map(prod => (
                            <button
                              key={prod.id}
                              onClick={() => handleAddItemToOrder(currentActiveOrder, prod)}
                              className="w-full flex justify-between items-center bg-white border border-slate-250 p-2 rounded-xl hover:border-indigo-300 transition text-left cursor-pointer shadow-sm hover:shadow"
                            >
                              <div className="min-w-0 flex-1">
                                <p className="text-[11px] font-extrabold text-slate-800 truncate">{prod.name}</p>
                                <p className="text-[9px] text-slate-400 font-bold">{formatMXN(prod.salePrice)}</p>
                              </div>
                              <span className="ml-3 px-2 py-1 bg-indigo-50 border border-indigo-150 text-indigo-700 font-black text-[9px] uppercase rounded-lg shrink-0">
                                + Agregar
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Liberar / Cerrar mesa button */}
                    <button
                      onClick={() => handleReleaseTable(selectedTable)}
                      className="w-full py-2.5 bg-slate-900 hover:bg-black text-white font-black text-[11px] rounded-xl shadow-sm transition cursor-pointer uppercase tracking-wider shrink-0"
                    >
                      🧹 Liberar / Cerrar Mesa
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* VIEW 2: MIS COMANDAS */}
        {activeTab === 'my-orders' && (
          <div className="flex-grow overflow-y-auto pr-1">
            <div className="mb-6">
              <h2 className="text-lg font-black text-slate-800">Mis Comandas Abiertas</h2>
              <p className="text-[11px] text-slate-500">Historial de las órdenes activas en el salón que tienes asignadas.</p>
            </div>

            {myOpenOrders.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-3xl p-10 text-center max-w-md mx-auto my-12 shadow-sm">
                <Clock className="w-12 h-12 text-slate-350 mx-auto mb-3" />
                <h3 className="font-extrabold text-sm text-slate-700">Sin comandas abiertas</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                  No tienes comandas registradas en este momento. Abre una mesa desde el **Mapa de Mesas** para comenzar.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {myOpenOrders.map(order => {
                  const table = tables.find(t => t.id === order.tableId);
                  const total = order.items.reduce((sum, it) => sum + it.unitPrice * it.quantity, 0);
                  const openedDate = new Date(order.openedAt);
                  const timeStr = openedDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                  return (
                    <button
                      key={order.id}
                      onClick={() => {
                        if (table) {
                          setSelectedTable(table);
                          setActiveTab('tables');
                        }
                      }}
                      className="bg-white border border-slate-200 hover:border-indigo-400 p-5 rounded-2xl text-left flex flex-col justify-between transition cursor-pointer hover:shadow-md hover:scale-[1.005] h-48 shadow-sm"
                    >
                      <div className="w-full">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="font-black text-base text-slate-800">{table?.name || 'Mesa Desconocida'}</span>
                            <p className="text-[9px] text-slate-400 font-extrabold uppercase mt-0.5 tracking-wider">ID: {order.id}</p>
                          </div>
                          <span className="text-[9px] font-black uppercase py-0.5 px-2 bg-indigo-50 border border-indigo-250 text-indigo-800 rounded-full">
                            🕒 {timeStr}
                          </span>
                        </div>

                        {/* Items list preview */}
                        <div className="mt-3 space-y-1 max-h-16 overflow-hidden">
                          {order.items.slice(0, 3).map((it, idx) => (
                            <p key={idx} className="text-[10px] text-slate-500 truncate font-semibold">
                              • {it.quantity}x {it.name}
                            </p>
                          ))}
                          {order.items.length > 3 && (
                            <p className="text-[9px] text-slate-400 font-bold pl-2">
                              + {order.items.length - 3} artículos más...
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex justify-between items-center pt-3 border-t border-slate-100 mt-3 w-full shrink-0">
                        <span className="text-xs font-bold text-slate-400">Total:</span>
                        <span className="text-sm font-black text-indigo-600">{formatMXN(total)}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
