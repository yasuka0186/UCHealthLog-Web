import type { ReactNode } from 'react'

interface PageShellProps {
  title: string
  description: string
  children?: ReactNode
}

export function PageShell({ title, description, children }: PageShellProps) {
  return (
    <section aria-labelledby="page-title" className="mx-auto max-w-4xl">
      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl" id="page-title">
          {title}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base dark:text-slate-300">
          {description}
        </p>
      </header>
      {children}
    </section>
  )
}
