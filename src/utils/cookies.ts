/**
 * Cookie utility functions for referral code management
 */

const REFERRAL_COOKIE_NAME = 'uptown_referral_code';
const REFERRAL_COOKIE_EXPIRY_DAYS = 1;

/**
 * Set a cookie with a specific expiry time
 */
export function setCookie(name: string, value: string, days: number): void {
  const date = new Date();
  date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
  const expires = `expires=${date.toUTCString()}`;
  document.cookie = `${name}=${value};${expires};path=/;SameSite=Lax`;
}

/**
 * Get a cookie value by name
 */
export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  
  const nameEQ = `${name}=`;
  const ca = document.cookie.split(';');
  
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    if (!c) continue;
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
}

/**
 * Delete a cookie by setting its expiry to the past
 */
export function deleteCookie(name: string): void {
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
}

/**
 * Set referral code in cookie (expires in 1 day)
 */
export function setReferralCode(code: string): void {
  setCookie(REFERRAL_COOKIE_NAME, code, REFERRAL_COOKIE_EXPIRY_DAYS);
}

/**
 * Get referral code from cookie
 */
export function getReferralCode(): string | null {
  return getCookie(REFERRAL_COOKIE_NAME);
}

/**
 * Clear referral code cookie
 */
export function clearReferralCode(): void {
  deleteCookie(REFERRAL_COOKIE_NAME);
}