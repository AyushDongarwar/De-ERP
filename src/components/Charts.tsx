"use client";

import { useState, useEffect } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export function EarningChart({ data, width, height }: { data: any[], width?: string, height?: number }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    // Delay mounting slightly to allow flex/grid layout to stabilize
    const timer = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(timer);
  }, []);

  if (!mounted) return <div style={{ width: width || '100%', height: height || 300, minHeight: 300 }} />;

  return (
    <div style={{ 
      width: width || '100%', 
      height: height || 300, 
      minHeight: 300, 
      position: 'relative', 
      display: 'block' 
    }}>
      {/* 99% width is a known workaround for ResponsiveContainer measurement jitter */}
      <ResponsiveContainer width="99%" height="100%" debounce={100}>
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorEarnings" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272a" />
          <XAxis dataKey="name" stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} />
          <YAxis stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
          <Tooltip 
            contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px' }}
            itemStyle={{ color: '#f4f4f5' }}
          />
          <Area type="monotone" dataKey="savings" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorEarnings)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function OrgPerformanceChart({ data, width, height }: { data: any[], width?: string, height?: number }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(timer);
  }, []);

  if (!mounted) return <div style={{ width: width || '100%', height: height || 300, minHeight: 300 }} />;

  return (
    <div style={{ 
      width: width || '100%', 
      height: height || 300, 
      minHeight: 300, 
      position: 'relative', 
      display: 'block' 
    }}>
      <ResponsiveContainer width="99%" height="100%" debounce={100}>
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
             <linearGradient id="colorBot" x1="0" y1="0" x2="0" y2="1">
               <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.3}/>
               <stop offset="95%" stopColor="#22d3ee" stopOpacity={0}/>
             </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272a" />
          <XAxis dataKey="name" stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} />
          <YAxis stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
          <Tooltip 
            contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px' }}
            itemStyle={{ color: '#f4f4f5' }}
          />
          <Area type="monotone" dataKey="botRevenue" stroke="#22d3ee" strokeWidth={2} fillOpacity={1} fill="url(#colorBot)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function LivePulseChart({ baseValue }: { baseValue: number }) {
  const [data, setData] = useState<any[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Initialize with some data
    const initialData = Array.from({ length: 20 }, (_, i) => ({
      time: i,
      value: baseValue + (Math.random() - 0.5) * (baseValue * 0.05)
    }));
    setData(initialData);

    const interval = setInterval(() => {
      setData(prev => {
        const last = prev[prev.length - 1];
        const nextTime = last.time + 1;
        const nextValue = baseValue + (Math.random() - 0.5) * (baseValue * 0.05);
        return [...prev.slice(1), { time: nextTime, value: nextValue }];
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [baseValue]);

  if (!mounted) return <div className="h-[200px] w-full bg-secondary/20 animate-pulse rounded-xl" />;

  return (
    <div className="h-[200px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorPulse" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <Tooltip 
            contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px' }}
            itemStyle={{ color: '#10b981' }}
            labelStyle={{ display: 'none' }}
          />
          <Area 
            type="monotone" 
            dataKey="value" 
            stroke="#10b981" 
            strokeWidth={2} 
            fillOpacity={1} 
            fill="url(#colorPulse)" 
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
