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
    <div className="fixed bottom-4 left-4 right-4 z-50 flex items-center justify-between bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-lg max-w-md mx-auto">
      <div className="flex items-center gap-3">
        <Download className="h-5 w-5" />
        <p className="text-sm font-medium">Instala la app para acceso rápido</p>
      </div>
      <button
        onClick={handleInstall}
        className="bg-white text-emerald-700 px-4 py-1.5 rounded-lg text-sm font-semibold hover:bg-emerald-50 transition-all duration-200"
      >
        Instalar
      </button>
    </div>
  )
}
