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
            ? 'border-white text-white bg-white/10'
            : 'border-white/20 text-gray-400 hover:border-white/50 hover:text-gray-200'
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
              ? 'border-white text-white bg-white/10'
              : 'border-white/20 text-gray-400 hover:border-white/50 hover:text-gray-200'
          }`}
        >
          {tag}
        </button>
      ))}
    </div>
  )
}
