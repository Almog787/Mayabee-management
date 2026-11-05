import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Palmtree,
  ShieldAlert,
  Users,
  LogOut,
  UserCheck,
  Search,
} from 'lucide-react';
import { Child, DailyAttendance, AttendanceStatus } from '../../types';

interface AttendanceModuleProps {
  children: Child[];
  attendance: DailyAttendance[];
  todayStr: string;
  onSetAttendanceStatus: (childId: string, status: AttendanceStatus, notes?: string) => Promise<void>;
  onMarkCheckIn: (childId: string) => Promise<void>;
  onMarkCheckOut: (childId: string, pickupPerson?: string) => Promise<void>;
  onQuickCheckInAll: () => Promise<void>;
}

export const AttendanceModule: React.FC<AttendanceModuleProps> = ({
  children,
  attendance,
  todayStr,
  onSetAttendanceStatus,
  onMarkCheckIn,
  onMarkCheckOut,
  onQuickCheckInAll,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | AttendanceStatus>('ALL');
  const [checkoutChildId, setCheckoutChildId] = useState<string | null>(null);
  const [pickupPersonInput, setPickupPersonInput] = useState('');

  // Map childId to attendance record
  const attendanceMap = new Map<string, DailyAttendance>();
  for (const a of attendance) {
    attendanceMap.set(a.childId, a);
  }

  const presentCount = attendance.filter((a) => a.status === 'PRESENT').length;
  const sickCount = attendance.filter((a) => a.status === 'SICK').length;
  const absentCount = attendance.filter((a) => a.status === 'ABSENT').length;
  const vacationCount = attendance.filter((a) => a.status === 'VACATION').length;

  const filteredChildren = children.filter((child) => {
    const att = attendanceMap.get(child.id);
    const matchesSearch = `${child.firstName} ${child.lastName}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === 'ALL' || (att ? att.status === statusFilter : statusFilter === 'ABSENT');
    return matchesSearch && matchesStatus;
  });

  const handleCheckoutSubmit = (childId: string) => {
    onMarkCheckOut(childId, pickupPersonInput || 'הורה');
    setCheckoutChildId(null);
    setPickupPersonInput('');
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Stats */}
      <div className="bg-white p-5 rounded-2xl border border-[#e4e2de] shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-[#5f3414] flex items-center gap-2 font-heading">
            <Users className="w-5 h-5 text-[#d97706]" />
            <span>יומן נוכחות דיגיטלי יומי • הבית של מאיה ({todayStr})</span>
          </h2>
          <p className="text-xs text-[#51443c] mt-0.5">
            סימון כניסה/יציאה בלחיצה אחת, שעות הגעה, תיעוד מורשי איסוף והתראות אלרגיה באריאל
          </p>
        </div>

        <button
          onClick={onQuickCheckInAll}
          className="flex items-center justify-center gap-1.5 bg-[#7a4b29] hover:bg-[#5f3414] text-white font-bold text-xs px-4 py-2.5 rounded-xl transition cursor-pointer shadow-xs active:scale-95 border border-[#ffdeab]/30"
        >
          <UserCheck className="w-4 h-4 text-[#ffdeab]" />
          <span>סמן את כל הילדים כנוכחים</span>
        </button>
      </div>

      {/* Attendance Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div
          onClick={() => setStatusFilter(statusFilter === 'PRESENT' ? 'ALL' : 'PRESENT')}
          className={`p-3.5 rounded-2xl border transition cursor-pointer ${
            statusFilter === 'PRESENT'
              ? 'bg-[#ffdeab] border-[#f9b98e] shadow-xs'
              : 'bg-white border-[#e4e2de] hover:border-[#d97706]'
          }`}
        >
          <div className="flex items-center justify-between text-[#5f3414]">
            <span className="font-bold">נוכחים כעת</span>
            <CheckCircle2 className="w-4 h-4 text-[#7a4b29]" />
          </div>
          <p className="text-2xl font-black text-[#5f3414] mt-1">{presentCount}</p>
        </div>

        <div
          onClick={() => setStatusFilter(statusFilter === 'ABSENT' ? 'ALL' : 'ABSENT')}
          className={`p-3.5 rounded-2xl border transition cursor-pointer ${
            statusFilter === 'ABSENT'
              ? 'bg-[#efeeea] border-[#d6c3b8]'
              : 'bg-white border-[#e4e2de] hover:border-[#d6c3b8]'
          }`}
        >
          <div className="flex items-center justify-between text-[#51443c]">
            <span className="font-semibold">נעדרים</span>
            <XCircle className="w-4 h-4 text-[#51443c]" />
          </div>
          <p className="text-2xl font-black text-[#51443c] mt-1">{absentCount}</p>
        </div>

        <div
          onClick={() => setStatusFilter(statusFilter === 'SICK' ? 'ALL' : 'SICK')}
          className={`p-3.5 rounded-2xl border transition cursor-pointer ${
            statusFilter === 'SICK'
              ? 'bg-[#fffbeb] border-[#fde68a]'
              : 'bg-white border-[#e4e2de] hover:border-[#fde68a]'
          }`}
        >
          <div className="flex items-center justify-between text-amber-900">
            <span className="font-semibold">חולים</span>
            <AlertCircle className="w-4 h-4 text-amber-700" />
          </div>
          <p className="text-2xl font-black text-amber-950 mt-1">{sickCount}</p>
        </div>

        <div
          onClick={() => setStatusFilter(statusFilter === 'VACATION' ? 'ALL' : 'VACATION')}
          className={`p-3.5 rounded-2xl border transition cursor-pointer ${
            statusFilter === 'VACATION'
              ? 'bg-[#eff6ff] border-[#bfdbfe]'
              : 'bg-white border-[#e4e2de] hover:border-[#bfdbfe]'
          }`}
        >
          <div className="flex items-center justify-between text-blue-900">
            <span className="font-semibold">בחופשה</span>
            <Palmtree className="w-4 h-4 text-blue-700" />
          </div>
          <p className="text-2xl font-black text-blue-950 mt-1">{vacationCount}</p>
        </div>
      </div>

      {/* Attendance Table / List */}
      <div className="bg-white rounded-2xl border border-[#e4e2de] shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-[#efeeea] flex items-center justify-between gap-3 bg-[#faf8f5]">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-[#7a4b29] absolute right-3 top-2.5" />
            <input
              type="text"
              placeholder="חיפוש ילד/ה..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-3 pr-9 py-1.5 text-xs rounded-xl border border-[#e4e2de] bg-white focus:outline-[#d97706] focus:border-[#d97706]"
            />
          </div>
          <span className="text-xs text-[#51443c]">
            מוצגים {filteredChildren.length} ילדים
          </span>
        </div>

        <div className="divide-y divide-[#efeeea]">
          {filteredChildren.map((child) => {
            const att = attendanceMap.get(child.id);
            const status = att?.status || 'ABSENT';
            const isPresent = status === 'PRESENT';

            return (
              <div
                key={child.id}
                className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition ${
                  isPresent ? 'bg-[#fff9f3]' : 'bg-white'
                }`}
              >
                {/* Child Name & Details */}
                <div className="flex items-start gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                      isPresent
                        ? 'bg-[#ffdeab] text-[#5f3414] border border-[#f9b98e]'
                        : 'bg-[#efeeea] text-[#51443c]'
                    }`}
                  >
                    {child.firstName[0]}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#1b1c1a] text-sm">
                        {child.firstName} {child.lastName}
                      </span>
                      {child.allergies && child.allergies.length > 0 && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rose-100 text-rose-800 text-[10px] font-bold">
                          <ShieldAlert className="w-3 h-3 text-rose-600" />
                          <span>{child.allergies.join(', ')}</span>
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-[#51443c] mt-0.5 flex flex-wrap items-center gap-3">
                      <span>הורה: {child.parent1.fullName} ({child.parent1.phone})</span>
                      {att?.checkInTime && (
                        <span className="text-[#7a4b29] font-mono flex items-center gap-1 font-semibold">
                          <Clock className="w-3 h-3 text-[#d97706]" />
                          כניסה: {att.checkInTime}
                        </span>
                      )}
                      {att?.checkOutTime && (
                        <span className="text-[#51443c] font-mono flex items-center gap-1">
                          <LogOut className="w-3 h-3" />
                          יציאה: {att.checkOutTime} (נאסף ע"י: {att.pickupPerson || 'הורה'})
                        </span>
                      )}
                      {att?.notes && (
                        <span className="text-amber-800 italic">הערה: {att.notes}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Status Toggle Buttons */}
                <div className="flex items-center gap-1.5 self-end sm:self-center">
                  <button
                    onClick={() => onSetAttendanceStatus(child.id, 'PRESENT')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                      status === 'PRESENT'
                        ? 'bg-[#7a4b29] text-white shadow-xs'
                        : 'bg-[#efeeea] text-[#51443c] hover:bg-[#ffdeab]/40 hover:text-[#5f3414]'
                    }`}
                  >
                    נוכח 🟢
                  </button>

                  <button
                    onClick={() => onSetAttendanceStatus(child.id, 'ABSENT')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                      status === 'ABSENT'
                        ? 'bg-[#51443c] text-white shadow-xs'
                        : 'bg-[#efeeea] text-[#51443c] hover:bg-[#e4e2de]'
                    }`}
                  >
                    נעדר ⚪
                  </button>

                  <button
                    onClick={() => onSetAttendanceStatus(child.id, 'SICK')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                      status === 'SICK'
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'bg-[#efeeea] text-[#51443c] hover:bg-[#fffbeb] hover:text-amber-800'
                    }`}
                  >
                    חולה 🤒
                  </button>

                  <button
                    onClick={() => onSetAttendanceStatus(child.id, 'VACATION')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                      status === 'VACATION'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-[#efeeea] text-[#51443c] hover:bg-blue-50 hover:text-blue-700'
                    }`}
                  >
                    חופשה 🏖️
                  </button>

                  {/* Check-out button if present and not yet checked out */}
                  {isPresent && !att?.checkOutTime && (
                    <button
                      onClick={() => setCheckoutChildId(child.id)}
                      className="px-2.5 py-1.5 bg-[#ffdeab]/40 hover:bg-[#ffdeab] text-[#7a4b29] border border-[#f9b98e] rounded-xl text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                      title="סימון יציאה ואיסוף"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>שחרור</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Checkout Modal */}
      {checkoutChildId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-2xs p-4">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-[#e4e2de] text-right space-y-4">
            <h3 className="font-black text-[#5f3414] text-base font-heading">שחרור ואיסוף מהמעון • הבית של מאיה</h3>
            <p className="text-xs text-[#51443c]">
              מי המבוגר שאוסף כעת את הילד/ה?
            </p>
            <input
              type="text"
              placeholder="שם האוסף (אמא / אבא / סבתא...)"
              value={pickupPersonInput}
              onChange={(e) => setPickupPersonInput(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-[#e4e2de] focus:outline-[#d97706]"
              autoFocus
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setCheckoutChildId(null)}
                className="px-4 py-2 rounded-xl bg-[#efeeea] text-[#51443c] text-xs font-bold hover:bg-[#e4e2de] cursor-pointer"
              >
                ביטול
              </button>
              <button
                onClick={() => handleCheckoutSubmit(checkoutChildId)}
                className="px-4 py-2 rounded-xl bg-[#7a4b29] text-white text-xs font-bold hover:bg-[#5f3414] transition shadow-xs cursor-pointer"
              >
                אשר יציאה
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
