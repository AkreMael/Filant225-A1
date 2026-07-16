/**
 * Obfuscates a phone number string (digits) to a secure public ID string.
 */
export function encodeAdId(phone: string): string {
  if (!phone) return "";
  const cleanPhone = phone.replace(/\D/g, "");
  const key = [3, 7, 1, 9, 4, 8, 2, 5, 6, 0];
  let scrambled = "";
  for (let i = 0; i < cleanPhone.length; i++) {
    const digit = parseInt(cleanPhone[i], 10);
    const shifted = (digit + key[i % key.length]) % 10;
    scrambled += shifted;
  }
  const num = parseInt("1" + scrambled, 10);
  return "FL-" + num.toString(36).toUpperCase();
}

/**
 * Decodes a secure public ID string back to the sanitized phone number.
 */
export function decodeAdId(publicId: string): string {
  if (!publicId) return "";
  let cleanId = publicId.trim();
  if (cleanId.startsWith("FL-")) {
    cleanId = cleanId.substring(3);
  } else {
    // For backward compatibility, if it's already a clean phone number
    const onlyDigits = cleanId.replace(/\D/g, "");
    if (onlyDigits.length >= 8) return onlyDigits;
  }
  
  try {
    const parsed = parseInt(cleanId, 36);
    if (isNaN(parsed)) return "";
    const scrambled = parsed.toString().substring(1);
    
    const key = [3, 7, 1, 9, 4, 8, 2, 5, 6, 0];
    let phone = "";
    for (let i = 0; i < scrambled.length; i++) {
      const digit = parseInt(scrambled[i], 10);
      let shifted = (digit - key[i % key.length]) % 10;
      if (shifted < 0) shifted += 10;
      phone += shifted;
    }
    return phone;
  } catch (e) {
    return cleanId.replace(/\D/g, "");
  }
}
