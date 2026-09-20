'use client'

import { useActionState, useRef, useState } from 'react'
import Image from 'next/image'
import { uploadAvatar, EMPTY_FORM_STATE } from '@/app/(app)/actions'

export function AvatarUpload({ currentUrl }: { currentUrl: string | null }) {
  const [state, formAction, pending] = useActionState(uploadAvatar, EMPTY_FORM_STATE)
  const [preview, setPreview] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const src = preview ?? currentUrl
  const initials = '?'

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    setPreview(URL.createObjectURL(f))
  }

  return (
    <div className="rounded-[var(--radius-card)] border border-rule bg-surface p-6">
      <p className="eyebrow mb-4">Logo / photo</p>

      <form action={formAction} className="flex items-center gap-5">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="relative size-20 shrink-0 overflow-hidden rounded-full border-2 border-dashed border-rule bg-paper hover:border-ink focus:outline-none focus:ring-2 focus:ring-ink"
          aria-label="Choose image"
        >
          {src ? (
            <Image
              src={src}
              alt="Dealership logo"
              fill
              className="object-cover"
              unoptimized
            />
          ) : (
            <span className="flex size-full items-center justify-center text-[11px] text-ink-soft">
              Upload
            </span>
          )}
        </button>

        <div className="min-w-0 flex-1">
          <input
            ref={inputRef}
            name="avatar"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFile}
            className="sr-only"
          />

          <p className="text-[13px] text-ink">
            {preview ? 'Ready to save' : currentUrl ? 'Click the circle to change' : 'Click the circle to upload'}
          </p>
          <p className="mt-0.5 text-[12px] text-ink-soft">JPEG, PNG or WebP · max 2 MB</p>

          {state.error && (
            <p role="alert" className="mt-1.5 text-[12px]" style={{ color: 'var(--color-signal-text)' }}>
              {state.error}
            </p>
          )}
          {state.ok && !preview && (
            <p role="status" className="mt-1.5 text-[12px]" style={{ color: 'var(--color-margin-text)' }}>
              Saved.
            </p>
          )}

          {preview && (
            <button
              type="submit"
              disabled={pending}
              className="mt-3 rounded bg-ink px-3 py-1.5 text-[12.5px] font-semibold text-paper disabled:opacity-50"
            >
              {pending ? 'Uploading…' : 'Save photo'}
            </button>
          )}
        </div>
      </form>
    </div>
  )
}
