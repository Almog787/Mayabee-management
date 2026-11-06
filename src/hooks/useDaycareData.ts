import { useState, useEffect, useCallback, useMemo } from 'react';
import { db, seedDatabaseIfEmpty } from '../lib/db';
import {
  Child,
  DailyAttendance,
  DailyActivityLog,
  FinancialTransaction,
  StaffMember,
  StaffShift,
  DaycareSettings,
  WeeklyMealDay,
  SafetyCheckItem,
  AttendanceStatus,
} from '../types';
import { calculateTaxStatus, evaluateDaycareRatioCompliance, calculateShiftHoursAndPay } from '../lib/taxEngine';
import { enableStoragePersistence } from '../lib/crypto';

export function useDaycareData() {
  const [loading, setLoading] = useState(true);
  const [children, setChildren] = useState<Child[]>([]);
  const [attendance, setAttendance] = useState<DailyAttendance[]>([]);
  const [dailyLogs, setDailyLogs] = useState<DailyActivityLog[]>([]);
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [shifts, setShifts] = useState<StaffShift[]>([]);
  const [menu, setMenu] = useState<WeeklyMealDay[]>([]);
  const [safetyChecks, setSafetyChecks] = useState<SafetyCheckItem[]>([]);
  const [settings, setSettings] = useState<DaycareSettings | null>(null);

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  const loadData = useCallback(async () => {
    try {
      await seedDatabaseIfEmpty();

      const [
        loadedChildren,
        loadedAttendance,
        loadedLogs,
        loadedTx,
        loadedStaff,
        loadedShifts,
        loadedMenu,
        loadedChecks,
        loadedSettings,
      ] = await Promise.all([
        db.children.toArray(),
        db.attendance.where('date').equals(todayStr).toArray(),
        db.dailyLogs.where('date').equals(todayStr).toArray(),
        db.transactions.reverse().sortBy('date'),
        db.staff.toArray(),
        db.shifts.where('date').equals(todayStr).toArray(),
        db.menu.toArray(),
        db.safetyChecks.toArray(),
        db.settings.toCollection().first(),
      ]);

      // Ensure every child has an attendance record for today
      const existingAttChildIds = new Set(loadedAttendance.map((a) => a.childId));
      const missingAttendance: DailyAttendance[] = [];

      for (const child of loadedChildren) {
        if (!existingAttChildIds.has(child.id)) {
          missingAttendance.push({
            id: `att-${todayStr}-${child.id}`,
            date: todayStr,
            childId: child.id,
            checkInTime: null,
            checkOutTime: null,
            status: 'ABSENT',
            updatedAt: Date.now(),
          });
        }
      }

      if (missingAttendance.length > 0) {
        await db.attendance.bulkAdd(missingAttendance);
        const refetched = await db.attendance.where('date').equals(todayStr).toArray();
        setAttendance(refetched);
      } else {
        setAttendance(loadedAttendance);
      }

      setChildren(loadedChildren);
      setDailyLogs(loadedLogs);
      setTransactions(loadedTx);
      setStaff(loadedStaff);
      setShifts(loadedShifts);
      setMenu(loadedMenu);
      setSafetyChecks(loadedChecks);
      setSettings(loadedSettings || null);
    } catch (error) {
      console.error('Failed to load daycare data:', error);
    } finally {
      setLoading(false);
    }
  }, [todayStr]);

  useEffect(() => {
    loadData();
    enableStoragePersistence();
  }, [loadData]);

  // Children Actions
  const addChild = async (child: Omit<Child, 'id' | 'updatedAt'>) => {
    const id = `c-${Date.now().toString(36)}`;
    const newChild: Child = {
      ...child,
      id,
      updatedAt: Date.now(),
    };
    await db.children.add(newChild);
    // Also create attendance for today
    await db.attendance.add({
      id: `att-${todayStr}-${id}`,
      date: todayStr,
      childId: id,
      checkInTime: null,
      checkOutTime: null,
      status: 'ABSENT',
      updatedAt: Date.now(),
    });
    await loadData();
    return newChild;
  };

  const updateChild = async (id: string, updates: Partial<Child>) => {
    await db.children.update(id, { ...updates, updatedAt: Date.now() });
    await loadData();
  };

  const deleteChild = async (id: string) => {
    await db.children.delete(id);
    await db.attendance.where('childId').equals(id).delete();
    await loadData();
  };

  // Attendance Actions
  const setAttendanceStatus = async (
    childId: string,
    status: AttendanceStatus,
    notes?: string
  ) => {
    const existing = attendance.find((a) => a.childId === childId && a.date === todayStr);
    const nowTime = new Date().toTimeString().substring(0, 5);

    if (existing) {
      const updates: Partial<DailyAttendance> = {
        status,
        updatedAt: Date.now(),
      };
      if (notes !== undefined) updates.notes = notes;
      if (status === 'PRESENT' && !existing.checkInTime) {
        updates.checkInTime = nowTime;
      }
      if (status !== 'PRESENT') {
        updates.checkInTime = null;
        updates.checkOutTime = null;
      }
      await db.attendance.update(existing.id, updates);
    } else {
      await db.attendance.add({
        id: `att-${todayStr}-${childId}`,
        date: todayStr,
        childId,
        checkInTime: status === 'PRESENT' ? nowTime : null,
        checkOutTime: null,
        status,
        notes,
        updatedAt: Date.now(),
      });
    }
    await loadData();
  };

  const markCheckIn = async (childId: string) => {
    const nowTime = new Date().toTimeString().substring(0, 5);
    const existing = attendance.find((a) => a.childId === childId && a.date === todayStr);
    if (existing) {
      await db.attendance.update(existing.id, {
        status: 'PRESENT',
        checkInTime: nowTime,
        checkOutTime: null,
        updatedAt: Date.now(),
      });
    }
    await loadData();
  };

  const markCheckOut = async (childId: string, pickupPerson?: string) => {
    const nowTime = new Date().toTimeString().substring(0, 5);
    const existing = attendance.find((a) => a.childId === childId && a.date === todayStr);
    if (existing) {
      await db.attendance.update(existing.id, {
        checkOutTime: nowTime,
        pickupPerson,
        updatedAt: Date.now(),
      });
    }
    await loadData();
  };

  const quickCheckInAll = async () => {
    const nowTime = new Date().toTimeString().substring(0, 5);
    for (const a of attendance) {
      if (a.status !== 'PRESENT') {
        await db.attendance.update(a.id, {
          status: 'PRESENT',
          checkInTime: nowTime,
          updatedAt: Date.now(),
        });
      }
    }
    await loadData();
  };

  // Daily Activity Logs
  const saveDailyLog = async (logData: Partial<DailyActivityLog> & { childId: string }) => {
    const existing = dailyLogs.find(
      (l) => l.childId === logData.childId && l.date === todayStr
    );
    if (existing) {
      await db.dailyLogs.update(existing.id, {
        ...logData,
        updatedAt: Date.now(),
      });
    } else {
      await db.dailyLogs.add({
        id: `log-${todayStr}-${logData.childId}`,
        date: todayStr,
        diaperChanges: logData.diaperChanges || [],
        meals: logData.meals || [],
        mood: logData.mood || 'EXCELLENT',
        highlightActivities: logData.highlightActivities || '',
        specialNotes: logData.specialNotes || '',
        updatedAt: Date.now(),
        ...logData,
      } as DailyActivityLog);
    }
    await loadData();
  };

  // Finance Actions
  const addTransaction = async (
    tx: Omit<FinancialTransaction, 'id' | 'updatedAt'>
  ) => {
    const newTx: FinancialTransaction = {
      ...tx,
      id: `tx-${Date.now().toString(36)}`,
      updatedAt: Date.now(),
    };
    await db.transactions.add(newTx);
    await loadData();
    return newTx;
  };

  const deleteTransaction = async (id: string) => {
    await db.transactions.delete(id);
    await loadData();
  };

  // Staff & Shifts Actions
  const addStaff = async (member: Omit<StaffMember, 'id' | 'updatedAt'>) => {
    const newStaff: StaffMember = {
      ...member,
      id: `s-${Date.now().toString(36)}`,
      updatedAt: Date.now(),
    };
    await db.staff.add(newStaff);
    await loadData();
    return newStaff;
  };

  const updateStaff = async (id: string, updates: Partial<StaffMember>) => {
    await db.staff.update(id, { ...updates, updatedAt: Date.now() });
    await loadData();
  };

  const clockInStaff = async (staffId: string) => {
    const nowTime = new Date().toTimeString().substring(0, 5);
    const existingShift = shifts.find((s) => s.staffId === staffId && s.date === todayStr);
    const staffMember = staff.find((s) => s.id === staffId);
    const rate = staffMember?.hourlyRate || 50;

    if (existingShift) {
      await db.shifts.update(existingShift.id, {
        clockIn: nowTime,
        clockOut: null,
        updatedAt: Date.now(),
      });
    } else {
      await db.shifts.add({
        id: `sh-${todayStr}-${staffId}`,
        staffId,
        date: todayStr,
        clockIn: nowTime,
        clockOut: null,
        regularHours: 0,
        overtime125Hours: 0,
        overtime150Hours: 0,
        totalPay: 0,
        updatedAt: Date.now(),
      });
    }
    await loadData();
  };

  const clockOutStaff = async (staffId: string) => {
    const nowTime = new Date().toTimeString().substring(0, 5);
    const existingShift = shifts.find((s) => s.staffId === staffId && s.date === todayStr);
    const staffMember = staff.find((s) => s.id === staffId);

    if (existingShift && existingShift.clockIn) {
      const rate = staffMember?.hourlyRate || 50;
      const stdHours = staffMember?.standardDailyHours || 8.5;
      const calc = calculateShiftHoursAndPay(existingShift.clockIn, nowTime, rate, stdHours);

      await db.shifts.update(existingShift.id, {
        clockOut: nowTime,
        regularHours: calc.regularHours,
        overtime125Hours: calc.overtime125Hours,
        overtime150Hours: calc.overtime150Hours,
        totalPay: calc.totalPay,
        updatedAt: Date.now(),
      });
    }
    await loadData();
  };

  // Safety Checklist
  const updateSafetyCheck = async (
    id: string,
    status: 'PASSED' | 'FAILED' | 'PENDING',
    inspectorName?: string,
    notes?: string
  ) => {
    await db.safetyChecks.update(id, {
      status,
      lastCheckedDate: todayStr,
      inspectorName: inspectorName || settings?.directorName || 'מנהלת',
      notes,
    });
    await loadData();
  };

  // Settings
  const updateSettings = async (updates: Partial<DaycareSettings>) => {
    if (settings) {
      await db.settings.update(settings.id, updates);
    } else {
      await db.settings.add({
        id: 'settings-default',
        daycareName: 'מעון ילדים',
        businessType: 'OSEK_PATUR',
        businessTaxId: '028912345',
        directorName: 'הנהלת המעון',
        directorPhone: '052-870-7056',
        daycareAddress: 'אריאל, שומרון',
        currentYearOsekPaturCeiling: 122000,
        vatRate: 0.17,
        hasMasterPassword: false,
        googleSyncEnabled: false,
        ...updates,
      });
    }
    await loadData();
  };

  // Computed Summaries
  const activeChildren = useMemo(
    () => children.filter((c) => c.status === 'ACTIVE'),
    [children]
  );

  const presentChildren = useMemo(() => {
    const presentIds = new Set(
      attendance.filter((a) => a.status === 'PRESENT').map((a) => a.childId)
    );
    return children.filter((c) => presentIds.has(c.id));
  }, [attendance, children]);

  const activeClockedStaff = useMemo(() => {
    return shifts.filter((s) => s.clockIn && !s.clockOut);
  }, [shifts]);

  const ratioCompliance = useMemo(() => {
    return evaluateDaycareRatioCompliance(presentChildren, activeClockedStaff.length);
  }, [presentChildren, activeClockedStaff]);

  const taxStatus = useMemo(() => {
    return calculateTaxStatus(
      transactions,
      settings?.businessType || 'OSEK_PATUR',
      settings?.currentYearOsekPaturCeiling || 122000
    );
  }, [transactions, settings]);

  // Today's Day-of-Week Menu and Allergen Collision Engine
  const todayMenu = useMemo(() => {
    const dayIndex = new Date().getDay(); // 0 is Sunday
    const dayNames = ['יום ראשון', 'יום שני', 'יום שלישי', 'יום רביעי', 'יום חמישי', 'יום שישי', 'יום שבת'];
    const currentDayName = dayNames[dayIndex] || 'יום ראשון';
    return menu.find((m) => m.dayName === currentDayName) || menu[0];
  }, [menu]);

  // Cross-contamination safeguard: match present children allergies with today's menu allergens
  const allergenConflicts = useMemo(() => {
    if (!todayMenu) return [];
    const conflicts: { child: Child; matchingAllergen: string }[] = [];

    const menuAllergens = (todayMenu.allergensPresent || []).map((a) => a.trim().toLowerCase());
    const menuIngredients = (todayMenu.ingredients || []).map((i) => i.trim().toLowerCase());

    for (const child of presentChildren) {
      for (const allergy of child.allergies || []) {
        const cleanAllergy = allergy.trim().toLowerCase();
        const hasCollision =
          menuAllergens.some((ma) => ma.includes(cleanAllergy) || cleanAllergy.includes(ma)) ||
          menuIngredients.some((ing) => ing.includes(cleanAllergy) || cleanAllergy.includes(ing));

        if (hasCollision) {
          conflicts.push({ child, matchingAllergen: allergy });
        }
      }
    }
    return conflicts;
  }, [todayMenu, presentChildren]);

  // Staff Certifications Alert (CPR renewal required every 2 years)
  const expiringStaffCerts = useMemo(() => {
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    return staff.filter((s) => {
      if (!s.firstAidCertExpiryDate) return true;
      const expiry = new Date(s.firstAidCertExpiryDate);
      return expiry <= thirtyDaysFromNow;
    });
  }, [staff]);

  return {
    loading,
    children,
    activeChildren,
    presentChildren,
    attendance,
    dailyLogs,
    transactions,
    staff,
    shifts,
    activeClockedStaff,
    menu,
    todayMenu,
    allergenConflicts,
    safetyChecks,
    settings,
    ratioCompliance,
    taxStatus,
    expiringStaffCerts,
    todayStr,
    // Actions
    addChild,
    updateChild,
    deleteChild,
    setAttendanceStatus,
    markCheckIn,
    markCheckOut,
    quickCheckInAll,
    saveDailyLog,
    addTransaction,
    deleteTransaction,
    addStaff,
    updateStaff,
    clockInStaff,
    clockOutStaff,
    updateSafetyCheck,
    updateSettings,
    refreshData: loadData,
  };
}
