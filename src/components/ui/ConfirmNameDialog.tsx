import {Button} from '@primer/react'
import {AlertIcon, XIcon} from '@primer/octicons-react'
import type {FormEvent} from 'react'

interface ConfirmNameDialogProps {
  title: string
  description: string
  name: string
  typedName: string
  confirmLabel: string
  isOpen: boolean
  isBusy?: boolean
  onTypedNameChange: (value: string) => void
  onCancel: () => void
  onConfirm: () => void
}

export function ConfirmNameDialog({
  title,
  description,
  name,
  typedName,
  confirmLabel,
  isOpen,
  isBusy = false,
  onTypedNameChange,
  onCancel,
  onConfirm,
}: ConfirmNameDialogProps) {
  if (!isOpen) {
    return null
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onConfirm()
  }

  const canConfirm = typedName === name && !isBusy

  return (
    <div className="dialog-backdrop" role="presentation">
      <section className="confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="confirm-dialog-title">
        <div className="confirm-dialog__header">
          <div className="confirm-dialog__icon">
            <AlertIcon size={18} />
          </div>
          <div>
            <h2 id="confirm-dialog-title" className="confirm-dialog__title">{title}</h2>
            <p className="confirm-dialog__description">{description}</p>
          </div>
          <Button className="secondary-button confirm-dialog__close" type="button" leadingVisual={XIcon} onClick={onCancel} aria-label="Close" />
        </div>

        <form className="confirm-dialog__form" onSubmit={handleSubmit}>
          <label className="login-field">
            Type <strong>{name}</strong> to confirm
            <input
              className="login-input"
              value={typedName}
              onChange={(event) => onTypedNameChange(event.target.value)}
              autoComplete="off"
              autoFocus
            />
          </label>
          <div className="confirm-dialog__actions">
            <Button className="secondary-button" type="button" onClick={onCancel} disabled={isBusy}>
              Cancel
            </Button>
            <Button className="danger-button" type="submit" disabled={!canConfirm}>
              {isBusy ? 'Deleting' : confirmLabel}
            </Button>
          </div>
        </form>
      </section>
    </div>
  )
}
