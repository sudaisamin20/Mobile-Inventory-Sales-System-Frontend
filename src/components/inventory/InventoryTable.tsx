import React, { useState } from "react";
import {
  Search,
  Filter,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Eye,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { Button, StatusBadge, EmptyState, SkeletonRow } from "../ui";
import type { IDevice, IInventoryFilters } from "../../interfaces/inventory";

interface InventoryTableProps {
  devices: IDevice[];
  filters: IInventoryFilters;
  onFilterChange: (filters: IInventoryFilters) => void;
  onPageChange: (page: number) => void;
  onEdit: (device: IDevice) => void;
  onDelete: (device: IDevice) => void;
  onView: (device: IDevice) => void;
  currentPage: number;
  itemsPerPage: number;
  total: number;
  loading?: boolean;
}

export function InventoryTable({
  devices,
  filters,
  onFilterChange,
  onPageChange,
  onEdit,
  onDelete,
  onView,
  currentPage,
  itemsPerPage,
  total,
  loading = false,
}: InventoryTableProps) {
  const [showFilters, setShowFilters] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const totalPages = Math.ceil(total / itemsPerPage);

  return (
    <div className="space-y-4">
      {/* Search & Filters */}
      <div className="flex flex-col gap-4">
        <div className="flex gap-3 flex-wrap">
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
              />
              <input
                type="text"
                placeholder="Search by brand, model, IMEI..."
                value={filters.search}
                onChange={(e) =>
                  onFilterChange({ ...filters, search: e.target.value })
                }
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/4 border border-white/10 text-white text-sm focus:outline-none focus:border-yellow-400/50 transition-colors"
              />
            </div>
          </div>

          <Button
            variant={showFilters ? "primary" : "dark"}
            size="sm"
            iconLeft={<Filter size={14} />}
            onClick={() => setShowFilters(!showFilters)}
          >
            Filters
          </Button>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="p-4 rounded-2xl bg-white/4 border border-white/10 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">
                  Condition
                </label>
                <select
                  multiple
                  value={filters.condition || []}
                  onChange={(e) =>
                    onFilterChange({
                      ...filters,
                      condition: Array.from(e.target.selectedOptions).map(
                        (o) => o.value as any,
                      ),
                    })
                  }
                  className="w-full px-3 py-2 rounded-lg bg-white/4 border border-white/10 text-white text-xs focus:outline-none focus:border-yellow-400/50 transition-colors"
                >
                  <option value="new">New</option>
                  <option value="used">Used</option>
                  <option value="open-box">Open Box</option>
                  <option value="refurbished">Refurbished</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">
                  Stock Status
                </label>
                <select
                  multiple
                  value={filters.stockStatus || []}
                  onChange={(e) =>
                    onFilterChange({
                      ...filters,
                      stockStatus: Array.from(e.target.selectedOptions).map(
                        (o) => o.value as any,
                      ),
                    })
                  }
                  className="w-full px-3 py-2 rounded-lg bg-white/4 border border-white/10 text-white text-xs focus:outline-none focus:border-yellow-400/50 transition-colors"
                >
                  <option value="available">Available</option>
                  <option value="low">Low Stock</option>
                  <option value="out-of-stock">Out of Stock</option>
                  <option value="reserved">Reserved</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">
                  PTA Status
                </label>
                <select
                  multiple
                  value={filters.ptaStatus || []}
                  onChange={(e) =>
                    onFilterChange({
                      ...filters,
                      ptaStatus: Array.from(e.target.selectedOptions).map(
                        (o) => o.value as any,
                      ),
                    })
                  }
                  className="w-full px-3 py-2 rounded-lg bg-white/4 border border-white/10 text-white text-xs focus:outline-none focus:border-yellow-400/50 transition-colors"
                >
                  <option value="approved">Approved</option>
                  <option value="pending">Pending</option>
                  <option value="blocked">Blocked</option>
                  <option value="unknown">Unknown</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">
                  Brand
                </label>
                <select
                  multiple
                  value={filters.brand || []}
                  onChange={(e) =>
                    onFilterChange({
                      ...filters,
                      brand: Array.from(e.target.selectedOptions).map(
                        (o) => o.value,
                      ),
                    })
                  }
                  className="w-full px-3 py-2 rounded-lg bg-white/4 border border-white/10 text-white text-xs focus:outline-none focus:border-yellow-400/50 transition-colors"
                >
                  <option value="Apple">Apple</option>
                  <option value="Samsung">Samsung</option>
                  <option value="Xiaomi">Xiaomi</option>
                  <option value="OnePlus">OnePlus</option>
                </select>
              </div>
            </div>

            {(filters.condition?.length ||
              filters.stockStatus?.length ||
              filters.ptaStatus?.length ||
              filters.brand?.length) && (
              <Button
                variant="ghost"
                size="xs"
                onClick={() =>
                  onFilterChange({
                    search: filters.search,
                  })
                }
              >
                Clear Filters
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        {loading ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <SkeletonRow key={i} />
            ))}
          </div>
        ) : devices.length === 0 ? (
          <EmptyState
            title="No devices found"
            description="Try adjusting your filters or add a new device using the scanner."
          />
        ) : (
          <table className="w-full">
            <thead className="border-b border-white/10">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Device
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  IMEI
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Stock
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {devices.map((device) => (
                <React.Fragment key={device.id}>
                  <tr className="hover:bg-white/4 transition-colors group">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        {device.images.front ? (
                          <img
                            src={device.images.front}
                            alt={`${device.brand} ${device.model}`}
                            className="w-12 h-12 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                            <span className="text-gray-600 text-lg">📱</span>
                          </div>
                        )}
                        <div>
                          <p className="text-white font-semibold text-sm">
                            {device.brand} {device.model}
                          </p>
                          <p className="text-gray-400 text-xs">
                            {device.variant || "N/A"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-white font-mono text-sm break-all">
                        {device.imei1}
                      </p>
                      {device.imei2 && (
                        <p className="text-gray-500 font-mono text-xs break-all">
                          {device.imei2}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex gap-2 flex-wrap">
                        <StatusBadge
                          status={device.ptaStatus}
                          size="xs"
                          showIcon={false}
                        />
                        <StatusBadge
                          status={device.condition}
                          size="xs"
                          showIcon={false}
                        />
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm">
                        <p className="text-green-400 font-semibold">
                          ₨{device.sellingPrice.toLocaleString()}
                        </p>
                        <p className="text-gray-500 text-xs">
                          Cost: ₨{device.purchasePrice.toLocaleString()}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-white font-semibold">
                          {device.quantity}
                        </span>
                        <StatusBadge
                          status={device.stockStatus}
                          size="xs"
                          showIcon={true}
                        />
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex gap-2 justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => onView(device)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg text-blue-400 hover:bg-blue-400/10 transition-colors"
                          title="View"
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          onClick={() => onEdit(device)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg text-yellow-400 hover:bg-yellow-400/10 transition-colors"
                          title="Edit"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => onDelete(device)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg text-red-400 hover:bg-red-400/10 transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                        <button
                          onClick={() => toggleExpand(device.id)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-white/10 transition-colors"
                          title={
                            expandedIds.has(device.id) ? "Collapse" : "Expand"
                          }
                        >
                          {expandedIds.has(device.id) ? (
                            <ChevronUp size={14} />
                          ) : (
                            <ChevronDown size={14} />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>

                  {/* Expanded row */}
                  {expandedIds.has(device.id) && (
                    <tr className="bg-white/2 hover:bg-white/4 transition-colors">
                      <td colSpan={6} className="px-4 py-4">
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-gray-400 text-xs uppercase">
                              Location
                            </p>
                            <p className="text-white font-medium">
                              {device.shelfLocation || "N/A"}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-400 text-xs uppercase">
                              Warranty
                            </p>
                            <p className="text-white font-medium">
                              {device.warrantyDays} days
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-400 text-xs uppercase">
                              Battery
                            </p>
                            <p className="text-white font-medium">
                              {device.batteryHealth}%
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-400 text-xs uppercase">
                              Network
                            </p>
                            <p className="text-white font-medium capitalize">
                              {device.networkLockStatus}
                            </p>
                          </div>
                        </div>
                        {device.notes && (
                          <div className="mt-3 p-3 rounded-lg bg-white/4 border border-white/10">
                            <p className="text-gray-400 text-xs uppercase mb-1">
                              Notes
                            </p>
                            <p className="text-white text-sm">{device.notes}</p>
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between p-4 rounded-2xl bg-white/4 border border-white/10">
          <p className="text-sm text-gray-400">
            Showing {(currentPage - 1) * itemsPerPage + 1} -{" "}
            {Math.min(currentPage * itemsPerPage, total)} of {total} devices
          </p>

          <div className="flex gap-2">
            <Button
              variant="dark"
              size="sm"
              iconLeft={<ChevronLeft size={14} />}
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Previous
            </Button>

            <div className="flex items-center gap-1">
              {[...Array(Math.min(5, totalPages))].map((_, i) => {
                const page = i + 1;
                return (
                  <button
                    key={page}
                    onClick={() => onPageChange(page)}
                    className={`
                      w-8 h-8 rounded-lg font-medium text-sm transition-all
                      ${
                        page === currentPage
                          ? "bg-yellow-400 text-yellow-900"
                          : "bg-white/4 text-gray-300 hover:bg-white/6"
                      }
                    `}
                  >
                    {page}
                  </button>
                );
              })}
            </div>

            <Button
              variant="dark"
              size="sm"
              icon={<ChevronRight size={14} />}
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}