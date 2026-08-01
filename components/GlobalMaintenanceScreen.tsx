'use client';

import React, { useEffect, useState } from 'react';
import { Settings, Clock, AlertTriangle } from 'lucide-react';
import { usePathname } from 'next/navigation';

interface MaintenanceEventDetail {
  message?: string;
  estimatedFinish?: string;
}

export default function GlobalMaintenanceScreen() {
  const [isMaintenance, setIsMaintenance] = useState(false);
  const [message, setMessage] = useState('Hệ thống đang được bảo trì để nâng cấp. Vui lòng quay lại sau.');
  const [estimatedFinish, setEstimatedFinish] = useState('');
  const pathname = usePathname();

  useEffect(() => {
    // Also fetch current public status in case the user refreshes the page during maintenance
    const fetchMaintenanceStatus = async () => {
      try {
        const res = await fetch('/api/settings/public');
        const data = await res.json();
        if (data?.data?.maintenanceMode) {
          setIsMaintenance(true);
        }
      } catch (error) {
        // Ignore
      }
    };
    fetchMaintenanceStatus();

    const handleMaintenance = (e: Event) => {
      const customEvent = e as CustomEvent<MaintenanceEventDetail>;
      setIsMaintenance(true);
      if (customEvent.detail?.message) {
        setMessage(customEvent.detail.message);
      }
      if (customEvent.detail?.estimatedFinish) {
        setEstimatedFinish(customEvent.detail.estimatedFinish);
      }
    };

    window.addEventListener('maintenanceMode', handleMaintenance);

    return () => {
      window.removeEventListener('maintenanceMode', handleMaintenance);
    };
  }, []);

  if (pathname?.startsWith('/admin') || pathname?.startsWith('/login')) {
    return null;
  }

  if (!isMaintenance) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-900 flex flex-col items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-blue-500/10 rounded-full blur-[120px]" />
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-purple-500/10 rounded-full blur-[120px]" />
      </div>

      <div className="relative bg-slate-800/80 backdrop-blur-xl border border-slate-700/50 p-8 md:p-12 rounded-3xl shadow-2xl max-w-2xl w-full text-center space-y-8">
        <div className="relative mx-auto w-24 h-24 mb-6">
          <div className="absolute inset-0 bg-blue-500/20 rounded-full animate-ping" />
          <div className="relative bg-slate-900 border border-slate-700 rounded-full w-full h-full flex items-center justify-center">
            <Settings className="w-12 h-12 text-blue-400 animate-[spin_4s_linear_infinite]" />
          </div>
        </div>

        <div className="space-y-4">
          <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
            Hệ Thống Đang Bảo Trì
          </h1>
          <p className="text-lg text-slate-300 max-w-lg mx-auto leading-relaxed">
            {message}
          </p>
        </div>

        {estimatedFinish && (
          <div className="inline-flex items-center gap-3 bg-slate-900/50 border border-slate-700 rounded-2xl py-4 px-6 mt-4">
            <Clock className="w-6 h-6 text-orange-400" />
            <div className="text-left">
              <div className="text-sm text-slate-400 font-medium uppercase tracking-wider">Thời gian dự kiến hoàn thành</div>
              <div className="text-xl font-semibold text-orange-400">{estimatedFinish}</div>
            </div>
          </div>
        )}

        <div className="pt-8 border-t border-slate-700/50">
          <div className="flex items-center justify-center gap-2 text-slate-400 text-sm">
            <AlertTriangle className="w-4 h-4" />
            <span>Vui lòng không tải lại trang liên tục. Hệ thống sẽ sớm hoạt động trở lại.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
