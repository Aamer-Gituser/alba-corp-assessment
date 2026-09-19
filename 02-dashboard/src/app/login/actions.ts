'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

export type AuthState = { error: string | null; notice: string | null }

const credentials = z.object({
  email: z.string().email('Enter a valid email address.'),
  password: z.string().min(6, 'Passwords are at least 6 characters.'),
})

export async function signIn(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const parsed = credentials.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message, notice: null }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword(parsed.data)

  if (error) {
    return { error: 'That email and password combination does not match.', notice: null }
  }

  revalidatePath('/', 'layout')
  redirect('/')
}

export async function signUp(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const parsed = credentials.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message, notice: null }
  }

  const dealership = String(formData.get('dealership') || '').trim()
  const supabase = await createClient()

  const { data, error } = await supabase.auth.signUp({
    ...parsed.data,
    options: {
      data: {
        dealership_name: dealership || 'My Dealership',
        display_name: parsed.data.email.split('@')[0],
      },
    },
  })

  if (error) {
    return { error: error.message, notice: null }
  }

  // Projects with email confirmation on return a user but no session.
  if (data.user && !data.session) {
    return {
      error: null,
      notice: 'Account created. Confirm the email we sent, then sign in.',
    }
  }

  revalidatePath('/', 'layout')
  redirect('/')
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/login')
}
