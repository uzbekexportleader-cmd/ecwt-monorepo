/**
 * Push modulining testlardagi o'rnini bosuvchi.
 * Hech narsa qilmaydi — testlar push yubormasligi kerak.
 */
export const AndroidImportance = { HIGH: 4, MAX: 5 } as const;

export function setNotificationHandler(): void {}
export async function setNotificationChannelAsync(): Promise<void> {}
export async function getPermissionsAsync() {
  return { granted: false, canAskAgain: false };
}
export async function requestPermissionsAsync() {
  return { granted: false, canAskAgain: false };
}
export async function getExpoPushTokenAsync() {
  return { data: '' };
}
export async function setBadgeCountAsync(): Promise<void> {}
export async function getLastNotificationResponseAsync(): Promise<null> {
  return null;
}
export function addNotificationResponseReceivedListener() {
  return { remove(): void {} };
}
export function addNotificationReceivedListener() {
  return { remove(): void {} };
}
