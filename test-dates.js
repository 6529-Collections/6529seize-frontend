// Test script to verify date conversions
const pause = {
  start_time: 1718236800000,
  end_time: 1719619200000
};

console.log('Pause timestamps:');
console.log('Start:', pause.start_time);
console.log('End:', pause.end_time);

console.log('\nDates in UTC:');
const startDate = new Date(pause.start_time);
const endDate = new Date(pause.end_time);
console.log('Start (UTC):', startDate.toISOString());
console.log('End (UTC):', endDate.toISOString());

console.log('\nDates using toLocaleDateString (default):');
console.log('Start:', startDate.toLocaleDateString(undefined, { month: "short", day: "numeric" }));
console.log('End:', endDate.toLocaleDateString(undefined, { month: "short", day: "numeric" }));

console.log('\nDates in different timezones:');
console.log('Start (UTC):', startDate.toLocaleDateString('en-US', { month: "short", day: "numeric", timeZone: 'UTC' }));
console.log('End (UTC):', endDate.toLocaleDateString('en-US', { month: "short", day: "numeric", timeZone: 'UTC' }));

console.log('\nStart (America/New_York):', startDate.toLocaleDateString('en-US', { month: "short", day: "numeric", timeZone: 'America/New_York' }));
console.log('End (America/New_York):', endDate.toLocaleDateString('en-US', { month: "short", day: "numeric", timeZone: 'America/New_York' }));

console.log('\nStart (America/Los_Angeles):', startDate.toLocaleDateString('en-US', { month: "short", day: "numeric", timeZone: 'America/Los_Angeles' }));
console.log('End (America/Los_Angeles):', endDate.toLocaleDateString('en-US', { month: "short", day: "numeric", timeZone: 'America/Los_Angeles' }));

console.log('\nFull date/time in different timezones:');
console.log('Start (UTC):', startDate.toLocaleString('en-US', { timeZone: 'UTC' }));
console.log('Start (NY):', startDate.toLocaleString('en-US', { timeZone: 'America/New_York' }));
console.log('Start (LA):', startDate.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }));