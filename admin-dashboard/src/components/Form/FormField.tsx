
import React from 'react';
import { Field, Input, Textarea, makeStyles, tokens } from '@fluentui/react-components';

const useStyles = makeStyles({
  field: { display: 'flex', flexDirection: 'column', gap: '4px' },
  hint: { fontSize: '12px', color: tokens.colorNeutralForeground3 },
});

export interface FormFieldProps {
  label: string;
  value: string | number;
  onChange: (v: string) => void;
  error?: string;
  required?: boolean;
  hint?: string;
  type?: 'text' | 'email' | 'number' | 'password' | 'tel' | 'url' | 'date';
  placeholder?: string;
  multiline?: boolean;
  rows?: number;
  disabled?: boolean;
  contentBefore?: React.ReactElement;
  onBlur?: () => void;
}

export function FormField({
  label, value, onChange, error, required, hint,
  type = 'text', placeholder, multiline, rows = 4, disabled, contentBefore, onBlur,
}: FormFieldProps) {
  const s = useStyles();
  const common = {
    value: String(value ?? ''),
    placeholder,
    disabled,
    onBlur,
    contentBefore,
    'aria-invalid': !!error,
  };

  return (
    <Field
      label={label + (required ? ' *' : '')}
      validationMessage={error}
      validationState={error ? 'error' : 'none'}
      className={s.field}
    >
      {multiline ? (
        <Textarea
          {...common}
          rows={rows}
          resize="vertical"
          onChange={(_, d) => onChange(d.value)}
        />
      ) : (
        <Input
          {...common}
          type={type}
          onChange={(_, d) => onChange(d.value)}
        />
      )}
      {hint && !error && <span className={s.hint}>{hint}</span>}
    </Field>
  );
}

export default FormField;
