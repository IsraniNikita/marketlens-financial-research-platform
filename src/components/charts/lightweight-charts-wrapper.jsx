'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { createChart, ColorType, LineStyle } from 'lightweight-charts'

export default function LightweightCharts({ options, seriesData, height = 300, className = '' }) {
  const ref = useRef(null)
  const [chart, setChart] = useState(null)
  const seriesRefs = useRef({})

  const createChartInstance = useCallback(() => {
    if (!ref.current || chart) return
    const c = createChart(ref.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#0b1020' },
        textColor: '#e8eaf2',
        fontSize: 11,
      },
      grid: {
        vertLines: { color: '#1e283f' },
        horzLines: { color: '#1e283f' },
      },
      width: ref.current.clientWidth || 600,
      height,
      rightPriceScale: {
        borderColor: '#1e283f',
      },
      timeScale: {
        borderColor: '#1e283f',
        timeVisible: true,
        secondsVisible: false,
      },
    })
    setChart(c)
    return c
  }, [height])

  useEffect(() => {
    createChartInstance()
    return () => {
      if (chart) {
        chart.remove()
        setChart(null)
        seriesRefs.current = {}
      }
    }
  }, [createChartInstance, chart])

  useEffect(() => {
    if (!chart) return
    if (seriesData) {
      Object.entries(seriesData).forEach(([seriesId, data]) => {
        let series = seriesRefs.current[seriesId]
        if (!series) {
          series = chart.addSeries({
            type: 'line',
            id: seriesId,
            color: '#38bdf8',
            lineWidth: 2,
            lineStyle: LineStyle.Solid,
            crosshairMarkerVisible: true,
          })
          seriesRefs.current[seriesId] = series
        }
        series.setData(data)
      })
    }
    if (options) chart.applyOptions(options)
    chart.timeScale().fitContent()
  }, [chart, seriesData, options])

  return <div ref={ref} className={className} style={{ width: '100%', height }} />
}