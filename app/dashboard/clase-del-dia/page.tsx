'use client'

import { useEffect, useState } from 'react'
import { getSchedule, setSchedule, deleteSchedule, getWorkouts } from '@/lib/api/workouts'
import { Workout } from '@/lib/types/workout'
import { ChevronLeft, ChevronRight, Search, X, Loader2, Calendar, Star, Trash2 } from 'lucide-react'
import Image from 'next/image'
import { cn } from '@/lib/utils'

function toDateKey(date: Date) {
  return date.toISOString().slice(0, 10)
}

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [schedules, setSchedules] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(true)

  const [modalOpen, setModalOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  const [search, setSearch] = useState('')
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [searching, setSearching] = useState(false)

  // Calendar logic
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  
  // Rango para pedir a la API
  const fromDate = toDateKey(firstDay)
  const toDate = toDateKey(lastDay)

  const loadSchedule = async () => {
    setLoading(true)
    try {
      const data = await getSchedule(fromDate, toDate)
      const map: Record<string, any> = {}
      data.forEach(item => {
        map[item.scheduledDate] = item.workout
      })
      setSchedules(map)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSchedule()
  }, [currentDate])

  // Search workouts para el modal
  useEffect(() => {
    if (!modalOpen) return
    const delay = setTimeout(async () => {
      setSearching(true)
      try {
        const res = await getWorkouts({ search, pageSize: 8 })
        setWorkouts(res.items)
      } catch (e) {
        console.error(e)
      } finally {
        setSearching(false)
      }
    }, 400)
    return () => clearTimeout(delay)
  }, [search, modalOpen])

  // Handlers
  const handlePrevMonth = () => setCurrentDate(new Date(year, month - 1, 1))
  const handleNextMonth = () => setCurrentDate(new Date(year, month + 1, 1))

  const handleCellClick = (dateStr: string) => {
    setSelectedDate(dateStr)
    setSearch('')
    setModalOpen(true)
  }

  const handleAssign = async (workoutId: number) => {
    if (!selectedDate) return
    try {
      await setSchedule(selectedDate, workoutId)
      await loadSchedule()
      setModalOpen(false)
    } catch (e) {
      alert('Error al programar la clase')
    }
  }

  const handleRemove = async (dateStr: string) => {
    if (!confirm('¿Quitar la clase de este día?')) return
    try {
      await deleteSchedule(dateStr)
      await loadSchedule()
      if (selectedDate === dateStr) setModalOpen(false)
    } catch (e) {
      alert('Error al quitar la clase')
    }
  }

  // Render grid
  const startOffset = firstDay.getDay() // 0 = Sunday, 1 = Monday, etc.
  const daysInMonth = lastDay.getDate()
  const cells = []

  for (let i = 0; i < startOffset; i++) {
    cells.push(<div key={`empty-${i}`} className="p-4 border border-dark/5 bg-dark/5 opacity-50" />)
  }

  const todayStr = toDateKey(new Date())

  for (let d = 1; d <= daysInMonth; d++) {
    const dDate = new Date(year, month, d)
    const dateStr = toDateKey(dDate)
    const workout = schedules[dateStr]
    const isToday = dateStr === todayStr

    cells.push(
      <div
        key={dateStr}
        onClick={() => handleCellClick(dateStr)}
        className={cn(
          "min-h-[120px] p-2 border border-dark/10 bg-white hover:bg-secondary/20 transition-colors cursor-pointer group relative flex flex-col",
          isToday && "ring-2 ring-primary ring-inset bg-primary/5"
        )}
      >
        <div className="flex justify-between items-start mb-2">
          <span className={cn(
            "text-sm font-semibold h-7 w-7 flex items-center justify-center rounded-full",
            isToday ? "bg-primary text-white" : "text-dark/60"
          )}>
            {d}
          </span>
          {workout && (
            <button
              onClick={(e) => { e.stopPropagation(); handleRemove(dateStr) }}
              className="opacity-0 group-hover:opacity-100 p-1 text-red-500 hover:bg-red-50 rounded transition-all"
              title="Quitar clase"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
        
        {workout ? (
          <div className="mt-auto">
            <div className="aspect-video relative rounded-md overflow-hidden mb-1.5 shadow-sm border border-dark/5">
              {workout.thumbnailUrl ? (
                <Image src={workout.thumbnailUrl} alt={workout.title} fill className="object-cover" />
              ) : (
                <div className="bg-secondary/40 w-full h-full flex items-center justify-center">
                  <Star className="h-4 w-4 text-dark/30" />
                </div>
              )}
            </div>
            <p className="text-[10px] font-urwdin font-semibold text-dark leading-tight line-clamp-2">
              {workout.title}
            </p>
          </div>
        ) : (
          <div className="mt-auto opacity-0 group-hover:opacity-100 flex items-center justify-center text-xs text-primary/60 font-urwdin pb-2">
            + Programar
          </div>
        )}
      </div>
    )
  }

  const monthName = currentDate.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })
  const daysOfWeek = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

  return (
    <div className="space-y-6 animate-fade-in relative">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-melodrama text-3xl text-dark">Clase del día</h1>
          <p className="text-dark/60 font-urwdin mt-1">Programa las clases destacadas para tus alumnos.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-dark/10 overflow-hidden">
        {/* Header toolbar */}
        <div className="flex items-center justify-between p-4 border-b border-dark/10 bg-secondary/10">
          <h2 className="font-urwdin text-lg font-semibold text-dark capitalize">
            {monthName}
          </h2>
          <div className="flex items-center gap-2">
            <button onClick={handlePrevMonth} className="p-2 hover:bg-secondary rounded-lg transition-colors">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button onClick={handleNextMonth} className="p-2 hover:bg-secondary rounded-lg transition-colors">
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Days Header */}
        <div className="grid grid-cols-7 border-b border-dark/10 bg-dark/5">
          {daysOfWeek.map(d => (
            <div key={d} className="p-3 text-center text-xs font-semibold text-dark/60 uppercase">
              {d}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7">
          {loading ? (
            <div className="col-span-7 h-96 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary/40" />
            </div>
          ) : (
            cells
          )}
        </div>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-dark/40 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between p-4 border-b border-dark/10">
              <div>
                <h3 className="font-melodrama text-xl text-dark">Programar Clase</h3>
                <p className="text-sm text-dark/60 font-urwdin">{selectedDate}</p>
              </div>
              <button onClick={() => setModalOpen(false)} className="p-2 hover:bg-secondary rounded-full">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-4 border-b border-dark/10">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-dark/40" />
                <input
                  type="text"
                  autoFocus
                  placeholder="Buscar por nombre..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="input-base pl-9 w-full"
                />
              </div>
            </div>

            <div className="p-4 overflow-y-auto flex-1 space-y-2">
              {searching ? (
                <div className="py-8 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-dark/30" /></div>
              ) : workouts.length === 0 ? (
                <div className="py-8 text-center text-dark/40 font-urwdin text-sm">No se encontraron clases</div>
              ) : (
                workouts.map(w => (
                  <button
                    key={w.id}
                    onClick={() => handleAssign(w.id)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl border border-dark/10 hover:border-primary hover:bg-primary/5 transition-all text-left"
                  >
                    <div className="relative h-12 w-20 rounded overflow-hidden bg-secondary flex-shrink-0">
                      {w.thumbnailUrl && <Image src={w.thumbnailUrl} alt={w.title} fill className="object-cover" />}
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <p className="font-semibold text-dark text-sm truncate">{w.title}</p>
                      <p className="text-xs text-dark/50 font-urwdin">{w.category}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-dark/30" />
                  </button>
                ))
              )}
            </div>
            
            {schedules[selectedDate!] && (
              <div className="p-4 bg-red-50 border-t border-red-100">
                <button
                  onClick={() => handleRemove(selectedDate!)}
                  className="w-full text-red-600 font-semibold text-sm hover:underline"
                >
                  Quitar clase de este día
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
