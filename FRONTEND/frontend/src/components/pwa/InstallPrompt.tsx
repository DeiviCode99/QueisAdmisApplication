import { useEffect, useState } from 'react'
import { Download } from 'lucide-react'

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<Event | null>(null)
  const [show, setShow] = useState(false)

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShow(true)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  if (!show) return null

  const handleInstall = () => {
    if (!deferredPrompt) return
    ;(deferredPrompt as Event & { prompt: () => void; userChoice: Promise<{ outcome: string }> }).prompt()
    ;(deferredPrompt as Event & { prompt: () => void; userChoice: Promise<{ outcome: string }> }).userChoice.then(({ outcome }) => {
      if (outcome === 'accepted') setShow(false)
      setDeferredPrompt(null)
    })
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 flex items-center justify-between clay-card px-4 py-3 max-w-md mx-auto shadow-[0_8px_24px_rgba(14,165,233,0.1),-4px_-4px_12px_rgba(255,255,255,0.7)]">
      <div className="flex items-center gap-3">
        <div className="bg-gradient-to-br from-brand-400 to-brand-500 p-2 rounded-[10px] shadow-[0_2px_8px_rgba(14,165,233,0.2),inset_0_1px_0_rgba(255,255,255,0.3)]">
          <Download className="h-5 w-5 text-white" />
        </div>
        <p className="text-sm font-medium text-brand-800">Instala la app para acceso rápido</p>
      </div>
      <button
        onClick={handleInstall}
        className="clay-btn px-4 py-1.5 bg-gradient-to-b from-brand-400 to-brand-500 text-white text-sm font-semibold"
      >
        Instalar
      </button>
    </div>
  )
}
