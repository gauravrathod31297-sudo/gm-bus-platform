
import { useCallback, useMemo, useState } from 'react';

export type FormErrors<T> = Partial<Record<keyof T, string>>;
export type FormTouched<T> = Partial<Record<keyof T, boolean>>;

export interface UseFormOptions<T> {
  initialValues: T;
  validate?: (values: T) => FormErrors<T>;
}

export function useForm<T extends Record<string, any>>({
  initialValues,
  validate,
}: UseFormOptions<T>) {
  const [values, setValues] = useState<T>(initialValues);
  const [baseline, setBaseline] = useState<T>(initialValues);
  const [errors, setErrors] = useState<FormErrors<T>>({});
  const [touched, setTouched] = useState<FormTouched<T>>({});
  const [submitting, setSubmitting] = useState(false);

  const isDirty = useMemo(
    () => JSON.stringify(values) !== JSON.stringify(baseline),
    [values, baseline]
  );

  const setValue = useCallback(<K extends keyof T>(key: K, value: T[K]) => {
    setValues((v) => ({ ...v, [key]: value }));
    setTouched((t) => ({ ...t, [key]: true }));
  }, []);

  const setMany = useCallback((patch: Partial<T>) => {
    setValues((v) => ({ ...v, ...patch }));
  }, []);

  const runValidate = useCallback((): boolean => {
    if (!validate) return true;
    const errs = validate(values);
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }, [values, validate]);

  /** Reset form to a new baseline (e.g. after loading from API or after save). */
  const reset = useCallback((next?: T) => {
    const target = next ?? initialValues;
    setValues(target);
    setBaseline(target);
    setErrors({});
    setTouched({});
    setSubmitting(false);
  }, [initialValues]);

  const markAllTouched = useCallback(() => {
    const keys = Object.keys(values) as (keyof T)[];
    const next: FormTouched<T> = {};
    keys.forEach((k) => (next[k] = true));
    setTouched(next);
  }, [values]);

  return {
    values,
    errors,
    touched,
    submitting,
    isDirty,
    setValue,
    setValues,
    setMany,
    setErrors,
    setTouched,
    setSubmitting,
    validate: runValidate,
    reset,
    markAllTouched,
  };
}

export default useForm;
