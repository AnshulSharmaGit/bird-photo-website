'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import type { ContactFormData } from '@/types'

export default function ContactForm() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactFormData>()

  const onSubmit = async (data: ContactFormData) => {
    setStatus('loading')
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error()
      setStatus('success')
      reset()
    } catch {
      setStatus('error')
    }
  }

  const inputClass =
    'w-full bg-transparent border-b border-white/20 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-white/60 transition-colors text-sm'
  const errorClass = 'text-red-400 text-xs mt-1'

  if (status === 'success') {
    return (
      <div className="text-center py-12">
        <p className="text-white text-lg">Thank you for your message.</p>
        <p className="text-gray-400 text-sm mt-2">We&apos;ll get back to you soon.</p>
        <button
          onClick={() => setStatus('idle')}
          className="mt-6 text-xs uppercase tracking-widest text-gray-500 hover:text-white transition-colors"
        >
          Send another
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 max-w-lg mx-auto">
      <div>
        <input
          {...register('name', { required: 'Name is required' })}
          placeholder="Your name"
          className={inputClass}
        />
        {errors.name && <p className={errorClass}>{errors.name.message}</p>}
      </div>

      <div>
        <input
          {...register('email', {
            required: 'Email is required',
            pattern: { value: /^\S+@\S+\.\S+$/, message: 'Invalid email address' },
          })}
          placeholder="Email address"
          type="email"
          className={inputClass}
        />
        {errors.email && <p className={errorClass}>{errors.email.message}</p>}
      </div>

      <div>
        <textarea
          {...register('message', { required: 'Message is required', maxLength: { value: 2000, message: 'Max 2000 characters' } })}
          placeholder="Your message"
          rows={5}
          className={inputClass + ' resize-none'}
        />
        {errors.message && <p className={errorClass}>{errors.message.message}</p>}
      </div>

      {status === 'error' && (
        <p className="text-red-400 text-sm">Something went wrong. Please try again.</p>
      )}

      <button
        type="submit"
        disabled={status === 'loading'}
        className="w-full py-3 border border-white/30 text-xs uppercase tracking-widest text-white hover:bg-white hover:text-black transition-colors disabled:opacity-50"
      >
        {status === 'loading' ? 'Sending…' : 'Send Message'}
      </button>
    </form>
  )
}
