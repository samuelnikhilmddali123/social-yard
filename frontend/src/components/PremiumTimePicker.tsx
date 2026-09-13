import React from 'react';

interface PremiumTimePickerProps {
  value: string; // "HH:mm" format (24h)
  onChange: (time: string) => void;
  minTime?: string; // "HH:mm" format (24h)
}

const PremiumTimePicker: React.FC<PremiumTimePickerProps> = ({ value, onChange, minTime }) => {
  const [hours24, minutes] = value.split(':').map(Number);
  const ampm = hours24 >= 12 ? 'PM' : 'AM';
  const hours12 = hours24 % 12 || 12;

  const isTimeDisabled = (h: number, m: number, ap: string) => {
    if (!minTime) return false;
    let h24 = h;
    if (ap === 'PM' && h < 12) h24 += 12;
    if (ap === 'AM' && h === 12) h24 = 0;
    
    const [minH, minM] = minTime.split(':').map(Number);
    if (h24 < minH) return true;
    if (h24 === minH && m < minM) return true;
    return false;
  };

  const handleHourSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    let newH = parseInt(e.target.value);
    if (ampm === 'PM' && newH < 12) newH += 12;
    if (ampm === 'AM' && newH === 12) newH = 0;
    onChange(`${String(newH).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`);
  };

  const handleMinuteSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(`${String(hours24).padStart(2, '0')}:${String(e.target.value).padStart(2, '0')}`);
  };

  const handleAMPMSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newAMPM = e.target.value;
    let newH = hours12;
    if (newAMPM === 'PM' && hours12 < 12) newH += 12;
    if (newAMPM === 'AM' && hours12 === 12) newH = 0;
    onChange(`${String(newH).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`);
  };

  return (
    <div className="w-[220px] bg-white rounded-2xl p-4 shadow-2xl border border-slate-100 flex gap-2 ring-1 ring-slate-900/5">
      <select 
        value={hours12} 
        onChange={handleHourSelect}
        className="flex-1 text-center bg-slate-50 border border-slate-200 rounded-lg py-2.5 text-sm font-semibold focus:outline-none focus:border-slate-400 cursor-pointer text-slate-800"
      >
        {Array.from({ length: 12 }, (_, i) => i + 1).map(h => {
          // Check if ALL minutes in this hour/ampm are disabled
          const allDisabled = Array.from({ length: 60 }, (_, i) => i).every(m => isTimeDisabled(h, m, ampm));
          return <option key={h} value={h} disabled={allDisabled}>{h}</option>;
        })}
      </select>
      
      <span className="flex items-center text-slate-300 font-bold">:</span>
      
      <select 
        value={minutes} 
        onChange={handleMinuteSelect}
        className="flex-1 text-center bg-slate-50 border border-slate-200 rounded-lg py-2.5 text-sm font-semibold focus:outline-none focus:border-slate-400 cursor-pointer text-slate-800"
      >
        {Array.from({ length: 60 }, (_, i) => i).map(m => (
          <option key={m} value={m} disabled={isTimeDisabled(hours12, m, ampm)}>{String(m).padStart(2, '0')}</option>
        ))}
      </select>
      
      <div className="w-2" />
      
      <select 
        value={ampm} 
        onChange={handleAMPMSelect}
        className="flex-1 text-center bg-slate-50 border border-slate-200 rounded-lg py-2.5 text-sm font-bold focus:outline-none focus:border-slate-400 cursor-pointer text-slate-800"
      >
        <option value="AM" disabled={isTimeDisabled(hours12, minutes, 'AM')}>AM</option>
        <option value="PM" disabled={isTimeDisabled(hours12, minutes, 'PM')}>PM</option>
      </select>
    </div>
  );
};

export default PremiumTimePicker;
