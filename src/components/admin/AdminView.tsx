import React, { useState } from 'react';
import { 
  BarChart3, 
  Utensils, 
  Layers, 
  Users, 
  Clock, 
  TrendingDown, 
  CreditCard, 
  FileSpreadsheet, 
  ShieldCheck 
} from 'lucide-react';
import { AdminDashboard } from './AdminDashboard';
import { MenuManager } from './MenuManager';
import { TableManager } from './TableManager';
import { StaffManager } from './StaffManager';
import { AttendanceManager } from './AttendanceManager';
import { ExpenseManager } from './ExpenseManager';
import { CashRegisterManager } from './CashRegisterManager';
import { ReportsManager } from './ReportsManager';
import { AuditLogViewer } from './AuditLogViewer';

export type AdminTab = 
  | 'DASHBOARD'
  | 'MENU'
  | 'TABLES'
  | 'STAFF'
  | 'ATTENDANCE'
  | 'EXPENSES'
  | 'CASH_REGISTER'
  | 'REPORTS'
  | 'AUDIT';

export const AdminView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AdminTab>('DASHBOARD');

  const navigationItems = [
    { id: 'DASHBOARD', label: 'Vue d\'Ensemble', icon: BarChart3 },
    { id: 'MENU', label: 'Menu & Carte', icon: Utensils },
    { id: 'TABLES', label: 'Plan de Salle', icon: Layers },
    { id: 'STAFF', label: 'Personnel RH', icon: Users },
    { id: 'ATTENDANCE', label: 'Pointages', icon: Clock },
    { id: 'EXPENSES', label: 'Dépenses & Achats', icon: TrendingDown },
    { id: 'CASH_REGISTER', label: 'Caisse & Clôture', icon: CreditCard },
    { id: 'REPORTS', label: 'Rapports & Exports', icon: FileSpreadsheet },
    { id: 'AUDIT', label: 'Journal d\'Audit', icon: ShieldCheck },
  ];

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-stone-950 text-stone-100 p-4 sm:p-6 lg:p-8 space-y-6">
      
      {/* Sub-Navigation Bar */}
      <div className="bg-stone-900 border border-stone-800 rounded-2xl p-2 shadow-xl overflow-x-auto overscroll-x-contain">
        <div className="flex w-max items-center gap-1.5">
          {navigationItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as AdminTab)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                  isActive
                    ? 'bg-amber-500 text-stone-950 shadow-md shadow-amber-500/20'
                    : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Tab View Content */}
      <div className="animate-in fade-in duration-200">
        {activeTab === 'DASHBOARD' && <AdminDashboard />}
        {activeTab === 'MENU' && <MenuManager />}
        {activeTab === 'TABLES' && <TableManager />}
        {activeTab === 'STAFF' && <StaffManager />}
        {activeTab === 'ATTENDANCE' && <AttendanceManager />}
        {activeTab === 'EXPENSES' && <ExpenseManager />}
        {activeTab === 'CASH_REGISTER' && <CashRegisterManager />}
        {activeTab === 'REPORTS' && <ReportsManager />}
        {activeTab === 'AUDIT' && <AuditLogViewer />}
      </div>

    </div>
  );
};
