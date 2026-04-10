import { useState } from 'react'
import { Calendar, ArrowRight, MoreHorizontal } from 'lucide-react'
import { Link } from 'react-router-dom'
import { parseISO, format, isToday, isTomorrow } from 'date-fns'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { SectionHeader } from './SectionHeader'
import type { DailySummaryMeeting } from '@/api/types'

interface MeetingsProps {
  meetings: DailySummaryMeeting[]
  advisorName?: string
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

const MEETING_COLORS = [
  'bg-emerald-400',
  'bg-blue-500',
  'bg-violet-500',
  'bg-amber-400',
  'bg-pink-400',
]

function resolveName(name: string, advisorName?: string): string {
  return name.replace(/\{\{ADVISOR_NAME\}\}/g, advisorName || 'Advisor')
}

export function Meetings({ meetings, advisorName }: MeetingsProps) {
  // Group meetings by date
  const grouped: Record<string, DailySummaryMeeting[]> = {}
  for (const m of meetings) {
    if (!grouped[m.date]) grouped[m.date] = []
    grouped[m.date].push(m)
  }

  const sortedDates = Object.keys(grouped).sort()
  const [selectedDate, setSelectedDate] = useState(sortedDates[0] || '')

  if (meetings.length === 0) return null

  const visibleMeetings = grouped[selectedDate] || []

  // Global color index based on position across all meetings
  const globalStartIdx = sortedDates.slice(0, sortedDates.indexOf(selectedDate)).reduce((sum, d) => sum + (grouped[d]?.length || 0), 0)

  return (
    <div className="rounded-xl bg-white dark:bg-card border border-border/60 shadow-sm p-5">
      <SectionHeader
        icon={Calendar}
        title="Your Meetings"
        count={meetings.length}
      />

      {/* Day tabs — clickable */}
      <div className="flex items-center gap-3 mb-5">
        {sortedDates.map((date) => {
          const d = parseISO(date)
          const label = isToday(d) ? 'Today' : isTomorrow(d) ? 'Tomorrow' : format(d, 'EEE, MMM d')
          const isSelected = date === selectedDate

          return (
            <button
              key={date}
              onClick={() => setSelectedDate(date)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                isSelected
                  ? 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300'
                  : 'text-muted-foreground hover:bg-neutral-100 dark:hover:bg-neutral-800'
              }`}
            >
              {label}
            </button>
          )
        })}
      </div>

      {/* Meeting list for selected date */}
      <div className="space-y-3">
        {visibleMeetings.map((meeting, idx) => {
          const color = MEETING_COLORS[(globalStartIdx + idx) % MEETING_COLORS.length]

          return (
            <div
              key={meeting.id}
              className="flex items-start gap-3 group"
            >
              <div className={`w-1 shrink-0 rounded-full self-stretch ${color}`} />

              <div className="flex-1 min-w-0 py-0.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-sm font-semibold text-foreground">{meeting.clientName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex -space-x-1.5">
                      {meeting.attendees.slice(0, 3).map((raw) => {
                        const name = resolveName(raw, advisorName)
                        return (
                          <Avatar key={name} className="h-6 w-6 ring-2 ring-white dark:ring-card">
                            <AvatarFallback className="text-[9px] bg-neutral-100 dark:bg-neutral-800 text-foreground/70">
                              {getInitials(name)}
                            </AvatarFallback>
                          </Avatar>
                        )
                      })}
                    </div>
                    <button className="h-6 w-6 flex items-center justify-center rounded-md text-muted-foreground/50 hover:text-muted-foreground hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors opacity-0 group-hover:opacity-100">
                      <MoreHorizontal className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{meeting.topic}</p>
                <span className="text-[11px] text-muted-foreground/70 font-mono">{meeting.time}</span>

                {meeting.hasBrief && (
                  <div className="mt-1.5">
                    <Link
                      to={`/insights/meetings/${meeting.meetingId}`}
                      className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <ArrowRight className="h-3 w-3" />
                      {meeting.briefLabel || 'Meeting brief'}
                    </Link>
                  </div>
                )}
              </div>
            </div>
          )
        })}

        {visibleMeetings.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-4">No meetings on this day</p>
        )}
      </div>
    </div>
  )
}
