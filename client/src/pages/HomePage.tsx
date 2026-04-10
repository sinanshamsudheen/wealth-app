import { useNavigate } from 'react-router-dom'
import { InvictusLogo } from '@/components/shared/InvictusLogo'
import {
  Handshake,
  ClipboardList,
  Flag,
  TrendingUp,
  Lightbulb,
  Users,
  LogOut,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuthStore } from '@/store/useAuthStore'

const STATS = [
  { label: 'Watar AUM', value: '$4.25B', change: '13.8%', positive: true },
  { label: "My Team's AUM", value: '$4.25B', change: '22.3%', positive: true },
  { label: 'Number of Clients', value: '27', change: '25%', positive: true },
]

const MODULES = [
  {
    name: 'Invictus Engage',
    subtitle: 'Manage your Prospects and Clients',
    icon: Handshake,
    path: null,
    badge: 5,
  },
  {
    name: 'Invictus Plan',
    subtitle: 'Build Personalized Financial Plans',
    icon: ClipboardList,
    path: null,
    badge: null,
  },
  {
    name: 'Invictus Tools & Communication',
    subtitle: 'Manage your To-dos and Communication',
    icon: Flag,
    path: null,
    badge: 5,
  },
  {
    name: 'Invictus Deals',
    subtitle: 'Manage your Investment',
    icon: TrendingUp,
    path: null,
    badge: 5,
  },
  {
    name: 'Invictus AI',
    subtitle: 'AI-Powered Agents & Automation',
    icon: Lightbulb,
    path: '/insights',
    badge: 5,
    highlight: true,
  },
  {
    name: 'Invictus Administration',
    subtitle: 'Manage your Settings',
    icon: Users,
    path: null,
    badge: 5,
  },
]

export function HomePage() {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()

  return (
    <div className="min-h-screen bg-background">
      {/* Top Nav */}
      <header className="h-14 border-b border-border bg-card flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-3">
          <InvictusLogo size="sm" />
        </div>
        <div className="flex items-center gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-accent transition-colors cursor-pointer">
              <Avatar className="h-7 w-7">
                <AvatarFallback className="text-[10px] font-bold bg-primary text-primary-foreground">
                  {user?.initials || 'RN'}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium hidden sm:block">{user?.name || 'Raoof Naushad'}</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <div className="px-2 py-1.5 text-sm">
                <p className="font-medium">{user?.name}</p>
                <p className="text-muted-foreground text-xs">{user?.email}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout}>
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Breadcrumb */}
      <div className="px-6 py-3 text-sm text-muted-foreground">
        Home &rsaquo; <span className="text-foreground font-medium">Home</span>
      </div>

      <div className="max-w-6xl mx-auto px-6 pb-12">
        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          {STATS.map((stat) => (
            <Card key={stat.label} className="bg-card">
              <CardContent className="p-5">
                <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-bold">{stat.value}</span>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex items-center gap-1 ${
                    stat.positive
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                      : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                  }`}>
                    {stat.change}
                    <svg width="12" height="12" viewBox="0 0 12 12" className={stat.positive ? '' : 'rotate-180'}>
                      <path d="M6 2L10 8H2L6 2Z" fill="currentColor" opacity="0.7" />
                    </svg>
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Module Title */}
        <p className="text-center text-sm text-muted-foreground mb-8">
          Access system modules by clicking below
        </p>

        {/* Module Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {MODULES.map((mod) => {
            const Icon = mod.icon
            return (
              <Card
                key={mod.name}
                className={`group relative cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 ${
                  mod.highlight
                    ? 'border-primary/30 bg-primary/[0.02] hover:border-primary/50'
                    : 'hover:border-border'
                } ${!mod.path ? 'opacity-80' : ''}`}
                onClick={() => {
                  if (mod.path) navigate(mod.path)
                }}
              >
                {mod.badge && (
                  <div className="absolute top-3 right-3">
                    <span className="inline-flex items-center justify-center w-5 h-5 text-[10px] font-bold text-white bg-emerald-500 rounded-full">
                      {mod.badge}
                    </span>
                  </div>
                )}
                <CardContent className="flex flex-col items-center text-center py-10 px-6">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 ${
                    mod.highlight
                      ? 'bg-primary/10'
                      : 'bg-muted'
                  }`}>
                    <Icon className={`h-8 w-8 ${mod.highlight ? 'text-primary' : 'text-foreground'}`} strokeWidth={1.5} />
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">{mod.subtitle}</p>
                  <h3 className={`text-base font-semibold ${mod.highlight ? 'text-primary' : ''}`}>
                    {mod.name}
                  </h3>
                  {mod.highlight && (
                    <button
                      className="mt-4 w-full py-2.5 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:bg-primary/90 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation()
                        navigate('/insights')
                      }}
                    >
                      Enter Module
                    </button>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border py-4 px-6 text-center text-xs text-muted-foreground mt-auto">
        <div className="flex items-center justify-center gap-4">
          <span>Contact Us</span>
          <span>Privacy</span>
          <span>Terms &amp; Conditions</span>
          <span className="ml-4">&copy; Copyright 2026 Asbi Tech Ltd. All Rights Reserved</span>
        </div>
      </footer>
    </div>
  )
}
