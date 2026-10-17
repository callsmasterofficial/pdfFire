import React, { useState } from "react";
import { ProtectPdfOptions } from "@/lib/pdf/operations/protect";
import { Eye, EyeOff, Lock, KeyRound } from "lucide-react";

interface ProtectPasswordFormProps {
  options: ProtectPdfOptions;
  onChange: (options: ProtectPdfOptions) => void;
  confirmPass: string;
  onConfirmChange: (val: string) => void;
}

export function ProtectPasswordForm({
  options,
  onChange,
  confirmPass,
  onConfirmChange,
}: ProtectPasswordFormProps) {
  const [showUserPass, setShowUserPass] = useState(false);
  const [showOwner, setShowOwner] = useState(false);

  const update = (patch: Partial<ProtectPdfOptions>) => onChange({ ...options, ...patch });

  const getStrength = (p: string) => {
    if (!p) return { label: "None", color: "bg-muted text-muted-foreground", width: "0%" };
    if (p.length < 6) return { label: "Weak", color: "bg-destructive text-destructive-foreground", width: "30%" };
    if (p.length < 10 || !/[0-9]/.test(p) || !/[A-Z]/.test(p)) {
      return { label: "Moderate", color: "bg-chart-4 text-white", width: "65%" };
    }
    return { label: "Strong", color: "bg-success text-success-foreground", width: "100%" };
  };

  const strength = getStrength(options.userPassword || "");
  const isMatch = !confirmPass || options.userPassword === confirmPass;

  return (
    <div className="space-y-4 bg-card p-5 rounded-xl border border-border">
      <div className="flex items-center gap-2">
        <Lock className="size-4 text-primary" />
        <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
          Password & Encryption Cipher
        </h4>
      </div>

      {/* User Password */}
      <div>
        <label className="text-xs font-semibold text-foreground block mb-1">
          Open Password <span className="text-destructive">*</span>
        </label>
        <div className="relative">
          <input
            type={showUserPass ? "text" : "password"}
            value={options.userPassword || ""}
            onChange={(e) => update({ userPassword: e.target.value })}
            placeholder="Set password to open this PDF..."
            className="w-full text-xs bg-background border border-border rounded-lg pl-3 pr-9 py-2 text-foreground focus:ring-2 focus:ring-primary focus:outline-none"
          />
          <button
            type="button"
            onClick={() => setShowUserPass(!showUserPass)}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {showUserPass ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
          </button>
        </div>

        {/* Strength Meter */}
        {options.userPassword && (
          <div className="mt-2 space-y-1">
            <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full ${strength.color} transition-all duration-300`}
                style={{ width: strength.width }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
              <span>Security: {strength.label}</span>
              <span>{options.userPassword.length} characters</span>
            </div>
          </div>
        )}
      </div>

      {/* Confirm Password */}
      <div>
        <label className="text-xs font-semibold text-foreground block mb-1">
          Confirm Open Password <span className="text-destructive">*</span>
        </label>
        <input
          type="password"
          value={confirmPass}
          onChange={(e) => onConfirmChange(e.target.value)}
          placeholder="Re-type password to verify..."
          className={`w-full text-xs bg-background border rounded-lg px-3 py-2 text-foreground focus:ring-2 focus:ring-primary focus:outline-none ${
            !isMatch ? "border-destructive ring-1 ring-destructive" : "border-border"
          }`}
        />
        {!isMatch && (
          <p className="text-[11px] text-destructive mt-1">Passwords do not match.</p>
        )}
      </div>

      {/* Cipher Algorithm */}
      <div className="grid grid-cols-2 gap-3 pt-1">
        <div>
          <label className="text-xs font-semibold text-foreground block mb-1">Cipher Standard</label>
          <select
            value={options.algorithm || "AES-256"}
            onChange={(e) => update({ algorithm: e.target.value as "AES-256" | "RC4" })}
            className="w-full text-xs bg-background border border-border rounded-lg px-3 py-2 text-foreground focus:ring-2 focus:ring-primary focus:outline-none"
          >
            <option value="AES-256">AES-256 (PDF 2.0 - Strongest)</option>
            <option value="RC4">RC4 128-bit (Legacy Acrobat 5+)</option>
          </select>
        </div>

        <div className="flex items-end">
          <button
            type="button"
            onClick={() => setShowOwner(!showOwner)}
            className="text-xs text-primary hover:underline pb-2 font-medium inline-flex items-center gap-1"
          >
            <KeyRound className="size-3" />
            {showOwner ? "Hide Owner Password" : "+ Separate Owner Password"}
          </button>
        </div>
      </div>

      {/* Optional Owner Password */}
      {showOwner && (
        <div className="p-3 bg-muted/30 rounded-lg border border-border">
          <label className="text-xs font-semibold text-foreground block mb-1">
            Owner (Permissions) Password
          </label>
          <input
            type="password"
            value={options.ownerPassword || ""}
            onChange={(e) => update({ ownerPassword: e.target.value })}
            placeholder="Separate password required to alter restrictions..."
            className="w-full text-xs bg-background border border-border rounded-lg px-3 py-2 text-foreground focus:ring-2 focus:ring-primary focus:outline-none"
          />
        </div>
      )}
    </div>
  );
}
