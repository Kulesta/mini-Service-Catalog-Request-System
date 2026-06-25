const DAY_MAP = { sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6 };

function generateTimeSlots(startTime, endTime, slotDuration, bookedSlots = []) {
    const slots = [];
    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);
    let currentMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    while (currentMinutes + slotDuration <= endMinutes) {
        const h = Math.floor(currentMinutes / 60);
        const m = currentMinutes % 60;
        const time = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
        const isBooked = bookedSlots.includes(time);
        slots.push({ time, available: !isBooked });
        currentMinutes += slotDuration;
    }

    return slots;
}

function getAvailableDates(services, daysAhead = 30) {
    if (!services || services.length === 0) return [];

    const allDays = new Set();
    for (const service of services) {
        const avail = service.availability;
        if (avail && avail.days && avail.days.length > 0) {
            avail.days.forEach(d => allDays.add(d));
        }
    }

    if (allDays.size === 0) return [];

    const dates = [];
    const today = new Date();
    for (let i = 1; i <= daysAhead; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        const dayOfWeek = date.getDay();
        const dayNames = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
        if (allDays.has(dayNames[dayOfWeek])) {
            dates.push({
                date: date.toISOString().split('T')[0],
                day: dayNames[dayOfWeek],
                label: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
            });
        }
    }

    return dates;
}

function getEarliestTimeSlot(services, bookedSlotsMap = {}) {
    let earliest = '23:59';
    let latest = '00:00';
    let maxDuration = 60;

    for (const service of services) {
        const avail = service.availability;
        if (!avail) continue;
        if (avail.start_time && avail.start_time < earliest) earliest = avail.start_time;
        if (avail.end_time && avail.end_time > latest) latest = avail.end_time;
        if (avail.slot_duration && avail.slot_duration > maxDuration) maxDuration = avail.slot_duration;
    }

    if (earliest === '23:59' || latest === '00:00') {
        earliest = '09:00';
        latest = '17:00';
    }

    const bookedTimes = Object.values(bookedSlotsMap).flat() || [];
    return generateTimeSlots(earliest, latest, maxDuration, bookedTimes);
}

module.exports = { generateTimeSlots, getAvailableDates, getEarliestTimeSlot, DAY_MAP };
