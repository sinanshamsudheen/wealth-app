import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import {
  Handshake,
  ClipboardList,
  Flag,
  TrendingUp,
  Lightbulb,
  Users,
  DollarSign,
  UsersRound,
  ArrowUpRight,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { FlipCard } from '@/components/insights/FlipCard'
import { useAuthStore } from '@/store/useAuthStore'

const STATS = [
  {
    label: 'Watar AUM',
    value: '$4.25B',
    change: '13.8%',
    positive: true,
    icon: DollarSign,
    accent: 'text-emerald-600 dark:text-emerald-400',
    accentBg: 'bg-emerald-50 dark:bg-emerald-950/40',
    border: 'border-l-emerald-500',
  },
  {
    label: "My Team's AUM",
    value: '$4.25B',
    change: '22.3%',
    positive: true,
    icon: TrendingUp,
    accent: 'text-blue-600 dark:text-blue-400',
    accentBg: 'bg-blue-50 dark:bg-blue-950/40',
    border: 'border-l-blue-500',
  },
  {
    label: 'Number of Clients',
    value: '27',
    change: '25%',
    positive: true,
    icon: UsersRound,
    accent: 'text-violet-600 dark:text-violet-400',
    accentBg: 'bg-violet-50 dark:bg-violet-950/40',
    border: 'border-l-violet-500',
  },
]

interface ModuleConfig {
  name: string
  subtitle: string
  icon: typeof Handshake
  path: string | null
  badge: number | null
  color: string
  colorBg: string
  colorBorder: string
  badgeBg: string
}

const MODULES: ModuleConfig[] = [
  {
    name: 'Invictus Engage',
    subtitle: 'Manage your Prospects and Clients',
    icon: Handshake,
    path: null,
    badge: 5,
    color: 'text-emerald-600 dark:text-emerald-400',
    colorBg: 'bg-emerald-50 dark:bg-emerald-900/30',
    colorBorder: 'hover:border-emerald-400/60 dark:hover:border-emerald-500/40',
    badgeBg: 'bg-emerald-500',
  },
  {
    name: 'Invictus Plan',
    subtitle: 'Build Personalized Financial Plans',
    icon: ClipboardList,
    path: null,
    badge: 5,
    color: 'text-blue-600 dark:text-blue-400',
    colorBg: 'bg-blue-50 dark:bg-blue-900/30',
    colorBorder: 'hover:border-blue-400/60 dark:hover:border-blue-500/40',
    badgeBg: 'bg-blue-500',
  },
  {
    name: 'Invictus Tools & Communication',
    subtitle: 'Manage your To-dos and Communication',
    icon: Flag,
    path: null,
    badge: 5,
    color: 'text-violet-600 dark:text-violet-400',
    colorBg: 'bg-violet-50 dark:bg-violet-900/30',
    colorBorder: 'hover:border-violet-400/60 dark:hover:border-violet-500/40',
    badgeBg: 'bg-violet-500',
  },
  {
    name: 'Invictus Deals',
    subtitle: 'Manage your Investment',
    icon: TrendingUp,
    path: null,
    badge: 5,
    color: 'text-amber-600 dark:text-amber-400',
    colorBg: 'bg-amber-50 dark:bg-amber-900/30',
    colorBorder: 'hover:border-amber-400/60 dark:hover:border-amber-500/40',
    badgeBg: 'bg-amber-500',
  },
  {
    name: 'Invictus Insights',
    subtitle: 'Access Client Data and Reports',
    icon: Lightbulb,
    path: '/home/dashboard',
    badge: 5,
    color: 'text-orange-600 dark:text-orange-400',
    colorBg: 'bg-orange-50 dark:bg-orange-900/30',
    colorBorder: 'hover:border-orange-400/60 dark:hover:border-orange-500/40',
    badgeBg: 'bg-orange-500',
  },
  {
    name: 'Invictus Administration',
    subtitle: 'Manage your Settings',
    icon: Users,
    path: null,
    badge: 5,
    color: 'text-slate-600 dark:text-slate-400',
    colorBg: 'bg-slate-100 dark:bg-slate-800/40',
    colorBorder: 'hover:border-slate-400/60 dark:hover:border-slate-500/40',
    badgeBg: 'bg-slate-500',
  },
]

const MODULE_DETAILS: Record<string, string> = {
  'Invictus Engage': 'Track prospects, manage client relationships, and monitor engagement pipelines with powerful CRM tools.',
  'Invictus Plan': 'Create, customize, and present personalized financial plans tailored to each client\'s goals and risk profile.',
  'Invictus Tools & Communication': 'Centralize task management, schedule meetings, and streamline client communications in one place.',
  'Invictus Deals': 'Analyze investment opportunities, track deal flow, and manage portfolio allocations efficiently.',
  'Invictus Insights': 'Access client data, reports, and analytics to make informed decisions and deliver personalized insights.',
  'Invictus Administration': 'Configure team permissions, manage system settings, and customize your workspace.',
}

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

export function ModulesHomePage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const firstName = user?.name?.split(' ')[0] || 'there'

  return (
    <div className="p-6 lg:p-8 space-y-8">
      {/* Greeting Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {getGreeting()}, {firstName}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {format(new Date(), "EEEE, MMMM do yyyy")}
        </p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {STATS.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.label} className={`border-l-3 ${stat.border} overflow-hidden`}>
              <CardContent className="p-5 flex items-center gap-4">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${stat.accentBg}`}>
                  <Icon className={`h-5 w-5 ${stat.accent}`} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">{stat.label}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-2xl font-bold tracking-tight">{stat.value}</span>
                    <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-md flex items-center gap-0.5 ${
                      stat.positive
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'
                        : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400'
                    }`}>
                      <ArrowUpRight className={`h-3 w-3 ${stat.positive ? '' : 'rotate-90'}`} />
                      {stat.change}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Section Header */}
      <div>
        <h2 className="text-lg font-semibold">Modules</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Access your workspace tools and services
        </p>
      </div>

      {/* Module Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {MODULES.map((mod) => {
          const Icon = mod.icon
          return (
            <FlipCard
              key={mod.name}
              className="h-[240px]"
              front={
                <Card
                  className={`h-full relative transition-all duration-300 hover:shadow-lg hover:scale-[1.02] ${mod.colorBorder}`}
                >
                  {mod.badge && (
                    <div className="absolute top-3.5 right-3.5">
                      <span className={`inline-flex items-center justify-center w-5 h-5 text-[10px] font-bold text-white rounded-full ${mod.badgeBg}`}>
                        {mod.badge}
                      </span>
                    </div>
                  )}
                  <CardContent className="flex flex-col items-center justify-center text-center h-full px-6">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 ${mod.colorBg}`}>
                      <Icon className={`h-7 w-7 ${mod.color}`} strokeWidth={1.5} />
                    </div>
                    <p className="text-xs text-muted-foreground mb-1">{mod.subtitle}</p>
                    <h3 className="text-sm font-semibold">{mod.name}</h3>
                  </CardContent>
                </Card>
              }
              back={
                <Card
                  className={`h-full transition-all duration-300 ${mod.colorBorder}`}
                >
                  <CardContent className="flex flex-col items-center justify-between text-center h-full px-6 py-7">
                    <div>
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 mx-auto ${mod.colorBg}`}>
                        <Icon className={`h-5 w-5 ${mod.color}`} strokeWidth={1.5} />
                      </div>
                      <h3 className="text-sm font-semibold mb-2">{mod.name}</h3>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {MODULE_DETAILS[mod.name]}
                      </p>
                    </div>
                    <button
                      className={`mt-4 w-full py-2 text-xs font-semibold rounded-lg transition-all ${
                        mod.path
                          ? `${mod.badgeBg} text-white hover:opacity-90 shadow-sm`
                          : 'bg-muted text-muted-foreground cursor-not-allowed'
                      }`}
                      onClick={(e) => {
                        e.stopPropagation()
                        if (mod.path) navigate(mod.path)
                      }}
                      disabled={!mod.path}
                    >
                      {mod.path ? 'Enter Module' : 'Coming Soon'}
                    </button>
                  </CardContent>
                </Card>
              }
            />
          )
        })}
      </div>

      {/* Footer */}
      <div className="pt-4 text-center">
        <p className="text-[11px] text-muted-foreground/60">
          &copy; {new Date().getFullYear()} Asbi Tech Ltd. All rights reserved.
        </p>
      </div>
    </div>
  )
}
