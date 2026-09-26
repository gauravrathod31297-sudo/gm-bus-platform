
import React from 'react';
import { Button, Text, makeStyles, tokens } from '@fluentui/react-components';
import { SaveRegular, DismissRegular } from '@fluentui/react-icons';

const useStyles = makeStyles({
  bar: {
    display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap',
    padding: '12px 16px',
    borderRadius: '10px',
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    background: tokens.colorNeutralBackground2,
    position: 'sticky', bottom: '12px', zIndex: 5,
  },
  status: { flex: 1, minWidth: 140, fontSize: '13px', fontWeight: 500 },
  dirty: { color: '#b45309' },
  clean: { color: tokens.colorNeutralForeground3 },
});

export interface SaveBarProps {
  isDirty: boolean;
  onSave: () => void;
  onReset: () => void;
  saving?: boolean;
  saveLabel?: string;
  savingLabel?: string;
  disabled?: boolean;
}

export function SaveBar({
  isDirty, onSave, onReset, saving,
  saveLabel = 'Save changes', savingLabel = 'Saving…', disabled,
}: SaveBarProps) {
  const s = useStyles();
  return (
    <div className={s.bar}>
      <Text className={`${s.status} ${isDirty ? s.dirty : s.clean}`}>
        {isDirty ? '● Unsaved changes' : '✓ All changes saved'}
      </Text>
      <Button
        appearance="secondary"
        icon={<DismissRegular />}
        onClick={onReset}
        disabled={!isDirty || saving || disabled}
      >
        Reset
      </Button>
      <Button
        appearance="primary"
        icon={<SaveRegular />}
        onClick={onSave}
        disabled={!isDirty || saving || disabled}
      >
        {saving ? savingLabel : saveLabel}
      </Button>
    </div>
  );
}

export default SaveBar;
