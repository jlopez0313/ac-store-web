import { Loader2 } from "lucide-react"

export const Loading = () => {
  return (
    <div className="py-6 text-lg font-bold italic text-gray-500 flex gap-2">
        <Loader2 className="animate-spin" /> Cargando...
    </div>
  )
}
