"use client";

import React, { useState, useEffect } from 'react';
import { TableAvailabilityStatus } from '@/lib/types/tableAvailability';
import reservationService from '@/lib/services/reservationService';
import { Modal, Button } from 'antd';
import { Clock, Users, MapPin, AlertTriangle, CheckCircle2, XCircle, HourglassIcon, RotateCcw } from 'lucide-react';
import dayjs from 'dayjs';

interface Props {
  restaurantId: string;
  time: string;
  numberOfGuests: number;
  onTableSelect: (tableIds: string[]) => void;
  onSwitchToAuto?: () => void; // New prop for switching to auto assignment
  selectedTableIds: string[];
}

export default function TableAvailabilitySelector({
  restaurantId,
  time,
  numberOfGuests,
  onTableSelect,
  onSwitchToAuto,
  selectedTableIds
}: Props) {
  const [tables, setTables] = useState<TableAvailabilityStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const [warningModal, setWarningModal] = useState<{
    visible: boolean;
    table: TableAvailabilityStatus | null;
    modalType: 'PARTIALLY_AVAILABLE' | 'PENDING_CHECKIN' | null;
  }>({ visible: false, table: null, modalType: null });

  const loadTables = async () => {
    try {
      setLoading(true);
      const data = await reservationService.getTablesAvailability({
        restaurantId,
        time,
        numberOfGuests
      });
      setTables(data);
    } catch (err) {
      console.error('Error loading tables:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (restaurantId && time && numberOfGuests) {
      loadTables();
    }
  }, [restaurantId, time, numberOfGuests]);

  const handleTableClick = (table: TableAvailabilityStatus) => {
    if (table.status === 'OCCUPIED') {
      return;
    }
    if (table.status === 'PARTIALLY_AVAILABLE') {
      setWarningModal({ visible: true, table, modalType: 'PARTIALLY_AVAILABLE' });
    } else if (table.status === 'PENDING_CHECKIN') {
      setWarningModal({ visible: true, table, modalType: 'PENDING_CHECKIN' });
    } else {
      toggleTableSelection(table.id);
    }
  };

  const toggleTableSelection = (tableId: string) => {
    const isSelected = selectedTableIds.includes(tableId);
    if (isSelected) {
      onTableSelect(selectedTableIds.filter(id => id !== tableId));
    } else {
      onTableSelect([...selectedTableIds, tableId]);
    }
  };

  const confirmPartialBooking = () => {
    if (warningModal.table) {
      toggleTableSelection(warningModal.table.id);
      setWarningModal({ visible: false, table: null, modalType: null });
    }
  };

  const handleSwitchToAuto = () => {
    if (onSwitchToAuto) {
      onSwitchToAuto();
      setWarningModal({ visible: false, table: null, modalType: null });
    }
  };

  const getTableStatusIcon = (status: string) => {
    switch (status) {
      case 'FULLY_AVAILABLE':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'PARTIALLY_AVAILABLE':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'PENDING_CHECKIN':
        return <HourglassIcon className="w-4 h-4 text-orange-500" />;
      case 'OCCUPIED':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getTableStatusColor = (status: string, isSelected: boolean) => {
    if (isSelected) return 'bg-amber-100 border-amber-500 text-amber-800';
    switch (status) {
      case 'FULLY_AVAILABLE':
        return 'bg-green-50 border-green-200 text-green-800 hover:bg-green-100';
      case 'PARTIALLY_AVAILABLE':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800 hover:bg-yellow-100';
      case 'PENDING_CHECKIN':
        return 'bg-orange-50 border-orange-200 text-orange-800 hover:bg-orange-100';
      case 'OCCUPIED':
        return 'bg-red-50 border-red-200 text-red-500 cursor-not-allowed opacity-60';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'FULLY_AVAILABLE': return 'Trống';
      case 'PARTIALLY_AVAILABLE': return 'Có giới hạn giờ';
      case 'PENDING_CHECKIN': return 'Chờ check-in';
      case 'OCCUPIED': return 'Đang sử dụng';
      default: return 'Không xác định';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Users className="w-4 h-4" />
          <span>{numberOfGuests} khách</span>
          <Clock className="w-4 h-4 ml-4" />
          <span>{dayjs(time).format('HH:mm DD/MM/YYYY')}</span>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 text-xs">
          <div className="flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-green-500" />
            <span>Trống hoàn toàn</span>
          </div>
          <div className="flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-yellow-500" />
            <span>Có giới hạn giờ</span>
          </div>
          <div className="flex items-center gap-1">
            <HourglassIcon className="w-3 h-3 text-orange-500" />
            <span>Chờ check-in</span>
          </div>
          <div className="flex items-center gap-1">
            <XCircle className="w-3 h-3 text-red-500" />
            <span>Đang sử dụng</span>
          </div>
        </div>

        {/* Tables Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {tables.map((table) => {
            const isSelected = selectedTableIds.includes(table.id);
            const canClick = table.status !== 'OCCUPIED';
            
            return (
              <div
                key={table.id}
                onClick={() => canClick && handleTableClick(table)}
                className={`p-3 rounded-lg border-2 transition-all ${getTableStatusColor(table.status, isSelected)} ${canClick ? 'cursor-pointer' : ''}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold">{table.code}</span>
                  {getTableStatusIcon(table.status)}
                </div>
                
                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    <span>{table.seatingCapacity} chỗ</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    <span>{table.floor}</span>
                  </div>
                  <div className="font-medium">
                    {getStatusText(table.status)}
                  </div>
                  
                  {table.status === 'PARTIALLY_AVAILABLE' && (
                    <div className="text-xs text-yellow-600 mt-1">
                      {table.usableUntil 
                        ? `Dùng đến ${dayjs(table.usableUntil).format('HH:mm')}`
                        : 'Có giới hạn giờ'
                      }
                    </div>
                  )}

                  {table.status === 'PENDING_CHECKIN' && table.pendingReservation && (
                    <div className="text-xs text-orange-600 mt-1">
                      Đặt {dayjs(table.pendingReservation.time).format('HH:mm')} chưa check-in
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {tables.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Không có bàn nào phù hợp</p>
          </div>
        )}
      </div>

      {/* Modal - PARTIALLY_AVAILABLE: đặt trùng giờ, cần trả bàn trước */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-500" />
            <span>Bàn đã được đặt trước</span>
          </div>
        }
        open={warningModal.visible && warningModal.modalType === 'PARTIALLY_AVAILABLE'}
        onCancel={() => setWarningModal({ visible: false, table: null, modalType: null })}
        footer={[
          <Button key="cancel" onClick={() => setWarningModal({ visible: false, table: null, modalType: null })}>
            Tự chọn bàn khác
          </Button>,
          <Button key="auto" danger onClick={handleSwitchToAuto}>
            Tự động xếp bàn
          </Button>,
          <Button key="confirm" type="primary" onClick={confirmPartialBooking}>
            Đồng ý trả bàn trước 30p
          </Button>,
        ]}
      >
        {warningModal.table && (
          <div className="space-y-3">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-gray-800 font-medium mb-2">
                Bàn <strong>{warningModal.table.code}</strong> đã có khách khác đặt trước trùng với khung giờ của bạn{' '}
                ({warningModal.table.nextReservation
                  ? dayjs(warningModal.table.nextReservation).format('HH:mm')
                  : 'N/A'}).
              </p>
              <p className="text-sm text-gray-700">
                Vì không thể chắc chắn thời gian khách trước trả bàn, bạn có muốn chuyển sang chế độ{' '}
                <strong className="text-amber-600">"Tự động xếp bàn"</strong> để nhà hàng chủ động bố trí bàn trống phù hợp khác?
              </p>
            </div>
            {warningModal.table.usableUntil && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  💡 Hoặc bạn cam kết trả bàn trước{' '}
                  <strong>{dayjs(warningModal.table.usableUntil).format('HH:mm')}</strong>{' '}
                  (trước 30 phút so với lượt đặt tiếp theo).
                </p>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Modal - PENDING_CHECKIN: đặt sau bàn chưa check-in */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <HourglassIcon className="w-5 h-5 text-orange-500" />
            <span>Bàn có lượt đặt chưa check-in</span>
          </div>
        }
        open={warningModal.visible && warningModal.modalType === 'PENDING_CHECKIN'}
        onCancel={() => setWarningModal({ visible: false, table: null, modalType: null })}
        footer={[
          <Button key="cancel" onClick={() => setWarningModal({ visible: false, table: null, modalType: null })}>
            Tự chọn bàn khác
          </Button>,
          <Button key="auto" danger onClick={handleSwitchToAuto}>
            Đợi có bàn
          </Button>,
          <Button key="wait" type="primary" onClick={confirmPartialBooking}>
            Đợi đến khi bàn trống
          </Button>,
        ]}
      >
        {warningModal.table && warningModal.table.pendingReservation && (
          <div className="space-y-3">
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <p className="text-sm text-gray-800 font-medium mb-2">
                Bàn <strong>{warningModal.table.code}</strong> đang có lượt đặt lúc{' '}
                <strong>{dayjs(warningModal.table.pendingReservation.time).format('HH:mm')}</strong>{' '}
                nhưng chưa check-in.
              </p>
              <p className="text-sm text-gray-700">
                Dự kiến bàn trống sau{' '}
                <strong>{dayjs(warningModal.table.pendingReservation.expectedEndTime).format('HH:mm')}</strong>.
                Nếu khách đặt trước không đến, bạn sẽ được ưu tiên sử dụng bàn này.
              </p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                💡 Chọn <strong>"Đợi có bàn"</strong> nếu bạn muốn nhà hàng chủ động bố trí bàn trống khác phù hợp.
              </p>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}