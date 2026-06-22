const SPECIAL_CHARS = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/;

export function calculatePasswordStrength(password) {
  if (!password) {
    return {
      score: 0,
      level: "none",
      label: "",
      percentage: 0,
      checks: {
        length: false,
        uppercase: false,
        lowercase: false,
        number: false,
        specialChar: false
      }
    };
  }

  let score = 0;
  const checks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    specialChar: SPECIAL_CHARS.test(password)
  };

  if (password.length >= 12) score += 2;
  else if (checks.length) score += 1;
  if (checks.uppercase) score += 1;
  if (checks.lowercase) score += 1;
  if (checks.number) score += 1;
  if (checks.specialChar) score += 1;
  if (password.length >= 16) score += 1;

  let level = "weak";
  let label = "Insecure";
  if (score > 2 && score <= 4) {
    level = "fair";
    label = "Barely Secure";
  } else if (score > 4 && score <= 6) {
    level = "good";
    label = "Good Enough";
  } else if (score > 6) {
    level = "strong";
    label = "Secure";
  }

  return {
    score,
    level,
    label,
    percentage: Math.min(100, (score / 8) * 100),
    checks
  };
}

export function validatePassword(password) {
  const strength = calculatePasswordStrength(password);

  if (!password || password.length < 8) {
    return { isValid: false, message: "Password must be at least 8 characters" };
  }
  if (!strength.checks.uppercase) {
    return { isValid: false, message: "Password must contain at least one uppercase letter" };
  }
  if (!strength.checks.lowercase) {
    return { isValid: false, message: "Password must contain at least one lowercase letter" };
  }
  if (!strength.checks.number) {
    return { isValid: false, message: "Password must contain at least one number" };
  }
  if (!strength.checks.specialChar) {
    return { isValid: false, message: "Password must contain at least one special character" };
  }

  return { isValid: true, message: "Password meets all requirements" };
}
