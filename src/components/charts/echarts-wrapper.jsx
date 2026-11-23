'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import * as echarts from 'echarts'

export default function ECharts({ option, style = {}, className = '', onReady }) {
  const ref = useRef(null)
  const [instance, setInstance] = useState(null)
  const onReadyRef = useRef(onReady)

  useEffect(() => {
    onReadyRef.current = onReady
  }, [onReady])

  useEffect(() => {
    if (!ref.current) return
    const chart = echarts.init(ref.current, undefined, { renderer: 'svg' })
    setInstance(chart)
    if (onReadyRef.current) onReadyRef.current(chart)
    const handleResize = () => chart.resize()
    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
      chart.dispose()
      setInstance(null)
    }
  }, [])

  useEffect(() => {
    if (instance) instance.setOption(option, true)
  }, [instance, option])

  return <div ref={ref} style={{ width: '100%', height: '100%', ...style }} className={className} />
}

export function useECharts() {
  const [chart, setChart] = useState(null)
  const setInstance = useCallback((c) => setChart(c), [])
  return { chart, setInstance }
}
