import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PremiumCalendarProps {
  onDateSelect?: (date: string) => void;
  selectedDate?: string;
  endDate?: string;
  minDate?: string;
}

const PremiumCalendar: React.FC<PremiumCalendarProps> = ({ onDateSelect, selectedDate, endDate, minDate }) => {
  const [viewDate, setViewDate] = React.useState(() => {
    if (selectedDate && !isNaN(new Date(selectedDate).getTime())) {
      return new Date(selectedDate);
    }
    return new Date();
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const effectiveMinDate = minDate ? new Date(minDate) : today;
  effectiveMinDate.setHours(0, 0, 0, 0);

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const currentYear = viewDate.getFullYear();
  const currentMonth = viewDate.getMonth();

  const handlePrevMonth = () => setViewDate(new Date(currentYear, currentMonth - 1, 1));
  const handleNextMonth = () => setViewDate(new Date(currentYear, currentMonth + 1, 1));

  const handleDateClick = (dayInfo: any) => {
    const dateStr = `${dayInfo.year}-${String(dayInfo.month + 1).padStart(2, '0')}-${String(dayInfo.day).padStart(2, '0')}`;
    onDateSelect?.(dateStr);
  };

  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const daysOfWeek = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);

  const days = [];
  const prevMonthDays = getDaysInMonth(currentYear, currentMonth - 1);
  for (let i = firstDay - 1; i >= 0; i--) {
    days.push({ day: prevMonthDays - i, month: currentMonth - 1, year: currentYear, current: false });
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push({ day: i, month: currentMonth, year: currentYear, current: true });
  }
  const remainingCells = 42 - days.length;
  for (let i = 1; i <= remainingCells; i++) {
    days.push({ day: i, month: currentMonth + 1, year: currentYear, current: false });
  }

  return (
    <div className="w-full text-slate-800">
      <div className="flex items-center justify-between mb-3 px-1">
        <button onClick={handlePrevMonth} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors">
          <ChevronLeft size={16} />
        </button>
        <div className="font-bold text-[14px] md:text-[15px] text-slate-900 flex items-center gap-1.5">
          {months[currentMonth]}
          <span className="text-slate-400">{currentYear}</span>
        </div>
        <button onClick={handleNextMonth} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors">
          <ChevronRight size={16} />
        </button>
      </div>

      <div className="w-full grid grid-cols-7 gap-y-1 gap-x-1 justify-items-center">
        {daysOfWeek.map(d => (
          <div key={d} className="text-center text-[10px] font-bold text-slate-400 mb-2 tracking-wide">{d}</div>
        ))}
        {days.map((d, i) => {
          const dateStr = `${d.year}-${String(d.month + 1).padStart(2, '0')}-${String(d.day).padStart(2, '0')}`;
          const isSelected = selectedDate === dateStr;
          const isInRange = selectedDate && endDate && dateStr >= selectedDate && dateStr <= endDate;
          const checkDate = new Date(d.year, d.month, d.day);
          const isBeforeMin = checkDate < effectiveMinDate;
          const disabled = !d.current || isBeforeMin;

          return (
            <button
              key={i}
              type="button"
              onClick={() => !disabled && handleDateClick(d)}
              disabled={disabled}
              className={`h-8 w-8 md:h-9 md:w-9 rounded-lg text-xs md:text-sm font-semibold flex items-center justify-center transition-all ${
                isSelected 
                  ? 'bg-[#6C47FF] text-white shadow-md shadow-indigo-600/20' 
                  : isInRange
                    ? 'bg-[#6C47FF]/15 text-[#6C47FF] font-black border border-[#6C47FF]/35'
                    : disabled 
                      ? 'text-slate-200 cursor-not-allowed' 
                      : 'text-slate-700 hover:bg-indigo-50 hover:text-indigo-900'
              }`}
            >
              {d.day}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default PremiumCalendar;
