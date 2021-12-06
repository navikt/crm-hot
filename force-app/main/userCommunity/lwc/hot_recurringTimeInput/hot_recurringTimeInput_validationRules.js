let nowDate = new Date();

export function dateInPast(date) {
    date = new Date(date);
    let today = new Date(nowDate.getFullYear(), nowDate.getMonth(), nowDate.getDate(), 0, 0, 0, 0);
    return date.getTime() < today.getTime() ? 'Du kan ikke bestille tid i fortiden' : '';
}

export function startBeforeEnd(endDate, startDate) {
    startDate = new Date(startDate);
    endDate = new Date(endDate);
    return startDate.getTime() > endDate.getTime() ? 'Start tid må være før slutt tid.' : '';
}

export function startDateBeforeRecurringEndDate(recurringEndDate, startDate) {
    return new Date(startDate).getTime() > new Date(recurringEndDate) ? 'Slutt dato må være etter start dato' : '';
}
export function restrictTheNumberOfDays(recurringEndDate, startDate) {
    return new Date(recurringEndDate) - new Date(startDate).getTime() > 199 * 24 * 3600000 && startDate != null
        ? 'Du kan ikke legge inn gjentagende bestilling med en varighet på over 6 måneder'
        : '';
}
export function chosenDaysWithinPeriod(type, days, recurringEndDate, startDate) {
    if (type === 'Daily') {
        return '';
    }

    startDate = new Date(startDate);
    recurringEndDate = new Date(recurringEndDate);
    if (recurringEndDate - startDate.getTime() < 7 * 24 * 3600000) {
        let daysMap = { sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6 };
        for (let day of days) {
            if (startDate.getDay() <= recurringEndDate.getDay()) {
                if (daysMap[day] >= startDate.getDay() && daysMap[day] <= recurringEndDate.getDay()) {
                    return '';
                }
            } else {
                if (daysMap[day] >= startDate.getDay() || daysMap[day] <= recurringEndDate.getDay()) {
                    return '';
                }
            }
        }
        return 'Velg en slutt dato slik at valgt dag faller innenfor perioden mellom start dato og slutt dato';
    }
    return '';
}
