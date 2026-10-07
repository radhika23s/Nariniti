import React, { useMemo } from 'react';

interface PasswordStrengthProps {
  password?: string;
}

export default function PasswordStrength({ password = '' }: PasswordStrengthProps) {
  const strength = useMemo(() => {
    if (!password) return 0;
    let score = 0;
    if (password.length > 7) score += 1;
    if (password.length > 11) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[a-z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;

    // Normalize to 0-4
    if (score > 4) return 4;
    return score;
  }, [password]);

  const getStrengthLabel = () => {
    if (!password) return '';
    if (strength <= 1) return 'Weak';
    if (strength === 2) return 'Fair';
    if (strength === 3) return 'Good';
    return 'Strong';
  };

  const getStrengthColor = () => {
    if (strength <= 1) return 'bg-red-500';
    if (strength === 2) return 'bg-yellow-500';
    if (strength === 3) return 'bg-blue-500';
    return 'bg-green-500';
  };

  if (!password) return null;

  return (
    <div className="mt-2">
      <div className="flex gap-1 mb-1">
        {[1, 2, 3, 4].map((level) => (
          <div
            key={level}
            className={`h-1.5 flex-1 rounded-full ${level <= strength ? getStrengthColor() : 'bg-slate-200'}`}
          />
        ))}
      </div>
      <p className="text-xs text-slate-500 text-right font-medium">
        {getStrengthLabel()}
      </p>
    </div>
  );
}
