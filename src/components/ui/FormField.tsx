import React from "react";
import { useFormContext, Controller } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export interface Option {
  value: string;
  label: string;
  email?: string;
  desc?: string;
  lineItems?: any[];
}

export interface FormFieldProps {
  name: string;
  label: string;
  type?: "input" | "select" | "textarea" | "date";
  placeholder?: string;
  options?: Option[];
  disabled?: boolean;
}

export const FormField: React.FC<{ field: FormFieldProps }> = ({ field }) => {
  const { control } = useFormContext();
  const { name, label, type = "input", placeholder, options, disabled } = field;

  return (
    <div className="space-y-1">
      <Label htmlFor={name}>{label}</Label>
      <Controller
        name={name}
        control={control}
        render={({ field }) => {
          switch (type) {
            case "select":
                return (
                    <Select {...field} disabled={disabled}>
                    <option value="">Select...</option>
                    {options?.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                        {opt.label}
                        </option>
                    ))}
                    </Select>
                );
            case "textarea":
              return (
                <Textarea {...field} placeholder={placeholder} disabled={disabled} />
              );
            case "date":
              return (
                <Input {...field} type="date" placeholder={placeholder} disabled={disabled} />
              );
            default:
              return (
                <Input {...field} placeholder={placeholder} disabled={disabled} />
              );
          }
        }}
      />
    </div>
  );
};