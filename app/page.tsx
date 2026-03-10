'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Calendar, Activity } from 'lucide-react';

// ── Types ──────────────────────────────────────────────
interface KilnData {
    id: string;
    code: string;
    active: boolean;
    startDate: string;
    endDate: string;
}

interface KilnCalc {
    id: string;
    code: string;
    start: Date;
    end: Date;
}

// ── Helpers ────────────────────────────────────────────
function parseDate(dateString: string): Date | null {
    if (!dateString) return null;
    const [year, month, day] = dateString.split('-');
    return new Date(Number(year), Number(month) - 1, Number(day));
}

function daysBetween(d1: Date, d2: Date): number {
    return Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
}

function formatDateShort(date: Date): string {
    return date.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit' });
}

function formatDateFull(date: Date): string {
    return date.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatDayName(date: Date): string {
    const d = date.toLocaleDateString('es-PE', { weekday: 'short' });
    return d.charAt(0).toUpperCase() + d.slice(1).replace('.', '');
}

// ── GanttChart Component ───────────────────────────────
function GanttChart({ kilns }: { kilns: KilnCalc[] }) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let minDate = new Date(Math.min(...kilns.map(k => k.start.getTime())));
    let maxDate = new Date(Math.max(...kilns.map(k => k.end.getTime())));
    minDate.setDate(minDate.getDate() - 2);
    maxDate.setDate(maxDate.getDate() + 3);

    const totalDays = daysBetween(minDate, maxDate);

    // Grid lines + labels
    const gridItems: { left: number; label?: string; }[] = [];
    for (let i = 0; i <= totalDays; i++) {
        const d = new Date(minDate);
        d.setDate(d.getDate() + i);
        const left = (i / totalDays) * 100;
        const showLabel = i % 2 === 0 || d.getDate() === 1;
        gridItems.push({ left, label: showLabel ? `${d.getDate()}/${d.getMonth() + 1}` : undefined });
    }

    // Today line
    const todayInRange = today >= minDate && today <= maxDate;
    const todayPct = todayInRange ? (daysBetween(minDate, today) / totalDays) * 100 : 0;

    return (
        <div className="relative" style={{ minWidth: 750, marginTop: 55, borderLeft: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0' }}>
            {/* Grid */}
            <div className="absolute top-0 bottom-0 pointer-events-none" style={{ left: 80, right: 0, zIndex: 1 }}>
                {gridItems.map((g, i) => (
                    <React.Fragment key={i}>
                        <div className="absolute" style={{ left: `${g.left}%`, top: -20, bottom: 0, width: 1, background: '#f1f5f9' }} />
                        {g.label && (
                            <div className="absolute" style={{
                                left: `${g.left}%`, top: -25, transform: 'translateX(-50%)',
                                fontSize: 10, color: 'var(--color-timber-grey)', fontWeight: 500, whiteSpace: 'nowrap',
                            }}>
                                {g.label}
                            </div>
                        )}
                    </React.Fragment>
                ))}
            </div>

            {/* Rows */}
            {kilns.map(kiln => {
                const leftPct = (daysBetween(minDate, kiln.start) / totalDays) * 100;
                const widthPct = (daysBetween(kiln.start, kiln.end) / totalDays) * 100;
                const totalKilnDays = daysBetween(kiln.start, kiln.end);
                let passed = daysBetween(kiln.start, today);
                if (passed < 0) passed = 0;
                if (passed > totalKilnDays) passed = totalKilnDays;
                const remaining = totalKilnDays - passed;
                const pctPassed = (passed / totalKilnDays) * 100;
                const pctRemaining = 100 - pctPassed;

                return (
                    <div key={kiln.id} className="flex items-center relative" style={{ height: 76, borderBottom: '1px solid #f1f5f9', zIndex: 10 }}>
                        {/* Label */}
                        <div className="text-right font-bold" style={{ width: 80, paddingRight: 12, background: 'white', zIndex: 15, color: 'var(--color-brand)' }}>
                            {kiln.id}<br />
                            <span style={{ fontSize: '0.7em', fontWeight: 500, color: 'var(--color-timber-grey)' }}>{kiln.code}</span>
                        </div>
                        {/* Track */}
                        <div className="flex-1 relative h-full flex items-center">
                            {/* Start chip */}
                            <div className="absolute" style={{
                                left: `${leftPct}%`, top: '50%',
                                transform: 'translate(calc(-100% - 10px), -50%)',
                                fontSize: 11, fontWeight: 600, color: 'var(--color-timber-grey)',
                                background: 'white', border: '1px solid #e2e8f0',
                                padding: '4px 10px', borderRadius: 'var(--radius-pill)', whiteSpace: 'nowrap', zIndex: 12,
                            }}>
                                {formatDayName(kiln.start)} {formatDateShort(kiln.start)}
                            </div>

                            {/* Bar */}
                            <div className="absolute flex" style={{
                                left: `${leftPct}%`, width: `${widthPct}%`, height: 34,
                                borderRadius: 8, overflow: 'visible', boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                            }}>
                                {pctPassed > 0 && (
                                    <div className="flex items-center justify-center" style={{
                                        width: `${pctPassed}%`, height: '100%',
                                        background: 'rgba(5,123,87,0.15)',
                                        borderRight: '1px dashed rgba(0,0,0,0.15)',
                                        borderRadius: '8px 0 0 8px',
                                        fontSize: 11, fontWeight: 600, color: 'var(--color-timber-dark)',
                                        whiteSpace: 'nowrap', overflow: 'hidden',
                                    }}>
                                        {pctPassed > 15 && `${passed} días (${Math.round(pctPassed)}%)`}
                                    </div>
                                )}
                                {pctRemaining > 0 && (
                                    <div className="flex items-center justify-center" style={{
                                        width: `${pctRemaining}%`, height: '100%',
                                        background: 'var(--color-brand)',
                                        borderRadius: '0 8px 8px 0',
                                        fontSize: 11, fontWeight: 600, color: 'white',
                                        whiteSpace: 'nowrap', overflow: 'hidden',
                                    }}>
                                        {pctRemaining > 15 && `${remaining} días (${Math.round(pctRemaining)}%)`}
                                    </div>
                                )}

                                {/* Exit chip */}
                                <div className="absolute" style={{
                                    right: -10, top: '50%', transform: 'translate(100%, -50%)',
                                    fontSize: 11, fontWeight: 600, color: 'var(--color-brand)',
                                    background: 'var(--color-brand-light)', border: '1px solid rgba(5,123,87,0.2)',
                                    padding: '4px 10px', borderRadius: 'var(--radius-pill)', whiteSpace: 'nowrap',
                                }}>
                                    {formatDayName(kiln.end)} {formatDateShort(kiln.end)}
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })}

            {/* Today line */}
            {todayInRange && (
                <div className="absolute pointer-events-none" style={{ top: 0, bottom: 0, left: 80, right: 0, zIndex: 100 }}>
                    <div className="absolute" style={{ left: `${todayPct}%`, top: -55, bottom: 0, width: 2, background: 'var(--color-danger)' }}>
                        <div className="absolute" style={{
                            top: 0, transform: 'translateX(-50%)',
                            background: 'var(--color-danger)', color: 'white',
                            padding: '3px 10px', borderRadius: 6,
                            fontSize: 10, fontWeight: 700, whiteSpace: 'nowrap', letterSpacing: 0.3,
                        }}>
                            Hoy
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ── Main Page ──────────────────────────────────────────
const INITIAL_KILNS: KilnData[] = [
    { id: 'H1', code: '08-2026', active: true, startDate: '2026-02-20', endDate: '2026-03-06' },
    { id: 'H2', code: '09-2026', active: true, startDate: '2026-02-25', endDate: '2026-03-11' },
    { id: 'H3', code: '07-2026', active: true, startDate: '2026-02-18', endDate: '2026-03-12' },
];

export default function HornosPage() {
    const [kilns, setKilns] = useState<KilnData[]>(INITIAL_KILNS);
    const [showGantt, setShowGantt] = useState(true);
    const [dateStr, setDateStr] = useState('');

    useEffect(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        setDateStr('Hoy: ' + formatDateFull(today));
    }, []);

    const updateKiln = useCallback((index: number, field: keyof KilnData, value: string | boolean) => {
        setKilns(prev => prev.map((k, i) => i === index ? { ...k, [field]: value } : k));
    }, []);

    const handleGenerate = useCallback(() => {
        setShowGantt(true);
    }, []);

    // Compute valid kilns for Gantt
    const validKilns: KilnCalc[] = kilns
        .filter(k => k.active)
        .map(k => {
            const start = parseDate(k.startDate);
            const end = parseDate(k.endDate);
            if (start && end && start <= end) return { id: k.id, code: k.code, start, end };
            return null;
        })
        .filter(Boolean) as KilnCalc[];

    return (
        <div className="flex h-dvh w-full overflow-hidden" style={{ background: 'var(--color-surface-app)' }}>

            {/* ── SIDEBAR (desktop) ── */}
            <aside className="hidden md:flex flex-col w-[220px] shrink-0 bg-white border-r border-gray-100"
                style={{ boxShadow: 'var(--shadow-sidebar)' }}>
                <div className="px-5 py-5 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <img src="/images/logo-fq.png" alt="FQ Logo" className="w-10 h-10 rounded-full object-contain" style={{ background: 'transparent' }} />
                        <div>
                            <p className="text-[10px] font-extrabold uppercase tracking-widest leading-none"
                                style={{ color: 'var(--color-brand)' }}>CUMARU</p>
                            <p className="text-[11px] font-medium mt-1" style={{ color: 'var(--color-timber-grey)' }}>
                                Control de Hornos de Secado
                            </p>
                        </div>
                    </div>
                </div>
                <nav className="flex-1 py-3 px-2 overflow-y-auto">
                    <p className="text-[10px] font-bold uppercase tracking-widest px-3 mb-2"
                        style={{ color: 'var(--color-timber-grey)' }}>Estado</p>
                    <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-semibold"
                        style={{ background: 'var(--color-brand-light)', color: 'var(--color-brand)' }}>
                        <Calendar size={14} />
                        <span>{dateStr}</span>
                    </div>
                </nav>
                <div className="p-4 border-t border-gray-100">
                    <button onClick={handleGenerate}
                        className="w-full flex items-center justify-center gap-2 text-white text-[13px] font-bold py-3 rounded-xl transition-all cursor-pointer border-none active:scale-[0.97]"
                        style={{ background: 'var(--color-brand)', boxShadow: 'var(--shadow-fab)' }}>
                        <Activity size={16} />
                        Generar Gráfico
                    </button>
                </div>
            </aside>

            {/* ── MAIN COLUMN ── */}
            <div className="flex flex-col flex-1 min-w-0">

                {/* Mobile header */}
                <header className="md:hidden text-white px-4 py-3 flex items-center gap-3 shrink-0"
                    style={{ background: 'var(--color-brand)', boxShadow: 'var(--shadow-header)' }}>
                    <img src="/images/logo-fq.png" alt="FQ" className="w-8 h-8 rounded-full object-contain shrink-0" style={{ background: 'white' }} />
                    <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-bold opacity-80 uppercase tracking-widest leading-none">CUMARU</p>
                        <p className="text-[15px] font-bold leading-tight">Control de Hornos</p>
                    </div>
                </header>

                {/* Desktop topbar */}
                <div className="hidden md:flex items-center px-6 py-3.5 border-b border-gray-100 bg-white gap-4 shrink-0 min-h-[64px]">
                    <div className="flex-1 min-w-0">
                        <h1 className="text-[18px] font-extrabold tracking-tight" style={{ color: 'var(--color-timber-dark)' }}>
                            Estado de Hornos
                        </h1>
                        <p className="text-[11px] font-medium" style={{ color: 'var(--color-timber-grey)' }}>
                            Programación y seguimiento de secado en hornos
                        </p>
                    </div>
                    <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border text-[11px] font-semibold whitespace-nowrap"
                        style={{ borderColor: 'var(--color-brand)', color: 'var(--color-brand)' }}>
                        📅 {dateStr}
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden p-5 md:p-6">

                    {/* Form Card */}
                    <div className="bg-white rounded-card mb-5 overflow-hidden"
                        style={{ boxShadow: 'var(--shadow-card)', animation: 'var(--animate-fade-in)' }}>
                        <div className="px-5 py-4 border-b border-gray-100">
                            <h2 className="text-[15px] font-bold m-0">Configuración de Hornos</h2>
                            <p className="text-[11px] font-medium mt-0.5" style={{ color: 'var(--color-timber-grey)' }}>
                                Ingrese las fechas de cada horno activo
                            </p>
                        </div>
                        <div className="p-5">
                            {/* Desktop table */}
                            <div className="hidden md:block">
                                <table className="w-full border-collapse">
                                    <thead>
                                        <tr>
                                            <th className="text-left pb-2.5 px-2 text-[10px] font-bold uppercase tracking-wider border-b border-gray-100"
                                                style={{ color: 'var(--color-timber-grey)', width: 50, textAlign: 'center' }}>Activo</th>
                                            <th className="text-left pb-2.5 px-2 text-[10px] font-bold uppercase tracking-wider border-b border-gray-100"
                                                style={{ color: 'var(--color-timber-grey)', width: 60 }}>Horno</th>
                                            <th className="text-left pb-2.5 px-2 text-[10px] font-bold uppercase tracking-wider border-b border-gray-100"
                                                style={{ color: 'var(--color-timber-grey)' }}>Código Secado</th>
                                            <th className="text-left pb-2.5 px-2 text-[10px] font-bold uppercase tracking-wider border-b border-gray-100"
                                                style={{ color: 'var(--color-timber-grey)' }}>Fecha Ingreso</th>
                                            <th className="text-left pb-2.5 px-2 text-[10px] font-bold uppercase tracking-wider border-b border-gray-100"
                                                style={{ color: 'var(--color-timber-grey)' }}>Fecha Fin Programada</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {kilns.map((k, i) => (
                                            <tr key={k.id}>
                                                <td className="py-2.5 px-2 border-b border-gray-50 text-center align-middle">
                                                    <input type="checkbox" checked={k.active}
                                                        onChange={e => updateKiln(i, 'active', e.target.checked)}
                                                        className="w-[18px] h-[18px] rounded cursor-pointer"
                                                        style={{ accentColor: 'var(--color-brand)' }} />
                                                </td>
                                                <td className="py-2.5 px-2 border-b border-gray-50 align-middle">
                                                    <span className="font-bold text-[14px]" style={{ color: 'var(--color-brand)' }}>{k.id}</span>
                                                </td>
                                                <td className="py-2.5 px-2 border-b border-gray-50 align-middle">
                                                    <input type="text" value={k.code}
                                                        onChange={e => updateKiln(i, 'code', e.target.value)}
                                                        className="w-full py-2 px-3 border border-gray-200 rounded-xl text-[13px] outline-none focus:border-brand focus:ring-2 focus:ring-brand/10 transition-all" />
                                                </td>
                                                <td className="py-2.5 px-2 border-b border-gray-50 align-middle">
                                                    <input type="date" value={k.startDate}
                                                        onChange={e => updateKiln(i, 'startDate', e.target.value)}
                                                        className="w-full py-2 px-3 border border-gray-200 rounded-xl text-[13px] outline-none focus:border-brand focus:ring-2 focus:ring-brand/10 transition-all" />
                                                </td>
                                                <td className="py-2.5 px-2 border-b border-gray-50 align-middle">
                                                    <input type="date" value={k.endDate}
                                                        onChange={e => updateKiln(i, 'endDate', e.target.value)}
                                                        className="w-full py-2 px-3 border border-gray-200 rounded-xl text-[13px] outline-none focus:border-brand focus:ring-2 focus:ring-brand/10 transition-all" />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Mobile stacked form */}
                            <div className="md:hidden">
                                {kilns.map((k, i) => (
                                    <div key={k.id} className="flex items-start gap-3 py-3.5 border-b border-gray-100 last:border-0">
                                        <div className="w-11 h-11 rounded-xl flex items-center justify-center font-extrabold text-[14px] shrink-0"
                                            style={{ background: k.active ? 'var(--color-brand-light)' : '#f1f5f9', color: k.active ? 'var(--color-brand)' : '#9ca3af' }}>
                                            {k.id}
                                        </div>
                                        <div className="flex-1 min-w-0 grid grid-cols-2 gap-2">
                                            <div className="col-span-2">
                                                <div className="text-[10px] font-semibold uppercase tracking-wide mb-0.5"
                                                    style={{ color: 'var(--color-timber-grey)' }}>Código</div>
                                                <input type="text" value={k.code}
                                                    onChange={e => updateKiln(i, 'code', e.target.value)}
                                                    className="w-full py-2 px-3 border border-gray-200 rounded-xl text-[13px] outline-none focus:border-brand transition-all" />
                                            </div>
                                            <div>
                                                <div className="text-[10px] font-semibold uppercase tracking-wide mb-0.5"
                                                    style={{ color: 'var(--color-timber-grey)' }}>Ingreso</div>
                                                <input type="date" value={k.startDate}
                                                    onChange={e => updateKiln(i, 'startDate', e.target.value)}
                                                    className="w-full py-2 px-3 border border-gray-200 rounded-xl text-[13px] outline-none focus:border-brand transition-all" />
                                            </div>
                                            <div>
                                                <div className="text-[10px] font-semibold uppercase tracking-wide mb-0.5"
                                                    style={{ color: 'var(--color-timber-grey)' }}>Fin Prog.</div>
                                                <input type="date" value={k.endDate}
                                                    onChange={e => updateKiln(i, 'endDate', e.target.value)}
                                                    className="w-full py-2 px-3 border border-gray-200 rounded-xl text-[13px] outline-none focus:border-brand transition-all" />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                <button onClick={handleGenerate}
                                    className="w-full mt-2 py-3.5 text-white text-[14px] font-bold rounded-xl border-none cursor-pointer active:scale-[0.97] transition-all"
                                    style={{ background: 'var(--color-brand)', boxShadow: 'var(--shadow-fab)' }}>
                                    Generar Gráfico
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Gantt Card */}
                    {showGantt && validKilns.length > 0 && (
                        <div className="bg-white rounded-card mb-5 overflow-hidden"
                            style={{ boxShadow: 'var(--shadow-card)', animation: 'var(--animate-fade-in)' }}>
                            <div className="px-5 py-4 border-b border-gray-100">
                                <h2 className="text-[15px] font-bold m-0">Diagrama Gantt</h2>
                                <p className="text-[11px] font-medium mt-0.5" style={{ color: 'var(--color-timber-grey)' }}>
                                    Línea roja = Hoy · Barra tenue = días transcurridos · Barra sólida = días restantes
                                </p>
                            </div>
                            <div className="p-5 overflow-x-auto">
                                <GanttChart kilns={validKilns} />
                            </div>
                        </div>
                    )}
                </div>

                {/* Mobile dock */}
                <div className="md:hidden flex items-center justify-center gap-2 bg-white/95 backdrop-blur-md border-t border-gray-200 px-4 py-2 shrink-0"
                    style={{ boxShadow: 'var(--shadow-dock)', paddingBottom: 'max(8px, env(safe-area-inset-bottom))' }}>
                    <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[11px] font-semibold"
                        style={{ background: 'var(--color-brand-light)', color: 'var(--color-brand)' }}>
                        <Calendar size={14} />
                        <span>{dateStr}</span>
                    </div>
                </div>

            </div>
        </div>
    );
}
