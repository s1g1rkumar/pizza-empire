import { Save } from 'lucide-react';
import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import {
  adminUpdateCrop,
  adminUpdateLocation,
  adminUpdateProduct,
  adminUpdateUpgrade,
  fetchAdminConfig,
} from '@/features/admin/adminSlice';
import { useAppDispatch, useAppSelector } from '@/hooks/redux';

type CatalogTab = 'crops' | 'products' | 'locations' | 'upgrades';

export function AdminCatalogPage() {
  const dispatch = useAppDispatch();
  const { config, acting, error } = useAppSelector((state) => state.admin);
  const [tab, setTab] = useState<CatalogTab>('crops');
  const [drafts, setDrafts] = useState<Record<string, Record<string, number | boolean>>>({});

  useEffect(() => {
    void dispatch(fetchAdminConfig());
  }, [dispatch]);

  const getVal = <T extends number | boolean>(key: string, field: string, fallback: T): T =>
    ((drafts[key]?.[field] as T | undefined) ?? fallback) as T;

  const setVal = (key: string, field: string, value: number | boolean) => {
    setDrafts((prev) => ({
      ...prev,
      [key]: { ...prev[key], [field]: value },
    }));
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold text-white">
              Crops, Products, Locations & Upgrades
            </h1>
            <p className="text-xs text-slate-400">
              Tune game balance, wholesale pricing, district multipliers, and upgrade scaling
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {(['crops', 'products', 'locations', 'upgrades'] as CatalogTab[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`rounded-xl px-3.5 py-2 text-xs font-bold capitalize ${
                  tab === t
                    ? 'bg-amber-500 text-slate-950'
                    : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-2 text-xs text-red-400">
            {error}
          </div>
        )}

        {config && tab === 'crops' && (
          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="p-3">Crop</th>
                  <th className="p-3">Seed Cost</th>
                  <th className="p-3">Growth (s)</th>
                  <th className="p-3">Base Yield</th>
                  <th className="p-3">Sell Price</th>
                  <th className="p-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {config.crops.map((c) => {
                  const k = `crop_${c.id}`;
                  return (
                    <tr key={c.id}>
                      <td className="p-3 font-bold text-white">{c.name}</td>
                      <td className="p-3">
                        <input
                          type="number"
                          step="0.5"
                          value={getVal(k, 'seedCost', Number(c.seedCost))}
                          onChange={(e) => setVal(k, 'seedCost', Number(e.target.value))}
                          className="w-20 rounded border border-slate-700 bg-slate-950 px-2 py-1 text-white"
                        />
                      </td>
                      <td className="p-3">
                        <input
                          type="number"
                          value={getVal(k, 'growthSeconds', Number(c.growthSeconds))}
                          onChange={(e) => setVal(k, 'growthSeconds', Number(e.target.value))}
                          className="w-20 rounded border border-slate-700 bg-slate-950 px-2 py-1 text-white"
                        />
                      </td>
                      <td className="p-3">
                        <input
                          type="number"
                          value={getVal(k, 'baseYield', Number(c.baseYield))}
                          onChange={(e) => setVal(k, 'baseYield', Number(e.target.value))}
                          className="w-16 rounded border border-slate-700 bg-slate-950 px-2 py-1 text-white"
                        />
                      </td>
                      <td className="p-3">
                        <input
                          type="number"
                          step="0.5"
                          value={getVal(k, 'marketSellPrice', Number(c.marketSellPrice))}
                          onChange={(e) => setVal(k, 'marketSellPrice', Number(e.target.value))}
                          className="w-20 rounded border border-slate-700 bg-slate-950 px-2 py-1 text-emerald-400"
                        />
                      </td>
                      <td className="p-3">
                        <button
                          type="button"
                          disabled={acting}
                          onClick={() =>
                            void dispatch(
                              adminUpdateCrop({
                                cropId: c.id,
                                seedCost: getVal(k, 'seedCost', Number(c.seedCost)),
                                growthSeconds: getVal(k, 'growthSeconds', Number(c.growthSeconds)),
                                baseYield: getVal(k, 'baseYield', Number(c.baseYield)),
                                marketSellPrice: getVal(
                                  k,
                                  'marketSellPrice',
                                  Number(c.marketSellPrice)
                                ),
                                unlockXpLevel: Number(c.unlockXpLevel),
                              })
                            )
                          }
                          className="inline-flex items-center gap-1 rounded-lg bg-amber-500 px-2.5 py-1 font-bold text-slate-950"
                        >
                          <Save className="h-3 w-3" /> Save
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {config && tab === 'products' && (
          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="p-3">Product</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Buy Price</th>
                  <th className="p-3">Sell Price</th>
                  <th className="p-3">Low Stock Alert</th>
                  <th className="p-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {config.products.map((p) => {
                  const k = `prod_${p.id}`;
                  return (
                    <tr key={p.id}>
                      <td className="p-3 font-bold text-white">{p.name}</td>
                      <td className="p-3 text-slate-400">{p.category}</td>
                      <td className="p-3">
                        <input
                          type="number"
                          step="0.25"
                          value={getVal(k, 'unitWholesaleBuy', Number(p.unitWholesaleBuy))}
                          onChange={(e) => setVal(k, 'unitWholesaleBuy', Number(e.target.value))}
                          className="w-20 rounded border border-slate-700 bg-slate-950 px-2 py-1 text-white"
                        />
                      </td>
                      <td className="p-3">
                        <input
                          type="number"
                          step="0.25"
                          value={getVal(k, 'unitWholesaleSell', Number(p.unitWholesaleSell))}
                          onChange={(e) => setVal(k, 'unitWholesaleSell', Number(e.target.value))}
                          className="w-20 rounded border border-slate-700 bg-slate-950 px-2 py-1 text-emerald-400"
                        />
                      </td>
                      <td className="p-3">
                        <input
                          type="number"
                          value={getVal(k, 'lowStockThreshold', Number(p.lowStockThreshold))}
                          onChange={(e) => setVal(k, 'lowStockThreshold', Number(e.target.value))}
                          className="w-16 rounded border border-slate-700 bg-slate-950 px-2 py-1 text-white"
                        />
                      </td>
                      <td className="p-3">
                        <button
                          type="button"
                          disabled={acting}
                          onClick={() =>
                            void dispatch(
                              adminUpdateProduct({
                                itemId: p.id,
                                unitWholesaleBuy: getVal(
                                  k,
                                  'unitWholesaleBuy',
                                  Number(p.unitWholesaleBuy)
                                ),
                                unitWholesaleSell: getVal(
                                  k,
                                  'unitWholesaleSell',
                                  Number(p.unitWholesaleSell)
                                ),
                                lowStockThreshold: getVal(
                                  k,
                                  'lowStockThreshold',
                                  Number(p.lowStockThreshold)
                                ),
                              })
                            )
                          }
                          className="inline-flex items-center gap-1 rounded-lg bg-amber-500 px-2.5 py-1 font-bold text-slate-950"
                        >
                          <Save className="h-3 w-3" /> Save
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {config && tab === 'locations' && (
          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="p-3">District</th>
                  <th className="p-3">Demand Mult</th>
                  <th className="p-3">Rent Mult</th>
                  <th className="p-3">Elasticity</th>
                  <th className="p-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {config.locations.map((loc) => {
                  const k = `loc_${loc.id}`;
                  return (
                    <tr key={loc.id}>
                      <td className="p-3 font-bold text-white">
                        {loc.name}{' '}
                        <span className="text-[10px] text-slate-400">({loc.districtType})</span>
                      </td>
                      <td className="p-3">
                        <input
                          type="number"
                          step="0.05"
                          value={getVal(k, 'demandMultiplier', Number(loc.demandMultiplier))}
                          onChange={(e) => setVal(k, 'demandMultiplier', Number(e.target.value))}
                          className="w-20 rounded border border-slate-700 bg-slate-950 px-2 py-1 text-white"
                        />
                      </td>
                      <td className="p-3">
                        <input
                          type="number"
                          step="0.05"
                          value={getVal(k, 'rentMultiplier', Number(loc.rentMultiplier))}
                          onChange={(e) => setVal(k, 'rentMultiplier', Number(e.target.value))}
                          className="w-20 rounded border border-slate-700 bg-slate-950 px-2 py-1 text-white"
                        />
                      </td>
                      <td className="p-3">
                        <input
                          type="number"
                          step="0.05"
                          value={getVal(k, 'priceElasticity', Number(loc.priceElasticity))}
                          onChange={(e) => setVal(k, 'priceElasticity', Number(e.target.value))}
                          className="w-20 rounded border border-slate-700 bg-slate-950 px-2 py-1 text-white"
                        />
                      </td>
                      <td className="p-3">
                        <button
                          type="button"
                          disabled={acting}
                          onClick={() =>
                            void dispatch(
                              adminUpdateLocation({
                                locationId: loc.id,
                                demandMultiplier: getVal(
                                  k,
                                  'demandMultiplier',
                                  Number(loc.demandMultiplier)
                                ),
                                rentMultiplier: getVal(
                                  k,
                                  'rentMultiplier',
                                  Number(loc.rentMultiplier)
                                ),
                                priceElasticity: getVal(
                                  k,
                                  'priceElasticity',
                                  Number(loc.priceElasticity)
                                ),
                              })
                            )
                          }
                          className="inline-flex items-center gap-1 rounded-lg bg-amber-500 px-2.5 py-1 font-bold text-slate-950"
                        >
                          <Save className="h-3 w-3" /> Save
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {config && tab === 'upgrades' && (
          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="p-3">Upgrade</th>
                  <th className="p-3">Base Cost</th>
                  <th className="p-3">Cost Mult</th>
                  <th className="p-3">Effect</th>
                  <th className="p-3">Max Lv</th>
                  <th className="p-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {config.upgrades.map((u) => {
                  const k = `upg_${u.id}`;
                  return (
                    <tr key={u.id}>
                      <td className="p-3">
                        <p className="font-bold text-white">{u.name}</p>
                        <p className="text-[10px] text-slate-400">{u.category}</p>
                      </td>
                      <td className="p-3">
                        <input
                          type="number"
                          value={getVal(k, 'baseCost', Number(u.baseCost))}
                          onChange={(e) => setVal(k, 'baseCost', Number(e.target.value))}
                          className="w-24 rounded border border-slate-700 bg-slate-950 px-2 py-1 text-white"
                        />
                      </td>
                      <td className="p-3">
                        <input
                          type="number"
                          step="0.05"
                          value={getVal(k, 'costMultiplier', Number(u.costMultiplier))}
                          onChange={(e) => setVal(k, 'costMultiplier', Number(e.target.value))}
                          className="w-20 rounded border border-slate-700 bg-slate-950 px-2 py-1 text-white"
                        />
                      </td>
                      <td className="p-3">
                        <input
                          type="number"
                          step="0.02"
                          value={getVal(k, 'effectValue', Number(u.effectValue))}
                          onChange={(e) => setVal(k, 'effectValue', Number(e.target.value))}
                          className="w-20 rounded border border-slate-700 bg-slate-950 px-2 py-1 text-emerald-400"
                        />
                      </td>
                      <td className="p-3">
                        <input
                          type="number"
                          value={getVal(k, 'maxLevel', Number(u.maxLevel))}
                          onChange={(e) => setVal(k, 'maxLevel', Number(e.target.value))}
                          className="w-16 rounded border border-slate-700 bg-slate-950 px-2 py-1 text-white"
                        />
                      </td>
                      <td className="p-3">
                        <button
                          type="button"
                          disabled={acting}
                          onClick={() =>
                            void dispatch(
                              adminUpdateUpgrade({
                                upgradeId: u.id,
                                baseCost: getVal(k, 'baseCost', Number(u.baseCost)),
                                costMultiplier: getVal(
                                  k,
                                  'costMultiplier',
                                  Number(u.costMultiplier)
                                ),
                                effectValue: getVal(k, 'effectValue', Number(u.effectValue)),
                                maxLevel: getVal(k, 'maxLevel', Number(u.maxLevel)),
                                isActive: Boolean(u.isActive),
                              })
                            )
                          }
                          className="inline-flex items-center gap-1 rounded-lg bg-amber-500 px-2.5 py-1 font-bold text-slate-950"
                        >
                          <Save className="h-3 w-3" /> Save
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
