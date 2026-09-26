
import React from 'react';
import { Text, makeStyles, tokens } from '@fluentui/react-components';

const useStyles = makeStyles({
  section: {
    display: 'flex', flexDirection: 'column', gap: '12px',
    padding: '16px 18px',
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: '10px',
    background: tokens.colorNeutralBackground1,
  },
  header: { display: 'flex', flexDirection: 'column', gap: '2px' },
  title: { fontSize: '14px', fontWeight: 600 },
  desc: { fontSize: '12px', color: tokens.colorNeutralForeground3 },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
    gap: '14px',
  },
  full: { gridColumn: '1 / -1' },
});

export interface FormSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

export function FormSection({ title, description, children }: FormSectionProps) {
  const s = useStyles();
  return (
    <div className={s.section}>
      <div className={s.header}>
        <Text className={s.title}>{title}</Text>
        {description && <Text className={s.desc}>{description}</Text>}
      </div>
      <div className={s.grid}>{children}</div>
    </div>
  );
}

export default FormSection;
