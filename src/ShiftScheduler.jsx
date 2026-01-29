import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Clock,
  Download,
  Trash2,
  Sun,
  Moon,
  AlertCircle,
  Users,
  User,
  Coffee,
  AlertTriangle,
  ClockIcon
} from 'lucide-react';

export default function ShiftScheduler() {
  const employees = [
    { id: 1, name: '戸館', color: '#FF6B9D' },
    { id: 2, name: '青木', color: '#4ECDC4' },
    { id: 3, name: '中野', color: '#FFE66D' },
    { id: 4, name: '長谷川', color: '#95E1D3' },
    { id: 5, name: '渡辺', color: '#FFA07A' }
  ];

  const [selectedMonth, setSelectedMonth] = useState(() => {
    const today = new Date();
    return { year: today.getFullYear(), month: today.getMonth() };
  });

  const [selectedEmployee, setSelectedEmployee] = useState(employees[0].id);
  const [selectedShiftType, setSelectedShiftType] = useState('日勤');
  const [showWarning, setShowWarning] = useState(null);

  const shiftColors = {
    日勤: '#FFF4E6',
    日勤短縮: '#FFE0B2',
    夜勤: '#E8EAF6',
    夜勤延長: '#C5CAE9',
    有給: '#E8F5E9'
  };

  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const daysInMonth = getDaysInMonth(selectedMonth.year, selectedMonth.month);

  const [schedule, setSchedule] = useState({});

  const [paidLeave, setPaidLeave] = useState({});

  // Define date helpers before any functions that depend on them.
  const getDayOfWeek = (day) => {
    const date = new Date(selectedMonth.year, selectedMonth.month, day);
    return date.getDay();
  };

  const getDayOfWeekText = (day) => {
    const days = ['日', '月', '火', '水', '木', '金', '土'];
    return days[getDayOfWeek(day)];
  };

  const isNextDaySpecialWithOneDayShift = (day) => {
    if (day >= daysInMonth) return false;
    const nextDay = day + 1;
    const dow = getDayOfWeek(nextDay);
    const isSpecial = dow === 1 || dow === 3 || dow === 5;
    if (!isSpecial) return false;

    const dayShiftCount = schedule[nextDay]?.['日勤']?.length || 0;
    return dayShiftCount === 1;
  };

  const isNightShiftExtended = (day) => {
    return isNextDaySpecialWithOneDayShift(day);
  };

  const isDayShiftShortened = (day) => {
    const dow = getDayOfWeek(day);
    const isSpecial = dow === 1 || dow === 3 || dow === 5;
    if (!isSpecial) return false;

    const dayShiftCount = schedule[day]?.['日勤']?.length || 0;
    if (dayShiftCount !== 1) return false;

    if (day > 1) {
      const prevNightShift = schedule[day - 1]?.['夜勤'] || [];
      return prevNightShift.length > 0;
    }
    return false;
  };

  const getDayShiftHours = (day) => {
    if (isDayShiftShortened(day)) {
      return 11;
    }
    return 12;
  };

  const getNightShiftHours = (day) => {
    if (isNightShiftExtended(day)) {
      return 13;
    }
    return 12;
  };

  const calculateHours = (empId) => {
    let total = 0;
    for (let day = 1; day <= daysInMonth; day++) {
      if (schedule[day]?.['日勤']?.includes(empId)) {
        total += getDayShiftHours(day);
      }
      if (schedule[day]?.['夜勤']?.includes(empId)) {
        total += getNightShiftHours(day);
      }
    }
    return total;
  };

  const countPaidLeave = (empId) => {
    let count = 0;
    for (let day = 1; day <= daysInMonth; day++) {
      if (paidLeave[day]?.includes(empId)) {
        count++;
      }
    }
    return count;
  };

  const checkConsecutiveNightShift = (empId, day) => {
    if (day > 1 && schedule[day - 1]?.['夜勤']?.includes(empId)) {
      return true;
    }
    if (day < daysInMonth && schedule[day + 1]?.['夜勤']?.includes(empId)) {
      return true;
    }
    return false;
  };

  const getAllConsecutiveNightShiftViolations = () => {
    const violations = [];
    employees.forEach((emp) => {
      for (let day = 1; day <= daysInMonth - 1; day++) {
        if (
          schedule[day]?.['夜勤']?.includes(emp.id) &&
          schedule[day + 1]?.['夜勤']?.includes(emp.id)
        ) {
          violations.push({
            empId: emp.id,
            empName: emp.name,
            day1: day,
            day2: day + 1
          });
        }
      }
    });
    return violations;
  };

  const employeeHours = useMemo(() => {
    const hours = {};
    employees.forEach((emp) => {
      hours[emp.id] = calculateHours(emp.id);
    });
    return hours;
  }, [schedule, daysInMonth]);

  const employeePaidLeave = useMemo(() => {
    const leaves = {};
    employees.forEach((emp) => {
      leaves[emp.id] = countPaidLeave(emp.id);
    });
    return leaves;
  }, [paidLeave, daysInMonth]);

  const nightShiftViolations = useMemo(() => {
    return getAllConsecutiveNightShiftViolations();
  }, [schedule, daysInMonth]);

  // (moved above) getDayOfWeek / getDayOfWeekText

  const isSpecialDay = (day) => {
    const dow = getDayOfWeek(day);
    return dow === 1 || dow === 3 || dow === 5;
  };

  const handleCellClick = (day, shift) => {
    if (selectedShiftType === '有給') {
      const newPaidLeave = { ...paidLeave };
      if (!newPaidLeave[day]) {
        newPaidLeave[day] = [];
      }

      const empList = [...newPaidLeave[day]];
      const index = empList.indexOf(selectedEmployee);

      if (index > -1) {
        empList.splice(index, 1);
      } else {
        empList.push(selectedEmployee);

        const newSchedule = { ...schedule };
        ['日勤', '夜勤'].forEach((shiftType) => {
          if (newSchedule[day]?.[shiftType]) {
            const shiftIndex = newSchedule[day][shiftType].indexOf(selectedEmployee);
            if (shiftIndex > -1) {
              newSchedule[day][shiftType].splice(shiftIndex, 1);
            }
          }
        });
        setSchedule(newSchedule);
      }

      newPaidLeave[day] = empList;
      setPaidLeave(newPaidLeave);
      setShowWarning(null);
    } else {
      const newSchedule = { ...schedule };
      if (!newSchedule[day]) {
        newSchedule[day] = {};
      }
      if (!newSchedule[day][shift]) {
        newSchedule[day][shift] = [];
      }

      const empList = [...newSchedule[day][shift]];
      const index = empList.indexOf(selectedEmployee);

      if (index > -1) {
        empList.splice(index, 1);
        setShowWarning(null);
      } else {
        if (shift === '夜勤') {
          const willBeConsecutive = checkConsecutiveNightShift(selectedEmployee, day);
          if (willBeConsecutive) {
            const empName = employees.find((emp) => emp.id === selectedEmployee)?.name;
            setShowWarning(`${empName}さんの夜勤が連続します。このまま配置しますか？`);
          } else {
            setShowWarning(null);
          }
        }

        if (paidLeave[day]?.includes(selectedEmployee)) {
          const newPaidLeave = { ...paidLeave };
          const plIndex = newPaidLeave[day].indexOf(selectedEmployee);
          if (plIndex > -1) {
            newPaidLeave[day].splice(plIndex, 1);
          }
          setPaidLeave(newPaidLeave);
        }

        empList.push(selectedEmployee);
      }

      newSchedule[day][shift] = empList;
      setSchedule(newSchedule);
    }
  };

  const clearSchedule = () => {
    setSchedule({});
    setPaidLeave({});
    setShowWarning(null);
  };

  const exportSchedule = () => {
    const monthName = `${selectedMonth.year}年${selectedMonth.month + 1}月`;
    let text = `シフト表（2交代制） - ${monthName}\n`;
    text += '日勤: 9:00-21:00 (12時間) / 夜勤: 21:00-翌9:00 (12時間)\n';
    text += '※月・水・金は日勤2名体制\n';
    text += '※月・水・金の日勤が1名の場合:\n';
    text += '  - 前日夜勤: 21:00-翌10:00 (13時間) ← 終了時刻を1時間延長\n';
    text += '  - 当日日勤: 9:00-20:00 (11時間) ← 終了時刻を1時間短縮\n';
    text += '  → 合計24時間を調整して180時間目標を維持\n';
    text += '※夜勤は連続しないこと\n';
    text += '目標勤務時間: 180時間/月\n\n';

    if (nightShiftViolations.length > 0) {
      text += '【警告】夜勤連続違反:\n';
      nightShiftViolations.forEach((violation) => {
        text += `  ${violation.empName}: ${violation.day1}日-${violation.day2}日\n`;
      });
      text += '\n';
    }

    for (let day = 1; day <= daysInMonth; day++) {
      text += `${day}日 (${getDayOfWeekText(day)})\n`;

      const dayShift = schedule[day]?.['日勤'] || [];
      const nightShift = schedule[day]?.['夜勤'] || [];
      const paidLeaveList = paidLeave[day] || [];
      const isExtended = isNightShiftExtended(day);
      const isShortened = isDayShiftShortened(day);

      text += `  日勤: ${dayShift
        .map((id) => employees.find((emp) => emp.id === id)?.name)
        .join(', ') || 'なし'}`;
      if (isShortened && dayShift.length > 0) {
        text += ' (9:00-20:00 / 11時間)';
      }
      text += '\n';

      text += `  夜勤: ${nightShift
        .map((id) => employees.find((emp) => emp.id === id)?.name)
        .join(', ') || 'なし'}`;
      if (isExtended && nightShift.length > 0) {
        text += ' (21:00-翌10:00 / 13時間)';
      }
      text += '\n';

      if (paidLeaveList.length > 0) {
        text += `  有給: ${paidLeaveList
          .map((id) => employees.find((emp) => emp.id === id)?.name)
          .join(', ')}\n`;
      }
    }

    text += '\n従業員別勤務時間・有給取得日数:\n';
    employees.forEach((emp) => {
      text += `${emp.name}: ${employeeHours[emp.id]}h（有給${employeePaidLeave[emp.id]}日）\n`;
    });

    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `shift-schedule-${selectedMonth.year}-${selectedMonth.month + 1}.txt`;
    link.click();
  };

  const changeMonth = (delta) => {
    let newMonth = selectedMonth.month + delta;
    let newYear = selectedMonth.year;

    if (newMonth > 11) {
      newMonth = 0;
      newYear++;
    } else if (newMonth < 0) {
      newMonth = 11;
      newYear--;
    }

    setSelectedMonth({ year: newYear, month: newMonth });
    setShowWarning(null);
  };

  const getDayShiftCount = (day) => {
    return schedule[day]?.['日勤']?.length || 0;
  };

  const getSelectedEmployeeColor = () => {
    return employees.find((emp) => emp.id === selectedEmployee)?.color || '#667eea';
  };

  const hasNightShiftViolation = (day) => {
    return nightShiftViolations.some((violation) => violation.day1 === day || violation.day2 === day);
  };

  return (
    <div
      className="min-h-screen p-6"
      style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        fontFamily: "'Poppins', 'Noto Sans JP', sans-serif"
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&family=Noto+Sans+JP:wght@400;700&display=swap');

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }

        .fade-in {
          animation: fadeIn 0.5s ease-out;
        }

        .shift-cell {
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: pointer;
        }

        .shift-cell:hover {
          transform: scale(1.02);
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }

        .shift-cell:active {
          transform: scale(0.98);
        }

        .btn-primary {
          transition: all 0.3s ease;
        }

        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(0,0,0,0.2);
        }

        .btn-primary:active {
          transform: translateY(0);
        }

        .hours-display {
          transition: all 0.3s ease;
        }

        .special-day {
          background: linear-gradient(to bottom, #FFF9E6, #FFFBF0);
        }

        .employee-badge {
          display: inline-block;
          padding: 2px 8px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 600;
          margin: 2px;
          color: white;
        }

        .selected-indicator {
          animation: pulse 2s ease-in-out infinite;
        }

        .warning-row {
          background: #FFF3E0 !important;
          border-left: 4px solid #FF9800 !important;
        }

        .violation-cell {
          background: #FFEBEE !important;
          animation: shake 0.5s ease-in-out;
        }

        .extended-night-shift {
          background: linear-gradient(to bottom, #C5CAE9, #E8EAF6);
          border: 2px solid #5C6BC0;
        }

        .shortened-day-shift {
          background: linear-gradient(to bottom, #FFE0B2, #FFF4E6);
          border: 2px solid #FF9800;
        }
      `}</style>

      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8 fade-in">
          <div className="inline-flex items-center gap-3 mb-3">
            <Calendar className="w-12 h-12 text-white" strokeWidth={2.5} />
            <h1 className="text-5xl font-bold text-white tracking-tight">
              シフト管理（2交代制）
            </h1>
          </div>
          <p className="text-white/80 text-lg">
            月間180時間勤務 - 日勤 9:00-21:00 / 夜勤 21:00-翌9:00
          </p>
          <div className="mt-2 flex gap-2 items-center justify-center flex-wrap">
            <div className="inline-flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full">
              <Users className="w-5 h-5 text-white" />
              <span className="text-white font-semibold">月・水・金は日勤2名体制</span>
            </div>
            <div className="inline-flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full">
              <Moon className="w-5 h-5 text-white" />
              <span className="text-white font-semibold">夜勤は連続しない</span>
            </div>
            <div className="inline-flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full">
              <ClockIcon className="w-5 h-5 text-white" />
              <span className="text-white font-semibold text-sm">月水金1名時は終了時刻調整</span>
            </div>
          </div>
        </div>

        {showWarning && (
          <div className="bg-orange-100 border-2 border-orange-400 rounded-2xl p-4 mb-6 fade-in">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-orange-600" />
              <p className="text-orange-800 font-semibold">{showWarning}</p>
            </div>
          </div>
        )}

        {nightShiftViolations.length > 0 && (
          <div className="bg-red-100 border-2 border-red-400 rounded-2xl p-4 mb-6 fade-in">
            <div className="flex items-center gap-3 mb-2">
              <AlertTriangle className="w-6 h-6 text-red-600" />
              <h3 className="text-red-800 font-bold">夜勤連続違反が検出されました</h3>
            </div>
            <ul className="ml-9 text-red-700 text-sm space-y-1">
              {nightShiftViolations.map((violation, idx) => (
                <li key={idx}>
                  {violation.empName}: {violation.day1}日-{violation.day2}日が連続
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-6 mb-6 fade-in">
          <div className="flex items-center gap-4 mb-4">
            <User className="w-6 h-6 text-purple-600" />
            <h3 className="text-xl font-bold text-gray-800">シフト配置設定</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">従業員を選択</label>
              <select
                value={selectedEmployee}
                onChange={(event) => setSelectedEmployee(Number(event.target.value))}
                className="w-full px-4 py-3 border-2 border-purple-200 rounded-xl focus:outline-none focus:border-purple-500 font-semibold text-gray-800"
                style={{
                  backgroundColor: `${getSelectedEmployeeColor()}20`
                }}
              >
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">シフト種別</label>
              <select
                value={selectedShiftType}
                onChange={(event) => setSelectedShiftType(event.target.value)}
                className="w-full px-4 py-3 border-2 border-purple-200 rounded-xl focus:outline-none focus:border-purple-500 font-semibold text-gray-800"
                style={{
                  backgroundColor:
                    selectedShiftType === '日勤'
                      ? '#FFF4E6'
                      : selectedShiftType === '夜勤'
                        ? '#E8EAF6'
                        : '#E8F5E9'
                }}
              >
                <option value="日勤">日勤 (9:00-21:00)</option>
                <option value="夜勤">夜勤 (21:00-翌9:00)</option>
                <option value="有給">有給休暇</option>
              </select>
            </div>
          </div>
          <div className="mt-4 p-4 bg-purple-50 rounded-xl">
            <p className="text-sm text-gray-700">
              <span className="font-bold" style={{ color: getSelectedEmployeeColor() }}>
                {employees.find((emp) => emp.id === selectedEmployee)?.name}
              </span>
              を
              <span className="font-bold mx-1">
                {selectedShiftType === '日勤'
                  ? '日勤'
                  : selectedShiftType === '夜勤'
                    ? '夜勤'
                    : '有給休暇'}
              </span>
              に{selectedShiftType === '有給' ? '設定' : '配置'}します。カレンダーの日付をクリックしてください。
            </p>
          </div>
        </div>

        <div
          className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-8 fade-in"
          style={{ animationDelay: '0.1s' }}
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Clock className="w-6 h-6 text-purple-600" />
              <h2 className="text-xl font-bold text-gray-800">月間スケジュール</h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => changeMonth(-1)}
                className="btn-primary px-4 py-2 bg-purple-100 text-purple-700 rounded-xl font-semibold hover:bg-purple-200"
              >
                ← 前月
              </button>
              <span className="px-4 py-2 bg-purple-50 rounded-xl font-semibold text-purple-700">
                {selectedMonth.year}年{selectedMonth.month + 1}月
              </span>
              <button
                onClick={() => changeMonth(1)}
                className="btn-primary px-4 py-2 bg-purple-100 text-purple-700 rounded-xl font-semibold hover:bg-purple-200"
              >
                次月 →
              </button>
            </div>
          </div>

          <div className="mb-6 grid grid-cols-5 gap-4">
            {employees.map((emp) => {
              const hours = employeeHours[emp.id];
              const paidLeaveDays = employeePaidLeave[emp.id];
              const isTarget = hours === 180;
              const isOver = hours > 180;
              const isSelected = emp.id === selectedEmployee;

              return (
                <div
                  key={emp.id}
                  className={`hours-display p-4 rounded-xl ${isSelected ? 'selected-indicator' : ''}`}
                  style={{
                    backgroundColor: `${emp.color}20`,
                    borderLeft: `4px solid ${emp.color}`,
                    border: isSelected ? `3px solid ${emp.color}` : undefined
                  }}
                >
                  <div className="font-bold text-gray-800 mb-1">{emp.name}</div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-2xl font-bold ${
                        isTarget ? 'text-green-600' : isOver ? 'text-red-600' : 'text-orange-600'
                      }`}
                    >
                      {hours}h
                    </span>
                    {!isTarget && (
                      <AlertCircle className={`w-4 h-4 ${isOver ? 'text-red-600' : 'text-orange-600'}`} />
                    )}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    目標: 180h {isTarget ? '達成!' : isOver ? `(+${hours - 180}h)` : `(-${180 - hours}h)`}
                  </div>
                  {paidLeaveDays > 0 && (
                    <div className="mt-2 flex items-center gap-1 text-xs text-green-700">
                      <Coffee className="w-3 h-3" />
                      <span>有給 {paidLeaveDays}日</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="overflow-x-auto mb-6">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr>
                  <th className="p-3 text-left font-bold text-gray-700 bg-purple-50 rounded-tl-xl">日付</th>
                  <th className="p-3 text-center font-bold text-gray-700 bg-purple-50">
                    <div className="flex items-center justify-center gap-1">
                      <Sun className="w-4 h-4 text-orange-500" />
                      日勤
                    </div>
                  </th>
                  <th className="p-3 text-center font-bold text-gray-700 bg-purple-50 rounded-tr-xl">
                    <div className="flex items-center justify-center gap-1">
                      <Moon className="w-4 h-4 text-indigo-500" />
                      夜勤
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
                  const special = isSpecialDay(day);
                  const dayShiftCount = getDayShiftCount(day);
                  const needsMore = special && dayShiftCount < 2;
                  const isFull = special && dayShiftCount >= 2;
                  const hasViolation = hasNightShiftViolation(day);
                  const isExtended = isNightShiftExtended(day);
                  const isShortened = isDayShiftShortened(day);

                  const dayShiftEmployees = schedule[day]?.['日勤'] || [];
                  const nightShiftEmployees = schedule[day]?.['夜勤'] || [];
                  const paidLeaveEmployees = paidLeave[day] || [];

                  return (
                    <tr key={day} className={`border-t-2 border-purple-50 ${hasViolation ? 'warning-row' : ''}`}>
                      <td className={`p-3 font-bold text-gray-800 ${special ? 'special-day' : ''}`}>
                        <div className="flex items-center gap-2">
                          <span>
                            {day}日 ({getDayOfWeekText(day)})
                          </span>
                          {hasViolation && <AlertTriangle className="w-4 h-4 text-orange-600" />}
                        </div>
                        {special && (
                          <div
                            className={`text-xs mt-1 font-semibold ${
                              needsMore ? 'text-red-600' : isFull ? 'text-green-600' : 'text-gray-500'
                            }`}
                          >
                            日勤{dayShiftCount}/2名
                          </div>
                        )}
                        {paidLeaveEmployees.length > 0 && (
                          <div className="mt-1 flex items-center gap-1">
                            <Coffee className="w-3 h-3 text-green-600" />
                            <span className="text-xs text-green-700 font-semibold">有給{paidLeaveEmployees.length}名</span>
                          </div>
                        )}
                      </td>
                      <td
                        className={`p-3 shift-cell ${special ? 'special-day' : ''} ${isShortened ? 'shortened-day-shift' : ''}`}
                        onClick={() => handleCellClick(day, '日勤')}
                        style={{
                          backgroundColor: isShortened
                            ? shiftColors['日勤短縮']
                            : selectedShiftType === '日勤'
                              ? `${getSelectedEmployeeColor()}10`
                              : shiftColors['日勤']
                        }}
                      >
                        <div className="min-h-[40px] flex flex-col gap-1 items-center justify-center">
                          <div className="flex flex-wrap gap-1 items-center justify-center">
                            {dayShiftEmployees.map((empId) => {
                              const emp = employees.find((employee) => employee.id === empId);
                              return (
                                <span key={empId} className="employee-badge" style={{ backgroundColor: emp?.color }}>
                                  {emp?.name}
                                </span>
                              );
                            })}
                            {paidLeaveEmployees.map((empId) => {
                              const emp = employees.find((employee) => employee.id === empId);
                              if (!dayShiftEmployees.includes(empId) && !nightShiftEmployees.includes(empId)) {
                                return (
                                  <span key={empId} className="employee-badge" style={{ backgroundColor: '#4CAF50' }}>
                                    {emp?.name}(有給)
                                  </span>
                                );
                              }
                              return null;
                            })}
                            {dayShiftEmployees.length === 0 && paidLeaveEmployees.length === 0 && (
                              <span className="text-gray-400 text-xs">クリックして配置</span>
                            )}
                          </div>
                          {isShortened && dayShiftEmployees.length > 0 && (
                            <div className="flex items-center gap-1 text-xs font-bold text-orange-700">
                              <ClockIcon className="w-3 h-3" />
                              9:00-20:00 (11h)
                            </div>
                          )}
                        </div>
                      </td>
                      <td
                        className={`p-3 shift-cell ${special ? 'special-day' : ''} ${hasViolation ? 'violation-cell' : ''} ${isExtended ? 'extended-night-shift' : ''}`}
                        onClick={() => handleCellClick(day, '夜勤')}
                        style={{
                          backgroundColor: hasViolation
                            ? '#FFEBEE'
                            : isExtended
                              ? shiftColors['夜勤延長']
                              : selectedShiftType === '夜勤'
                                ? `${getSelectedEmployeeColor()}10`
                                : shiftColors['夜勤']
                        }}
                      >
                        <div className="min-h-[40px] flex flex-col gap-1 items-center justify-center">
                          <div className="flex flex-wrap gap-1 items-center justify-center">
                            {nightShiftEmployees.map((empId) => {
                              const emp = employees.find((employee) => employee.id === empId);
                              return (
                                <span key={empId} className="employee-badge" style={{ backgroundColor: emp?.color }}>
                                  {emp?.name}
                                </span>
                              );
                            })}
                            {nightShiftEmployees.length === 0 && (
                              <span className="text-gray-400 text-xs">クリックして配置</span>
                            )}
                          </div>
                          {isExtended && nightShiftEmployees.length > 0 && (
                            <div className="flex items-center gap-1 text-xs font-bold text-indigo-700">
                              <ClockIcon className="w-3 h-3" />
                              21:00-翌10:00 (13h)
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mb-4 p-4 bg-indigo-50 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <ClockIcon className="w-5 h-5 text-indigo-600" />
              <h3 className="font-bold text-indigo-800">終了時刻調整について</h3>
            </div>
            <p className="text-sm text-indigo-700 mb-2">
              月・水・金の日勤が1名のみの場合、前後のシフト終了時刻が自動調整されます：
            </p>
            <ul className="text-sm text-indigo-700 ml-4 space-y-1">
              <li>• <strong>前日夜勤:</strong> 21:00-翌10:00（13時間）← 終了を1時間延長</li>
              <li>• <strong>当日日勤:</strong> 9:00-20:00（11時間）← 終了を1時間短縮</li>
              <li>• <strong>合計:</strong> 24時間で調整され、月間180時間目標を維持</li>
            </ul>
          </div>

          <div className="flex gap-3 flex-wrap">
            <button
              onClick={clearSchedule}
              className="btn-primary flex-1 bg-gray-600 text-white py-3 px-6 rounded-xl font-semibold flex items-center justify-center gap-2"
            >
              <Trash2 className="w-5 h-5" />
              クリア
            </button>
            <button
              onClick={exportSchedule}
              className="btn-primary flex-1 bg-green-600 text-white py-3 px-6 rounded-xl font-semibold flex items-center justify-center gap-2"
            >
              <Download className="w-5 h-5" />
              エクスポート
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
