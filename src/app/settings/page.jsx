'use client'

import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Bell, Layout, Moon, Plus, RotateCcw, Save, Sun, Trash2 } from 'lucide-react'
import { selectSettings } from '@/store/selectors'
import {
  addWorkspace,
  deleteWorkspace,
  saveSettings,
  setActiveWorkspace,
  setDefaultCurrency,
  setDefaultExchange,
  setDefaultTimeframe,
  setLayout,
  setNotificationPref,
  setTheme,
} from '@/store/slices/settingsSlice'
import { resetTradingAccount } from '@/store/slices/tradingSlice'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

export default function Settings() {
  const dispatch = useDispatch()
  const settings = useSelector(selectSettings)
  const [workspaceName, setWorkspaceName] = useState('')

  const handleCreateWorkspace = () => {
    const name = workspaceName.trim()
    if (!name) return
    dispatch(addWorkspace({
      id: `workspace-${Date.now()}`,
      name,
      panels: ['watchlist', 'chart', 'positions'],
    }))
    setWorkspaceName('')
  }

  const handleDuplicateWorkspace = (workspace) => {
    dispatch(addWorkspace({
      ...workspace,
      id: `workspace-${Date.now()}`,
      name: `${workspace.name} copy`,
      panels: [...workspace.panels],
    }))
  }

  const handleNotificationChange = (key, value) => {
    dispatch(setNotificationPref({ key, value }))
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Settings & Workspace</h1>
          <p className="text-muted text-sm">Configure platform preferences and workspaces.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => dispatch(saveSettings())}><Save size={14} /> Save</Button>
          <Button variant="outline" size="sm" onClick={() => dispatch(resetTradingAccount())}><RotateCcw size={14} /> Reset Paper Account</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Layout size={16} className="text-accent" /> Trading Preferences</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2">
              <label className="space-y-2 text-xs font-medium text-muted">
                Theme
                <select value={settings.theme} onChange={(e) => dispatch(setTheme(e.target.value))} className="input w-full">
                  <option value="dark">Dark</option>
                  <option value="light">Light</option>
                </select>
              </label>
              <label className="space-y-2 text-xs font-medium text-muted">
                Layout density
                <select value={settings.layout} onChange={(e) => dispatch(setLayout(e.target.value))} className="input w-full">
                  <option value="comfortable">Comfortable</option>
                  <option value="compact">Compact</option>
                  <option value="spacious">Spacious</option>
                </select>
              </label>
              <label className="space-y-2 text-xs font-medium text-muted">
                Default exchange
                <select value={settings.defaultExchange} onChange={(e) => dispatch(setDefaultExchange(e.target.value))} className="input w-full">
                  <option value="NSE">NSE</option>
                  <option value="BSE">BSE</option>
                </select>
              </label>
              <label className="space-y-2 text-xs font-medium text-muted">
                Currency
                <select value={settings.defaultCurrency} onChange={(e) => dispatch(setDefaultCurrency(e.target.value))} className="input w-full">
                  <option value="INR">INR - Indian Rupee</option>
                  <option value="USD">USD - US Dollar</option>
                </select>
              </label>
              <label className="space-y-2 text-xs font-medium text-muted sm:col-span-2">
                Default timeframe
                <select value={settings.defaultTimeframe} onChange={(e) => dispatch(setDefaultTimeframe(e.target.value))} className="input w-full">
                  {['1m', '5m', '15m', '30m', '1h', '4h', '1D', '1W', '1M'].map((timeframe) => <option key={timeframe}>{timeframe}</option>)}
                </select>
              </label>
              <div className="flex gap-2 sm:col-span-2">
                <Button variant={settings.theme === 'light' ? 'secondary' : 'outline'} size="sm" onClick={() => dispatch(setTheme('light'))}><Sun size={14} /> Light</Button>
                <Button variant={settings.theme === 'dark' ? 'secondary' : 'outline'} size="sm" onClick={() => dispatch(setTheme('dark'))}><Moon size={14} /> Dark</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Bell size={16} className="text-accent" /> Notifications</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 p-4">
              {Object.entries({ email: 'Email Notifications', push: 'Push Notifications', sound: 'Sound Alerts' }).map(([key, label]) => {
                const enabled = Boolean(settings.notifications?.[key])
                return (
                  <div key={key} className="flex items-center justify-between">
                    <span className="text-sm">{label}</span>
                    <Button variant="outline" size="sm" aria-pressed={enabled} onClick={() => handleNotificationChange(key, !enabled)}>
                      <Badge variant={enabled ? 'success' : 'secondary'}>{enabled ? 'On' : 'Off'}</Badge>
                    </Button>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6 lg:col-span-4">
          <Card>
            <CardHeader>
              <CardTitle>Saved Workspaces</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 p-3">
              {(settings.workspaces || []).map((workspace) => {
                const active = settings.activeWorkspace === workspace.id
                return (
                  <div key={workspace.id} className="flex items-center justify-between gap-2 rounded border border-border bg-surface px-3 py-2">
                    <button className="min-w-0 flex-1 text-left" onClick={() => dispatch(setActiveWorkspace(workspace.id))}>
                      <span className="block truncate text-sm font-medium">{workspace.name}</span>
                      <span className="text-[10px] text-muted">{workspace.panels.length} panels</span>
                    </button>
                    {active && <Badge variant="success">Active</Badge>}
                    <Button variant="ghost" size="icon" aria-label={`Duplicate ${workspace.name}`} onClick={() => handleDuplicateWorkspace(workspace)}><Plus size={14} /></Button>
                    <Button variant="ghost" size="icon" aria-label={`Delete ${workspace.name}`} onClick={() => dispatch(deleteWorkspace(workspace.id))}><Trash2 size={14} /></Button>
                  </div>
                )
              })}
              <div className="flex gap-2 border-t border-border pt-3">
                <Input value={workspaceName} onChange={(e) => setWorkspaceName(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleCreateWorkspace() }} placeholder="Workspace name" aria-label="Workspace name" />
                <Button size="sm" onClick={handleCreateWorkspace}>Create</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
