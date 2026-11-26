import { AxiosError } from 'axios';
import {
  Award,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  Coins,
  Gauge,
  RefreshCw,
  Search,
  Smile,
  TrendingUp,
  UserMinus,
  UserPlus,
  Users,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { GameLayout } from '@/components/GameLayout';
import { SectionCard } from '@/components/ui/SectionCard';
import { StatCard } from '@/components/ui/StatCard';
import {
  clearEmployeeError,
  fetchEmployees,
  refreshCandidates,
  setEmployeeError,
} from '@/features/employees/employeeSlice';
import { useAppDispatch, useAppSelector } from '@/hooks/redux';
import { employeeService } from '@/services/employeeService';
import { CandidateDTO, EmployeeDepartment, EmployeeDTO } from '@/types/employee.types';

const ALL_DEPARTMENTS: EmployeeDepartment[] = [
  'FARMING',
  'PRODUCTION',
  'RESTAURANT',
  'DELIVERY',
  'RETAIL',
  'LOGISTICS',
  'MANAGEMENT',
  'CORPORATE',
];

export function EmployeesPage() {
  const dispatch = useAppDispatch();
  const { data, candidates, loading, error } = useAppSelector((state) => state.employees);

  const [tab, setTab] = useState<'DIRECTORY' | 'RECRUIT' | 'DEPARTMENTS'>('DIRECTORY');
  const [page, setPage] = useState(1);
  const [department, setDepartment] = useState<EmployeeDepartment | ''>('');
  const [search, setSearch] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeDTO | null>(null);
  const [assignBizId, setAssignBizId] = useState<number>(0);
  const [salaryInput, setSalaryInput] = useState<number>(15);
  const [acting, setActing] = useState(false);

  const reload = async (targetPage = page) => {
    await dispatch(
      fetchEmployees({
        page: targetPage,
        limit: 15,
        department,
        search: search.trim() || undefined,
      })
    );
  };

  useEffect(() => {
    void reload(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, department]);

  useEffect(() => {
    if (data && data.businesses.length > 0 && assignBizId === 0) {
      setAssignBizId(data.businesses[0]!.id);
    }
  }, [data, assignBizId]);

  const runAction = async (fn: () => Promise<void>) => {
    setActing(true);
    dispatch(clearEmployeeError());
    try {
      await fn();
      await reload(page);
    } catch (err) {
      const msg =
        err instanceof AxiosError
          ? ((err.response?.data as { error?: { message?: string } } | undefined)?.error?.message ??
            err.message)
          : 'Action failed';
      dispatch(setEmployeeError(msg));
    } finally {
      setActing(false);
    }
  };

  if (loading && !data) {
    return (
      <GameLayout>
        <div className="h-64 animate-pulse rounded-2xl border border-[#49352A]/10 bg-white/70" />
      </GameLayout>
    );
  }

  if (!data) return null;

  return (
    <GameLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold text-[#49352A]">HR & Workforce Management</h1>
            <p className="text-sm text-[#49352A]/70">
              Manage up to 500 employees across 8 departments, assignments, training, and payroll
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={acting}
              onClick={() =>
                void runAction(async () => {
                  await employeeService.runPayroll();
                })
              }
              className="inline-flex items-center gap-2 rounded-xl bg-[#F28C38] px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#df7c2b]"
            >
              <Coins className="h-3.5 w-3.5" />
              Run Payroll (${data.summary.totalHourlyPayroll.toFixed(2)})
            </button>
            <button
              type="button"
              onClick={() => void reload(page)}
              className="inline-flex items-center gap-2 rounded-xl bg-[#49352A] px-4 py-2 text-xs font-bold text-[#FFF7E8]"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {error && (
          <div className="flex items-center justify-between rounded-xl border border-[#E94B35]/40 bg-[#E94B35]/10 px-4 py-3 text-sm text-[#E94B35]">
            <span>{error}</span>
            <button
              type="button"
              onClick={() => dispatch(clearEmployeeError())}
              className="text-xs font-bold underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* KPI Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Active Workforce"
            value={`${data.summary.activeCount} / ${data.summary.maxGlobalCap}`}
            subtitle="500-employee global limit"
            icon={Users}
            accentColor="orange"
          />
          <StatCard
            label="Hourly Payroll"
            value={`$${data.summary.totalHourlyPayroll.toFixed(2)}`}
            subtitle={`Cash: $${data.summary.cashBalance.toFixed(2)}`}
            icon={Coins}
            accentColor="red"
          />
          <StatCard
            label="Avg Happiness"
            value={`${data.summary.avgHappiness}%`}
            subtitle="< 20% causes strikes"
            icon={Smile}
            accentColor="green"
          />
          <StatCard
            label="Avg Productivity"
            value={`${data.summary.avgProductivity}x`}
            subtitle="Combined skill & morale"
            icon={Gauge}
            accentColor="yellow"
          />
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2">
          {(
            [
              { key: 'DIRECTORY', label: 'Employee Directory & Assignments' },
              { key: 'RECRUIT', label: 'Recruitment Pool' },
              { key: 'DEPARTMENTS', label: 'Departments & Salary Reports' },
            ] as const
          ).map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
                tab === t.key
                  ? 'bg-[#E94B35] text-white shadow-sm'
                  : 'bg-white text-[#49352A] hover:bg-[#FFC857]/30'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'DIRECTORY' && (
          <div className="grid gap-6 lg:grid-cols-3">
            <div className={selectedEmployee ? 'lg:col-span-2' : 'lg:col-span-3'}>
              <SectionCard
                title={`Employee Directory (${data.pagination.total})`}
                subtitle="Paginated & indexed for 500+ staff performance"
              >
                <div className="mb-4 flex flex-wrap gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute top-2.5 left-3 h-4 w-4 text-[#49352A]/40" />
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          setPage(1);
                          void reload(1);
                        }
                      }}
                      placeholder="Search by name & press Enter..."
                      className="w-full rounded-xl border border-[#49352A]/15 bg-[#FFF7E8]/50 py-2 pr-3 pl-9 text-xs text-[#49352A]"
                    />
                  </div>
                  <select
                    value={department}
                    onChange={(e) => {
                      setDepartment(e.target.value as EmployeeDepartment | '');
                      setPage(1);
                    }}
                    className="rounded-xl border border-[#49352A]/15 bg-[#FFF7E8]/50 px-3 py-2 text-xs font-bold text-[#49352A]"
                  >
                    <option value="">All Departments</option>
                    {ALL_DEPARTMENTS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                {data.employees.length === 0 ? (
                  <p className="py-10 text-center text-sm text-[#49352A]/60">
                    No employees found. Visit the Recruitment Pool tab to hire staff!
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-[#49352A]/10 text-[#49352A]/60 uppercase">
                          <th className="py-2 pr-3">Name</th>
                          <th className="py-2 pr-3">Dept / Role</th>
                          <th className="py-2 pr-3">Assigned</th>
                          <th className="py-2 pr-3">Skill / Prod</th>
                          <th className="py-2 pr-3">Happy</th>
                          <th className="py-2 text-right">Wage/hr</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#49352A]/10">
                        {data.employees.map((emp) => (
                          <tr
                            key={emp.id}
                            onClick={() => {
                              setSelectedEmployee(emp);
                              setSalaryInput(emp.hourlyWage);
                              if (emp.assignedBusinessId) setAssignBizId(emp.assignedBusinessId);
                            }}
                            className={`cursor-pointer transition hover:bg-[#FFF7E8] ${
                              selectedEmployee?.id === emp.id ? 'bg-[#FFC857]/20' : ''
                            }`}
                          >
                            <td className="py-2.5 pr-3 font-bold text-[#49352A]">{emp.fullName}</td>
                            <td className="py-2.5 pr-3">
                              <span className="font-semibold text-[#F28C38]">{emp.department}</span>{' '}
                              · {emp.role}
                            </td>
                            <td className="py-2.5 pr-3 text-[#49352A]/75">
                              {emp.assignedBusinessName ?? 'Unassigned'}
                            </td>
                            <td className="py-2.5 pr-3">
                              Lv {emp.skillLevel} ({emp.productivity}x)
                            </td>
                            <td className="py-2.5 pr-3 font-bold">{emp.happiness}%</td>
                            <td className="py-2.5 text-right font-bold text-[#58A66A]">
                              ${emp.hourlyWage.toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <div className="mt-4 flex items-center justify-between text-xs text-[#49352A]/70">
                  <span>
                    Page {data.pagination.page} of {data.pagination.totalPages}
                  </span>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      className="rounded-lg border border-[#49352A]/15 p-1.5 disabled:opacity-40"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      disabled={page >= data.pagination.totalPages}
                      onClick={() => setPage((p) => p + 1)}
                      className="rounded-lg border border-[#49352A]/15 p-1.5 disabled:opacity-40"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </SectionCard>
            </div>

            {selectedEmployee && (
              <SectionCard
                title={selectedEmployee.fullName}
                subtitle={`ID #${selectedEmployee.id} · ${selectedEmployee.role} (${selectedEmployee.employmentStatus})`}
              >
                <div className="space-y-4 text-xs">
                  <div className="grid grid-cols-2 gap-2 rounded-xl bg-[#FFF7E8] p-3">
                    <div>
                      <span className="text-[#49352A]/60">Skill Level</span>
                      <p className="font-bold text-[#49352A]">
                        Lv {selectedEmployee.skillLevel}/10
                      </p>
                    </div>
                    <div>
                      <span className="text-[#49352A]/60">Experience</span>
                      <p className="font-bold text-[#49352A]">{selectedEmployee.experience} XP</p>
                    </div>
                    <div>
                      <span className="text-[#49352A]/60">Productivity</span>
                      <p className="font-bold text-[#58A66A]">{selectedEmployee.productivity}x</p>
                    </div>
                    <div>
                      <span className="text-[#49352A]/60">Happiness</span>
                      <p className="font-bold text-[#49352A]">{selectedEmployee.happiness}%</p>
                    </div>
                  </div>

                  {/* Business Assignment */}
                  <div>
                    <label className="mb-1 block font-bold text-[#49352A]">
                      Assign to Business
                    </label>
                    <div className="flex gap-2">
                      <select
                        value={assignBizId}
                        onChange={(e) => setAssignBizId(Number(e.target.value))}
                        className="flex-1 rounded-lg border border-[#49352A]/20 bg-white px-2 py-1.5 text-xs"
                      >
                        {data.businesses.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.name} ({b.assignedCount}/{b.maxEmployees})
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        disabled={acting || assignBizId === 0}
                        onClick={() =>
                          void runAction(() =>
                            employeeService.assign(selectedEmployee.id, assignBizId)
                          )
                        }
                        className="inline-flex items-center gap-1 rounded-lg bg-[#49352A] px-3 py-1.5 font-bold text-white"
                      >
                        <Briefcase className="h-3.5 w-3.5" />
                        Assign
                      </button>
                    </div>
                  </div>

                  {/* Salary Adjustment */}
                  <div>
                    <label className="mb-1 block font-bold text-[#49352A]">
                      Adjust Hourly Wage ($)
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        min={1}
                        step="1"
                        value={salaryInput}
                        onChange={(e) => setSalaryInput(Number(e.target.value))}
                        className="flex-1 rounded-lg border border-[#49352A]/20 bg-white px-2.5 py-1.5 text-xs"
                      />
                      <button
                        type="button"
                        disabled={acting || salaryInput <= 0}
                        onClick={() =>
                          void runAction(() =>
                            employeeService.updateSalary(selectedEmployee.id, salaryInput)
                          )
                        }
                        className="rounded-lg bg-[#58A66A] px-3 py-1.5 font-bold text-white"
                      >
                        Update
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-2">
                    <button
                      type="button"
                      disabled={acting || selectedEmployee.skillLevel >= 10}
                      onClick={() =>
                        void runAction(() => employeeService.train(selectedEmployee.id))
                      }
                      className="inline-flex flex-1 items-center justify-center gap-1 rounded-xl bg-[#F28C38] py-2 font-bold text-white disabled:opacity-40"
                    >
                      <TrendingUp className="h-3.5 w-3.5" />
                      Train (+1 Skill)
                    </button>

                    {selectedEmployee.canPromoteTo && (
                      <button
                        type="button"
                        disabled={acting}
                        onClick={() =>
                          void runAction(() => employeeService.promote(selectedEmployee.id))
                        }
                        className="inline-flex flex-1 items-center justify-center gap-1 rounded-xl bg-[#FFC857] py-2 font-bold text-[#49352A]"
                      >
                        <Award className="h-3.5 w-3.5" />
                        Promote ({selectedEmployee.canPromoteTo})
                      </button>
                    )}
                  </div>

                  <button
                    type="button"
                    disabled={acting}
                    onClick={() =>
                      void runAction(async () => {
                        await employeeService.fire(selectedEmployee.id);
                        setSelectedEmployee(null);
                      })
                    }
                    className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-[#E94B35]/30 py-2 font-bold text-[#E94B35] hover:bg-[#E94B35]/10"
                  >
                    <UserMinus className="h-3.5 w-3.5" />
                    Terminate Employee
                  </button>
                </div>
              </SectionCard>
            )}
          </div>
        )}

        {tab === 'RECRUIT' && (
          <SectionCard
            title="Recruitment Market"
            subtitle="Hire candidates and assign them to an operational business"
            action={
              <button
                type="button"
                onClick={() => void dispatch(refreshCandidates())}
                className="rounded-xl bg-[#49352A] px-3 py-1.5 text-xs font-bold text-[#FFF7E8]"
              >
                Refresh Candidates
              </button>
            }
          >
            <div className="mb-4 flex items-center gap-3">
              <label className="text-xs font-bold text-[#49352A]">Assign New Hires To:</label>
              <select
                value={assignBizId}
                onChange={(e) => setAssignBizId(Number(e.target.value))}
                className="rounded-xl border border-[#49352A]/20 bg-[#FFF7E8] px-3 py-1.5 text-xs font-bold text-[#49352A]"
              >
                {data.businesses.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.assignedCount}/{b.maxEmployees})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {candidates.map((c: CandidateDTO) => (
                <div
                  key={c.tempId}
                  className="rounded-xl border border-[#49352A]/10 bg-[#FFF7E8]/60 p-4"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-bold text-[#49352A]">{c.fullName}</p>
                      <p className="text-xs font-semibold text-[#F28C38]">
                        {c.department} · {c.role}
                      </p>
                    </div>
                    <span className="rounded-full bg-[#FFC857]/35 px-2 py-0.5 text-[11px] font-bold text-[#49352A]">
                      Skill Lv {c.skillLevel}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-[#49352A]/75">
                    Wage: ${c.hourlyWage}/hr · Signing Fee: ${c.hiringFee}
                  </p>
                  <button
                    type="button"
                    disabled={acting || data.summary.activeCount >= data.summary.maxGlobalCap}
                    onClick={() =>
                      void runAction(() =>
                        employeeService.hire({
                          fullName: c.fullName,
                          department: c.department,
                          role: c.role,
                          skillLevel: c.skillLevel,
                          hourlyWage: c.hourlyWage,
                          businessId: assignBizId || undefined,
                        })
                      )
                    }
                    className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl bg-[#58A66A] py-2 text-xs font-bold text-white hover:bg-[#498f59] disabled:opacity-40"
                  >
                    <UserPlus className="h-3.5 w-3.5" />
                    Hire (${c.hiringFee})
                  </button>
                </div>
              ))}
            </div>
          </SectionCard>
        )}

        {tab === 'DEPARTMENTS' && (
          <div className="grid gap-6 lg:grid-cols-2">
            <SectionCard title="Payroll by Department" subtitle="Hourly labor cost distribution">
              {data.departmentStats.length === 0 ? (
                <p className="py-12 text-center text-xs text-[#49352A]/60">
                  Hire employees to generate department salary analytics.
                </p>
              ) : (
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.departmentStats}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#49352A1A" />
                      <XAxis dataKey="department" fontSize={11} stroke="#49352A" />
                      <YAxis fontSize={11} stroke="#49352A" />
                      <Tooltip />
                      <Bar dataKey="totalHourlyPayroll" fill="#E94B35" name="Hourly Payroll ($)" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </SectionCard>

            <SectionCard title="Department Breakdown" subtitle="Headcount, skill, and morale">
              <div className="space-y-2.5">
                {ALL_DEPARTMENTS.map((dept) => {
                  const st = data.departmentStats.find((d) => d.department === dept);
                  return (
                    <div
                      key={dept}
                      className="flex items-center justify-between rounded-xl border border-[#49352A]/10 bg-[#FFF7E8]/50 px-3.5 py-2.5 text-xs"
                    >
                      <div>
                        <p className="font-bold text-[#49352A]">{dept}</p>
                        <p className="text-[#49352A]/65">
                          Staff: {st?.headcount ?? 0} · Avg Skill: {st?.avgSkill ?? 0} · Happy:{' '}
                          {st?.avgHappiness ?? 0}%
                        </p>
                      </div>
                      <span className="font-extrabold text-[#58A66A]">
                        ${(st?.totalHourlyPayroll ?? 0).toFixed(2)}/hr
                      </span>
                    </div>
                  );
                })}
              </div>
            </SectionCard>
          </div>
        )}
      </div>
    </GameLayout>
  );
}
