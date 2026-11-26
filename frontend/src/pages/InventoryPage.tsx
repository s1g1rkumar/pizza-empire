import {
  AlertTriangle,
  ArrowLeftRight,
  Boxes,
  Coins,
  History,
  RefreshCw,
  ShoppingCart,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { GameLayout } from '@/components/GameLayout';
import { SectionCard } from '@/components/ui/SectionCard';
import {
  buyInventoryItem,
  clearInventoryError,
  fetchInventory,
  sellInventoryItem,
  transferInventoryItem,
} from '@/features/inventory/inventorySlice';
import { useAppDispatch, useAppSelector } from '@/hooks/redux';
import { InventoryCategory } from '@/types/inventory.types';

const CATEGORY_TABS: Array<{ key: 'ALL' | InventoryCategory; label: string }> = [
  { key: 'ALL', label: 'All Items' },
  { key: 'RAW_CROP', label: 'Crops' },
  { key: 'RAW_MATERIAL', label: 'Raw Materials' },
  { key: 'PROCESSED_INGREDIENT', label: 'Processed Ingredients' },
  { key: 'PIZZA', label: 'Pizza Products' },
  { key: 'PACKAGING', label: 'Packaging' },
  { key: 'RETAIL_GOOD', label: 'Retail Products' },
];

export function InventoryPage() {
  const dispatch = useAppDispatch();
  const { data, loading, acting, error } = useAppSelector((state) => state.inventory);

  const [categoryFilter, setCategoryFilter] = useState<'ALL' | InventoryCategory>('ALL');
  const [selectedBizId, setSelectedBizId] = useState<number | null>(null);
  const [transferFromId, setTransferFromId] = useState<number>(0);
  const [transferToId, setTransferToId] = useState<number>(0);
  const [transferItemId, setTransferItemId] = useState<number>(0);
  const [transferQty, setTransferQty] = useState<number>(5);

  useEffect(() => {
    void dispatch(fetchInventory());
  }, [dispatch]);

  useEffect(() => {
    if (data && data.businesses.length > 0 && selectedBizId === null) {
      setSelectedBizId(data.businesses[0]!.id);
      setTransferFromId(data.businesses[0]!.id);
      setTransferToId(data.businesses[1]?.id ?? data.businesses[0]!.id);
    }
    if (data && data.items.length > 0 && transferItemId === 0) {
      setTransferItemId(data.items[0]!.itemId);
    }
  }, [data, selectedBizId, transferItemId]);

  if (loading && !data) {
    return (
      <GameLayout>
        <div className="h-64 animate-pulse rounded-2xl border border-[#49352A]/10 bg-white/70" />
      </GameLayout>
    );
  }

  if (!data) return null;

  const filteredItems =
    categoryFilter === 'ALL' ? data.items : data.items.filter((i) => i.category === categoryFilter);

  const activeBizId = selectedBizId ?? data.businesses[0]?.id ?? 0;

  return (
    <GameLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold text-[#49352A]">Centralized Inventory</h1>
            <p className="text-sm text-[#49352A]/70">
              Manage stock across all 6 categories, reservations, market trades, and internal
              transfers
            </p>
          </div>
          <button
            type="button"
            onClick={() => void dispatch(fetchInventory())}
            disabled={loading || acting}
            className="inline-flex items-center gap-2 rounded-xl bg-[#49352A] px-4 py-2 text-xs font-bold text-[#FFF7E8] hover:bg-[#3a2a21]"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh Stock
          </button>
        </div>

        {error && (
          <div className="flex items-center justify-between rounded-xl border border-[#E94B35]/40 bg-[#E94B35]/10 px-4 py-3 text-sm text-[#E94B35]">
            <span>{error}</span>
            <button
              type="button"
              onClick={() => dispatch(clearInventoryError())}
              className="text-xs font-bold underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Storage Capacity Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.businesses.map((biz) => {
            const pct = Math.min(
              100,
              Math.round((biz.storageUsed / Math.max(1, biz.storageCapacity)) * 100)
            );
            return (
              <div
                key={biz.id}
                onClick={() => setSelectedBizId(biz.id)}
                className={`cursor-pointer rounded-2xl border p-4 transition ${
                  activeBizId === biz.id
                    ? 'border-[#E94B35] bg-white shadow-md'
                    : 'border-[#49352A]/10 bg-white/80 hover:border-[#F28C38]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Boxes className="h-4 w-4 text-[#F28C38]" />
                    <span className="font-bold text-[#49352A]">{biz.name}</span>
                  </div>
                  <span className="text-xs font-bold text-[#49352A]/70">
                    {biz.storageUsed}/{biz.storageCapacity}
                  </span>
                </div>
                <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-[#49352A]/10">
                  <div
                    className={`h-full rounded-full ${pct >= 85 ? 'bg-[#E94B35]' : 'bg-[#58A66A]'}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Stock Alerts */}
        {data.alerts.length > 0 && (
          <div className="rounded-2xl border border-[#FFC857] bg-[#FFC857]/20 p-4">
            <div className="mb-2 flex items-center gap-2 text-sm font-extrabold text-[#49352A]">
              <AlertTriangle className="h-4 w-4 text-[#E94B35]" />
              Stock & Capacity Alerts ({data.alerts.length})
            </div>
            <ul className="space-y-1 text-xs text-[#49352A]/85">
              {data.alerts.map((a, idx) => (
                <li key={idx}>• {a.message}</li>
              ))}
            </ul>
          </div>
        )}

        {/* 6-Category Tabs + Item Catalog & Stock Table */}
        <SectionCard
          title="Inventory Catalog & Market Trading"
          subtitle="Buy wholesale inputs or liquidate surplus stock for your selected facility"
        >
          <div className="mb-4 flex flex-wrap gap-2">
            {CATEGORY_TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setCategoryFilter(tab.key)}
                className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                  categoryFilter === tab.key
                    ? 'bg-[#E94B35] text-white'
                    : 'bg-[#FFF7E8] text-[#49352A] hover:bg-[#FFC857]/30'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[#49352A]/10 text-xs text-[#49352A]/65 uppercase">
                  <th className="py-2.5 pr-4">Item</th>
                  <th className="py-2.5 pr-4">Category</th>
                  <th className="py-2.5 pr-4">Available</th>
                  <th className="py-2.5 pr-4">Reserved</th>
                  <th className="py-2.5 pr-4">Buy / Sell</th>
                  <th className="py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#49352A]/10">
                {filteredItems.map((item) => {
                  const bizStock = item.stocks.find((s) => s.businessId === activeBizId);
                  const available = bizStock?.availableQuantity ?? 0;
                  const reserved = bizStock?.reservedQuantity ?? 0;

                  return (
                    <tr key={item.itemId}>
                      <td className="py-3 pr-4">
                        <p className="font-bold text-[#49352A]">{item.name}</p>
                        {item.description && (
                          <p className="text-xs text-[#49352A]/60">{item.description}</p>
                        )}
                      </td>
                      <td className="py-3 pr-4 text-xs font-semibold text-[#49352A]/75">
                        {item.category.replace('_', ' ')}
                      </td>
                      <td className="py-3 pr-4 font-bold text-[#49352A]">{available}</td>
                      <td className="py-3 pr-4 text-xs font-semibold text-[#F28C38]">{reserved}</td>
                      <td className="py-3 pr-4 text-xs text-[#49352A]/75">
                        ${item.unitWholesaleBuy} / ${item.unitWholesaleSell}
                      </td>
                      <td className="py-3 text-right">
                        <div className="inline-flex gap-1.5">
                          {item.unitWholesaleBuy > 0 && activeBizId > 0 && (
                            <button
                              type="button"
                              disabled={acting}
                              onClick={() =>
                                void dispatch(
                                  buyInventoryItem({
                                    businessId: activeBizId,
                                    itemId: item.itemId,
                                    quantity: 5,
                                  })
                                )
                              }
                              className="inline-flex items-center gap-1 rounded-lg bg-[#F28C38] px-2.5 py-1 text-xs font-bold text-white hover:bg-[#df7c2b] disabled:opacity-40"
                            >
                              <ShoppingCart className="h-3 w-3" />
                              Buy 5
                            </button>
                          )}
                          {item.unitWholesaleSell > 0 && activeBizId > 0 && (
                            <button
                              type="button"
                              disabled={acting || available < 1}
                              onClick={() =>
                                void dispatch(
                                  sellInventoryItem({
                                    businessId: activeBizId,
                                    itemId: item.itemId,
                                    quantity: Math.min(5, available),
                                  })
                                )
                              }
                              className="inline-flex items-center gap-1 rounded-lg bg-[#58A66A] px-2.5 py-1 text-xs font-bold text-white hover:bg-[#498f59] disabled:opacity-40"
                            >
                              <Coins className="h-3 w-3" />
                              Sell
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </SectionCard>

        {/* Internal Transfers & Inventory History */}
        <div className="grid gap-6 lg:grid-cols-2">
          <SectionCard
            title="Internal Facility Transfer"
            subtitle="Move stock between your Farm, Factory, and Restaurants"
          >
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-bold text-[#49352A]">Item</label>
                <select
                  value={transferItemId}
                  onChange={(e) => setTransferItemId(Number(e.target.value))}
                  className="w-full rounded-xl border border-[#49352A]/20 bg-[#FFF7E8]/50 px-3 py-2 text-sm text-[#49352A]"
                >
                  {data.items.map((it) => (
                    <option key={it.itemId} value={it.itemId}>
                      {it.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-bold text-[#49352A]">From</label>
                  <select
                    value={transferFromId}
                    onChange={(e) => setTransferFromId(Number(e.target.value))}
                    className="w-full rounded-xl border border-[#49352A]/20 bg-[#FFF7E8]/50 px-3 py-2 text-sm text-[#49352A]"
                  >
                    {data.businesses.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold text-[#49352A]">To</label>
                  <select
                    value={transferToId}
                    onChange={(e) => setTransferToId(Number(e.target.value))}
                    className="w-full rounded-xl border border-[#49352A]/20 bg-[#FFF7E8]/50 px-3 py-2 text-sm text-[#49352A]"
                  >
                    {data.businesses.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex items-end gap-3">
                <div className="flex-1">
                  <label className="mb-1 block text-xs font-bold text-[#49352A]">Quantity</label>
                  <input
                    type="number"
                    min={1}
                    max={10000}
                    value={transferQty}
                    onChange={(e) => setTransferQty(Math.max(1, Number(e.target.value)))}
                    className="w-full rounded-xl border border-[#49352A]/20 bg-[#FFF7E8]/50 px-3 py-2 text-sm text-[#49352A]"
                  />
                </div>
                <button
                  type="button"
                  disabled={acting || data.businesses.length < 2}
                  onClick={() =>
                    void dispatch(
                      transferInventoryItem({
                        fromBusinessId: transferFromId,
                        toBusinessId: transferToId,
                        itemId: transferItemId,
                        quantity: transferQty,
                      })
                    )
                  }
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#49352A] px-4 py-2.5 text-xs font-bold text-[#FFF7E8] hover:bg-[#3a2a21] disabled:opacity-40"
                >
                  <ArrowLeftRight className="h-4 w-4" />
                  Transfer
                </button>
              </div>
            </div>
          </SectionCard>

          <SectionCard
            title="Inventory Audit History"
            subtitle="Every deposit, reservation, transfer, and trade recorded"
          >
            {data.history.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center text-xs text-[#49352A]/60">
                <History className="mb-2 h-6 w-6 text-[#49352A]/40" />
                No inventory movements recorded yet.
              </div>
            ) : (
              <div className="max-h-64 divide-y divide-[#49352A]/10 overflow-y-auto">
                {data.history.map((h) => (
                  <div key={h.id} className="flex items-center justify-between py-2 text-xs">
                    <div>
                      <p className="font-bold text-[#49352A]">
                        {h.transactionType} · {h.itemName}
                      </p>
                      <p className="text-[#49352A]/60">
                        {h.businessName} · Bal: {h.balanceAfter} (Res: {h.reservedAfter})
                      </p>
                    </div>
                    <span
                      className={`font-extrabold ${
                        h.quantityDelta >= 0 ? 'text-[#58A66A]' : 'text-[#E94B35]'
                      }`}
                    >
                      {h.quantityDelta >= 0 ? `+${h.quantityDelta}` : h.quantityDelta}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </div>
      </div>
    </GameLayout>
  );
}
