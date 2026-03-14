'use client'

interface FilterBarProps {
  tags: string[]
  active: string
  onChange: (tag: string) => void
}

export default function FilterBar({ tags, active, onChange }: FilterBarProps) {
  if (tags.length === 0) return null

  return (
    <div className="flex flex-wrap gap-2 mb-8">
      <button
        onClick={() => onChange('all')}
        className={`px-4 py-1.5 text-xs uppercase tracking-widest rounded-full border transition-colors ${
          active === 'all'
            ? 'border-stone-800 text-stone-800 bg-stone-100'
            : 'border-stone-300 text-stone-500 hover:border-stone-500 hover:text-stone-700'
        }`}
      >
        All
      </button>
      {tags.map((tag) => (
        <button
          key={tag}
          onClick={() => onChange(tag)}
          className={`px-4 py-1.5 text-xs uppercase tracking-widest rounded-full border transition-colors ${
            active === tag
              ? 'border-stone-800 text-stone-800 bg-stone-100'
              : 'border-stone-300 text-stone-500 hover:border-stone-500 hover:text-stone-700'
          }`}
        >
          {tag}
        </button>
      ))}
    </div>
  )
}
