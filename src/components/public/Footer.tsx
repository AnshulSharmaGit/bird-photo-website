export default function Footer({ photographerName }: { photographerName: string }) {
  return (
    <footer className="mt-20 py-8 border-t border-white/10 text-center">
      <p className="text-xs uppercase tracking-widest text-stone-400">
        © {new Date().getFullYear()} {photographerName}
      </p>
    </footer>
  )
}
