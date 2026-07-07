export function bucketMs(value: number): string {
  if (value < 500) {
    return "0_500";
  }
  if (value < 1500) {
    return "500_1500";
  }
  if (value < 3000) {
    return "1500_3000";
  }
  if (value < 5000) {
    return "3000_5000";
  }
  if (value < 10000) {
    return "5000_10000";
  }
  return "10000_plus";
}
