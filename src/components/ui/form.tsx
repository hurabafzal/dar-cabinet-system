// src/components/ui/form.tsx

"use client"

import * as React from "react"
import {
  FormProvider,
  UseFormReturn,
} from "react-hook-form"

interface FormProps {
  children: React.ReactNode
  form: UseFormReturn<any>
}

export function Form({ children, form }: FormProps) {
  return <FormProvider {...form}>{children}</FormProvider>
}
