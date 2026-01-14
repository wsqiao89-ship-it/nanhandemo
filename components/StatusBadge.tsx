
import React from 'react';
import { OrderStatus, VehicleStatus } from '../types';

interface StatusBadgeProps {
  status: OrderStatus | VehicleStatus | string;
  type?: 'order' | 'vehicle';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, type = 'order' }) => {
  let colorClass = 'bg-gray-100 text-gray-800';

  if (type === 'order') {
    switch (status) {
      case OrderStatus.PendingAudit: colorClass = 'bg-purple-100 text-purple-800 border-purple-200'; break;
      case OrderStatus.Unassigned: colorClass = 'bg-gray-100 text-gray-600 border-gray-200'; break;
      case OrderStatus.ReadyToShip: colorClass = 'bg-blue-100 text-blue-800 border-blue-200'; break;
      case OrderStatus.Shipping: colorClass = 'bg-indigo-100 text-indigo-800 border-indigo-200 animate-pulse'; break;
      case OrderStatus.Completed: colorClass = 'bg-green-100 text-green-800 border-green-200'; break;
      case OrderStatus.Returning: colorClass = 'bg-red-50 text-red-600 border-red-200'; break;
      case OrderStatus.Exchanging: colorClass = 'bg-orange-50 text-orange-600 border-orange-200'; break;
      case OrderStatus.Returned: colorClass = 'bg-red-100 text-red-800 border-red-200'; break;
      case OrderStatus.Exchanged: colorClass = 'bg-orange-100 text-orange-800 border-orange-200'; break;
      // New Statuses
      case OrderStatus.Auditing: colorClass = 'bg-teal-100 text-teal-800 border-teal-200'; break;
      case OrderStatus.Invoiced: colorClass = 'bg-slate-800 text-white border-slate-900'; break;
    }
  } else {
    // Vehicle Status
    switch (status) {
      case VehicleStatus.PendingEntry: colorClass = 'bg-gray-100 text-gray-600'; break;
      case VehicleStatus.Entered: colorClass = 'bg-blue-50 text-blue-600'; break;
      case VehicleStatus.Loading:
      case VehicleStatus.Unloading: colorClass = 'bg-indigo-100 text-indigo-700'; break;
      case VehicleStatus.Exited: colorClass = 'bg-green-50 text-green-700'; break;
    }
  }

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${colorClass}`}>
      {status}
    </span>
  );
};
