import React, { useState } from 'react';
import {
  Clock,
  UserCheck,
  UserX,
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  Award,
  FileCheck2,
  Plus,
  Play,
  Square,
  DollarSign,
  Phone,
  Mail,
  Calendar,
  X,
  Edit2,
} from 'lucide-react';
import { StaffMember, StaffShift, Child, ComplianceRatioResult } from '../../types';
import { calculateShiftHoursAndPay } from '../../lib/taxEngine';

interface StaffModuleProps {
  staff: StaffMember[];
  shifts: StaffShift[];
  presentChildren: Child[];
  ratioCompliance: ComplianceRatioResult;
  todayStr: string;
  onClockIn: (staffId: string) => Promise<void>;
  onClockOut: (staffId: string) => Promise<void>;
  onAddStaff: (member: Omit<StaffMember, 'id' | 'updatedAt'>) => Promise<StaffMember>;
  onUpdateStaff: (id: string, updates: Partial<StaffMember>) => Promise<void>;
}

export const StaffModule: React.FC<StaffModuleProps> = ({
  staff,
  shifts,
  presentChildren,
  ratioCompliance,
  todayStr,
  onClockIn,
  onClockOut,
  onAddStaff,
  onUpdateStaff,
}) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);

  const shiftsMap = new Map<string, StaffShift>();
  for (const s of shifts) {
    shiftsMap.set(s.staffId, s);
  }

  const roleNameMap: Record<string, string> = {
    DIRECTOR: 'מנהלת מעון',
    LEAD_EDUCATOR: 'גננת מובילה / מחנכת',
    ASSISTANT: 'סייעת קבועה',
    SUBSTITUTE: 'סייעת ממלאת מקום',
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Add Staff */}
      <div className="bg-white p-5 rounded-2xl border border-[#e4e2de] shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-[#5f3414] flex items-center gap-2 font-heading">
            <Clock className="w-5 h-5 text-[#7a4b29]" />
            <span>כוח אדם, סייעות ותקינת חוק הפיקוח • הבית של מאיה</span>
          </h2>
          <p className="text-xs text-[#51443c] mt-0.5">
            שעון נוכחות, חישוב שעות נוספות 125%/150%, תקינת יחס מטפלת-ילד ותוקף קורסי עזרה ראשונה באריאל
          </p>
        </div>

        <button
          onClick={() => {
            setEditingStaff(null);
            setIsAddModalOpen(true);
          }}
          className="flex items-center justify-center gap-1.5 bg-[#7a4b29] hover:bg-[#5f3414] text-white font-bold text-xs px-4 py-2.5 rounded-xl transition cursor-pointer shadow-xs active:scale-95 border border-[#ffdeab]/30"
        >
          <Plus className="w-4 h-4 text-[#ffdeab]" />
          <span>הוספת עובדת / סייעת</span>
        </button>
      </div>

      {/* Real-Time Daycare Supervision Law Compliance Banner */}
      <div
        className={`p-5 rounded-2xl border-2 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
          ratioCompliance.isCompliant
            ? 'bg-[#f0fdf4] border-emerald-300 text-emerald-950'
            : 'bg-rose-50 border-rose-300 text-rose-950 animate-pulse'
        }`}
      >
        <div className="flex items-start gap-3">
          <div
            className={`p-2.5 rounded-xl text-white ${
              ratioCompliance.isCompliant ? 'bg-[#7a4b29]' : 'bg-rose-600'
            }`}
          >
            {ratioCompliance.isCompliant ? (
              <ShieldCheck className="w-6 h-6 text-[#ffdeab]" />
            ) : (
              <ShieldAlert className="w-6 h-6" />
            )}
          </div>
          <div>
            <h3 className="font-bold text-base">
              {ratioCompliance.isCompliant
                ? 'תקינת חוק הפיקוח על מעונות יום (תשע"ט-2018) - עומד בתקן מלא!'
                : 'התראה חמורה: אי-עמידה בתקינת יחס מטפלת-ילד!'}
            </h3>
            <p className="text-xs mt-1 leading-relaxed">
              {ratioCompliance.alertMessage}
            </p>
            <div className="flex flex-wrap gap-2 mt-2 text-[11px] font-semibold text-[#51443c]">
              <span className="bg-white px-2.5 py-0.5 rounded-lg border border-[#e4e2de]">
                תינוקות (עד 15 חודש, תקן 1:6): {ratioCompliance.infantsCount}
              </span>
              <span className="bg-white px-2.5 py-0.5 rounded-lg border border-[#e4e2de]">
                פעוטות (15-24 חודש, תקן 1:9): {ratioCompliance.toddlersCount}
              </span>
              <span className="bg-white px-2.5 py-0.5 rounded-lg border border-[#e4e2de]">
                בוגרים (24-36 חודש, תקן 1:12): {ratioCompliance.preschoolersCount}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-xl border border-[#e4e2de] text-xs">
          <span className="text-[#51443c]">צוות במשמרת:</span>
          <span className="text-lg font-black text-[#5f3414] font-mono">
            {ratioCompliance.activeStaffCount}
          </span>
          <span className="text-[#51443c]/80">/ מינימום נדרש: {ratioCompliance.requiredStaffCount}</span>
        </div>
      </div>

      {/* Staff Directory & Punch Clock */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {staff.map((member) => {
          const shift = shiftsMap.get(member.id);
          const isClockedIn = shift && shift.clockIn && !shift.clockOut;

          // CPR validity check (2 years renewal)
          const now = new Date();
          const certDate = member.firstAidCertExpiryDate
            ? new Date(member.firstAidCertExpiryDate)
            : null;
          const isCertExpired = certDate ? certDate < now : true;
          const isCertExpiringSoon = certDate
            ? (certDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24) < 30
            : true;

          return (
            <div
              key={member.id}
              className="bg-white rounded-2xl border border-[#e4e2de] shadow-2xs p-5 space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-[#1b1c1a] text-base">{member.fullName}</h3>
                    <p className="text-xs text-[#7a4b29] font-bold mt-0.5">
                      {roleNameMap[member.role] || member.role}
                    </p>
                    <p className="text-[11px] text-[#51443c]/70">ת.ז. {member.idNumber}</p>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                      isClockedIn
                        ? 'bg-[#ffdeab] text-[#5f3414] border border-[#f9b98e]'
                        : 'bg-[#efeeea] text-[#51443c]'
                    }`}
                  >
                    {isClockedIn ? 'במשמרת פעילה 🟢' : 'לא במשמרת ⚪'}
                  </span>
                </div>

                {/* Overtime & Hourly Rate Info */}
                <div className="bg-[#fff9f3]/60 p-3 rounded-xl border border-[#ffdcc6] text-xs space-y-1">
                  <div className="flex justify-between text-[#51443c]">
                    <span>תעריף שעתי רגיל:</span>
                    <span className="font-bold font-mono text-[#5f3414]">₪{member.hourlyRate}/שעה</span>
                  </div>
                  <div className="flex justify-between text-[#51443c]/80 text-[11px]">
                    <span>שעות נוספות (125% / 150%):</span>
                    <span className="font-mono">
                      ₪{(member.hourlyRate * 1.25).toFixed(1)} / ₪{(member.hourlyRate * 1.5).toFixed(1)}
                    </span>
                  </div>
                  {shift?.clockIn && (
                    <div className="pt-2 border-t border-[#ffdcc6] flex justify-between font-mono font-bold text-[#7a4b29]">
                      <span>כניסה: {shift.clockIn}</span>
                      <span>{shift.clockOut ? `יציאה: ${shift.clockOut}` : 'עובדת כעת'}</span>
                    </div>
                  )}
                  {shift?.totalPay ? (
                    <div className="flex justify-between text-[11px] text-emerald-800 font-bold pt-1">
                      <span>שכר משוער להיום:</span>
                      <span className="font-mono">₪{shift.totalPay.toFixed(2)}</span>
                    </div>
                  ) : null}
                </div>

                {/* Compliance & Credentials Checklist */}
                <div className="space-y-1.5 text-[11px]">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-[#51443c]">
                      <Award className="w-3.5 h-3.5 text-[#7a4b29]" />
                      <span>תוקף קורס החייאה ועזרה ראשונה:</span>
                    </span>
                    <span
                      className={`font-bold ${
                        isCertExpired
                          ? 'text-rose-600'
                          : isCertExpiringSoon
                          ? 'text-amber-700'
                          : 'text-emerald-700'
                      }`}
                    >
                      {member.firstAidCertExpiryDate || 'לא הוזן'}
                      {isCertExpired && ' (פג תוקף!)'}
                      {isCertExpiringSoon && !isCertExpired && ' (לחדש בקרוב!)'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-[#51443c]">
                      <FileCheck2 className="w-3.5 h-3.5 text-[#7a4b29]" />
                      <span>אישור העסקת בגיר (משטרת ישראל):</span>
                    </span>
                    <span
                      className={`font-bold ${
                        member.policeClearanceApproved ? 'text-emerald-700' : 'text-rose-600'
                      }`}
                    >
                      {member.policeClearanceApproved ? 'מאושר ותקין' : 'חסר אישור!'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Punch Clock Buttons */}
              <div className="pt-3 border-t border-[#efeeea] flex items-center gap-2">
                {!isClockedIn ? (
                  <button
                    onClick={() => onClockIn(member.id)}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-[#7a4b29] hover:bg-[#5f3414] text-white font-bold py-2 rounded-xl text-xs transition cursor-pointer shadow-2xs border border-[#ffdeab]/30"
                  >
                    <Play className="w-3.5 h-3.5 fill-current text-[#ffdeab]" />
                    <span>החתמת כניסה</span>
                  </button>
                ) : (
                  <button
                    onClick={() => onClockOut(member.id)}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-rose-700 hover:bg-rose-800 text-white font-bold py-2 rounded-xl text-xs transition cursor-pointer shadow-2xs"
                  >
                    <Square className="w-3.5 h-3.5 fill-current" />
                    <span>החתמת יציאה וחישוב שכר</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    setEditingStaff(member);
                    setIsAddModalOpen(true);
                  }}
                  className="p-2 rounded-xl text-[#51443c] hover:text-[#1b1c1a] hover:bg-[#efeeea] transition cursor-pointer"
                  title="ערוך פרטי עובדת"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Staff Modal */}
      {isAddModalOpen && (
        <StaffFormModal
          initialStaff={editingStaff}
          onClose={() => {
            setIsAddModalOpen(false);
            setEditingStaff(null);
          }}
          onSave={async (staffData) => {
            if (editingStaff) {
              await onUpdateStaff(editingStaff.id, staffData);
            } else {
              await onAddStaff(staffData as any);
            }
            setIsAddModalOpen(false);
            setEditingStaff(null);
          }}
        />
      )}
    </div>
  );
};

// Staff Modal Component
const StaffFormModal: React.FC<{
  initialStaff: StaffMember | null;
  onClose: () => void;
  onSave: (data: Partial<StaffMember>) => Promise<void>;
}> = ({ initialStaff, onClose, onSave }) => {
  const [fullName, setFullName] = useState(initialStaff?.fullName || '');
  const [idNumber, setIdNumber] = useState(initialStaff?.idNumber || '');
  const [role, setRole] = useState(initialStaff?.role || 'ASSISTANT');
  const [phone, setPhone] = useState(initialStaff?.phone || '');
  const [email, setEmail] = useState(initialStaff?.email || '');
  const [hourlyRate, setHourlyRate] = useState(initialStaff?.hourlyRate || 50);
  const [standardDailyHours, setStandardDailyHours] = useState(
    initialStaff?.standardDailyHours || 8.5
  );
  const [firstAidCertExpiryDate, setFirstAidCertExpiryDate] = useState(
    initialStaff?.firstAidCertExpiryDate || '2027-10-01'
  );
  const [policeClearanceApproved, setPoliceClearanceApproved] = useState(
    initialStaff ? initialStaff.policeClearanceApproved : true
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      fullName,
      idNumber,
      role: role as any,
      phone,
      email,
      hourlyRate: Number(hourlyRate),
      standardDailyHours: Number(standardDailyHours),
      firstAidCertExpiryDate,
      policeClearanceDate: new Date().toISOString().split('T')[0],
      policeClearanceApproved,
      status: 'ACTIVE',
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-2xs p-4 overflow-y-auto">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-[#e4e2de] overflow-hidden text-right">
        <div className="bg-[#7a4b29] text-white p-5 flex items-center justify-between border-b border-[#ffdeab]/20">
          <h3 className="font-black text-base font-heading">
            {initialStaff ? 'עריכת פרטי עובדת • הבית של מאיה' : 'קליטת עובדת / סייעת חדשה'}
          </h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/10 transition cursor-pointer">
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div>
            <label className="block text-[#51443c] font-bold mb-1">שם מלא:</label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-[#e4e2de] focus:outline-[#d97706]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[#51443c] font-bold mb-1">ת.ז. עובדת:</label>
              <input
                type="text"
                required
                value={idNumber}
                onChange={(e) => setIdNumber(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#e4e2de] focus:outline-[#d97706]"
              />
            </div>
            <div>
              <label className="block text-[#51443c] font-bold mb-1">תפקיד במעון:</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl border border-[#e4e2de] bg-white focus:outline-[#d97706]"
              >
                <option value="DIRECTOR">מנהלת מעון (רותם עירון)</option>
                <option value="LEAD_EDUCATOR">גננת מובילה / מחנכת</option>
                <option value="ASSISTANT">סייעת קבועה</option>
                <option value="SUBSTITUTE">סייעת ממלאת מקום</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[#51443c] font-bold mb-1">טלפון נייד:</label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#e4e2de] focus:outline-[#d97706]"
              />
            </div>
            <div>
              <label className="block text-[#51443c] font-bold mb-1">שכר שעתי (₪):</label>
              <input
                type="number"
                required
                value={hourlyRate}
                onChange={(e) => setHourlyRate(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-[#e4e2de] focus:outline-[#d97706]"
              />
            </div>
          </div>

          <div className="bg-[#fff9f3] p-3.5 rounded-2xl border border-[#ffdcc6] space-y-2">
            <label className="block text-[#5f3414] font-bold">
              תוקף קורס החייאה ועזרה ראשונה (חובה לחידוש כל שנתיים):
            </label>
            <input
              type="date"
              required
              value={firstAidCertExpiryDate}
              onChange={(e) => setFirstAidCertExpiryDate(e.target.value)}
              className="w-full px-3 py-1.5 rounded-xl border border-[#e4e2de] bg-white focus:outline-[#d97706]"
            />
            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="policeClearance"
                checked={policeClearanceApproved}
                onChange={(e) => setPoliceClearanceApproved(e.target.checked)}
                className="rounded text-[#7a4b29] focus:ring-[#d97706] w-4 h-4 cursor-pointer"
              />
              <label htmlFor="policeClearance" className="text-[#51443c] font-semibold cursor-pointer">
                קיים אישור משטרה תקני להעסקת בגיר (לפי החוק)
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[#efeeea]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-[#efeeea] text-[#51443c] font-bold hover:bg-[#e4e2de] cursor-pointer"
            >
              ביטול
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-[#7a4b29] text-white font-bold hover:bg-[#5f3414] shadow-xs cursor-pointer transition border border-[#ffdeab]/30"
            >
              שמור עובדת
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
