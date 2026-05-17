import Link from "next/link";

export function Footer() {
  return (
    <footer className="w-full border-t border-slate-800/50 bg-black/30 backdrop-blur-sm py-6 mt-auto">
      <div className="max-w-7xl mx-auto px-4 flex flex-col items-center gap-2 text-center">
        <p className="text-[11px] text-slate-500 leading-relaxed max-w-xl">
          App VIP no aloja archivos en sus servidores. Todo el contenido es
          proporcionado con fines informativos.
        </p>
        <Link
          href="/legal"
          className="text-[10px] font-semibold text-slate-600 hover:text-slate-400 uppercase tracking-widest transition-colors"
        >
          DMCA / Términos Legales
        </Link>
      </div>
    </footer>
  );
}
