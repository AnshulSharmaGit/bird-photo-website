export default function Footer({ photographerName, aiDisclaimer }: { photographerName: string; aiDisclaimer?: string }) {
  return (
    <footer className="mt-20 py-8 border-t border-white/10 text-center">
      {aiDisclaimer && (
        <p className="text-xs text-stone-500 italic mb-3 max-w-xl mx-auto">{aiDisclaimer}</p>
      )}
      <p className="text-xs uppercase tracking-widest text-stone-400">
        © {new Date().getFullYear()} {photographerName}
      </p>
    </footer>
  )
}
