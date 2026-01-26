import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { API_BASE_URL } from '../config/api'
import { 
  createChart, 
  type IChartApi, 
  ColorType, 
  AreaSeries, // Changed to AreaSeries for glow effect
  HistogramSeries 
} from 'lightweight-charts'
import card1 from '../images/card1.png'
import card2 from '../images/card2.png'

const cardImages = [card1, card2]

interface Investment {
  id: number; package_id: number; package_name: string; amount: number;
  expected_return: number; roi_percentage: number; gradient: string;
  status: string; end_date: string; created_at: string;
}

interface Transaction {
  id: number; type: string; amount: number; description: string; created_at: string;
}

const Portfolio = () => {
  const { user, updateUser } = useAuth()
  const [investments, setInvestments] = useState<Investment[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [showDepositModal, setShowDepositModal] = useState(false)
  const [depositAmount, setDepositAmount] = useState('')
  const [depositing, setDepositing] = useState(false)
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const [livePortfolioValue, setLivePortfolioValue] = useState(0)
  const [displayedValue, setDisplayedValue] = useState(0)

  useEffect(() => {
    if (user) fetchData()
    else setLoading(false)
  }, [user])

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token')
      const [investmentsRes, transactionsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/investments`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_BASE_URL}/api/transactions`, { headers: { 'Authorization': `Bearer ${token}` } })
      ])
      const investmentsData = await investmentsRes.json()
      const transactionsData = await transactionsRes.json()
      setInvestments(Array.isArray(investmentsData) ? investmentsData : [])
      setTransactions(Array.isArray(transactionsData) ? transactionsData : [])
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeposit = async () => {
    const amount = parseFloat(depositAmount)
    if (isNaN(amount) || amount <= 0) return
    setDepositing(true)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${API_BASE_URL}/api/deposit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ amount })
      })
      if (res.ok) {
        const updatedUser = await res.json()
        updateUser(updatedUser)
        setShowDepositModal(false)
        setDepositAmount('')
        fetchData()
      }
    } catch (error) { console.error('Deposit failed:', error) }
    finally { setDepositing(false) }
  }

  const calculateInvestmentValueAtTime = useCallback((inv: Investment, atTime: number) => {
    try {
      const startDate = new Date(inv.created_at).getTime()
      const endDate = new Date(inv.end_date).getTime()
      const totalDuration = Math.max(endDate - startDate, 1)
      const elapsed = Math.max(0, Math.min(atTime - startDate, totalDuration))
      const progress = elapsed / totalDuration
      return inv.amount + ((inv.expected_return - inv.amount) * progress)
    } catch { return inv.amount }
  }, [])

  // Live portfolio value calculation - updates every 100ms for smooth animation
  const calculateCurrentPortfolioValue = useCallback(() => {
    const now = Date.now()
    let totalValue = user?.balance ?? 0
    investments.forEach(inv => {
      if (inv.status === 'active') {
        totalValue += calculateInvestmentValueAtTime(inv, now)
      }
    })
    return totalValue
  }, [investments, user?.balance, calculateInvestmentValueAtTime])

  // Smooth animated counter effect
  useEffect(() => {
    const targetValue = calculateCurrentPortfolioValue()
    setLivePortfolioValue(targetValue)

    // Animate the displayed value towards the target
    const animationInterval = setInterval(() => {
      setDisplayedValue(prev => {
        const diff = targetValue - prev
        if (Math.abs(diff) < 0.01) return targetValue
        return prev + diff * 0.1
      })
    }, 50)

    // Update target value every second to show growth
    const growthInterval = setInterval(() => {
      const newTarget = calculateCurrentPortfolioValue()
      setLivePortfolioValue(newTarget)
    }, 1000)

    return () => {
      clearInterval(animationInterval)
      clearInterval(growthInterval)
    }
  }, [calculateCurrentPortfolioValue])

  // Initialize displayed value
  useEffect(() => {
    if (displayedValue === 0 && livePortfolioValue > 0) {
      setDisplayedValue(livePortfolioValue)
    }
  }, [livePortfolioValue, displayedValue])

  const historicalChartData = useMemo(() => {
    if (transactions.length === 0 && investments.length === 0) return []
    const events: any[] = []
    transactions.forEach(tx => tx.type === 'deposit' && events.push({ date: new Date(tx.created_at), type: 'deposit', amount: tx.amount }))
    investments.forEach(inv => events.push({ date: new Date(inv.created_at), type: 'investment', amount: inv.amount, investment: inv }))
    events.sort((a, b) => a.date.getTime() - b.date.getTime())

    const chartPoints: any[] = []
    let balance = 0
    const active: Investment[] = []

    events.forEach(event => {
      if (event.type === 'deposit') balance += event.amount
      else active.push(event.investment)
      let val = balance
      active.forEach(inv => val += calculateInvestmentValueAtTime(inv, event.date.getTime()))
      chartPoints.push({ time: Math.floor(event.date.getTime() / 1000), value: val })
    })
    return chartPoints
  }, [transactions, investments, calculateInvestmentValueAtTime])

  useEffect(() => {
  if (!chartContainerRef.current || historicalChartData.length === 0) return

  const chart = createChart(chartContainerRef.current, {
    layout: {
      background: { type: ColorType.Solid, color: 'transparent' },
      textColor: '#555',
      fontFamily: 'system-ui, -apple-system, sans-serif',
    },
    grid: {
      vertLines: { visible: false },
      horzLines: { color: 'rgba(255,255,255,0.03)', style: 1 }
    },
    width: chartContainerRef.current.clientWidth,
    height: 350,
    timeScale: {
      borderColor: 'transparent',
      barSpacing: 20,
      minBarSpacing: 10,
      timeVisible: true,
      secondsVisible: false,
    },
    rightPriceScale: {
      borderVisible: false,
      scaleMargins: { top: 0.1, bottom: 0.1 },
    },
    crosshair: {
      vertLine: { color: 'rgba(34, 197, 94, 0.3)', width: 1, style: 2, labelBackgroundColor: '#22c55e' },
      horzLine: { color: 'rgba(34, 197, 94, 0.3)', width: 1, style: 2, labelBackgroundColor: '#22c55e' },
    },
    handleScroll: { mouseWheel: false, pressedMouseMove: false },
    handleScale: { mouseWheel: false, pinch: false },
  })

  // 1. ADD THE BAR CHART (HISTOGRAM) FIRST - This puts it in the background
  const volumeSeries = chart.addSeries(HistogramSeries, {
    color: 'rgba(34, 197, 94, 0.08)',
    priceFormat: { type: 'volume' },
    priceScaleId: 'right',
  })

  // 2. ADD THE GLOWING LINE (AREA) SECOND - This puts it on top
  const areaSeries = chart.addSeries(AreaSeries, {
    lineColor: '#22c55e',
    topColor: 'rgba(34, 197, 94, 0.35)',
    bottomColor: 'rgba(34, 197, 94, 0.0)',
    lineWidth: 2,
    priceLineVisible: false,
    crosshairMarkerVisible: true,
    crosshairMarkerRadius: 6,
    crosshairMarkerBackgroundColor: '#22c55e',
    crosshairMarkerBorderColor: '#fff',
    crosshairMarkerBorderWidth: 2,
  })

  // Map the same data to both series
  const histogramData = historicalChartData.map(item => ({
    ...item,
    color: 'rgba(34, 197, 94, 0.06)'
  }))

  volumeSeries.setData(histogramData)
  areaSeries.setData(historicalChartData)

  chart.timeScale().fitContent()

  const handleResize = () => {
    if (chartContainerRef.current) {
      chart.applyOptions({ width: chartContainerRef.current.clientWidth })
    }
  }

  window.addEventListener('resize', handleResize)
  return () => { 
    window.removeEventListener('resize', handleResize); 
    chart.remove() 
  }
}, [historicalChartData])

  if (loading) return <div className="bg-black min-h-screen flex items-center justify-center text-white">Loading...</div>

  return (
    <section className="px-6 py-12 bg-black min-h-screen text-white">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-10">
          <h1 className="text-3xl font-bold tracking-tight">Portfolio</h1>
          <button onClick={() => setShowDepositModal(true)} className="px-6 py-3 bg-green-500 text-black font-bold rounded-2xl hover:bg-green-400 transition-all active:scale-95">
            Deposit Funds
          </button>
        </div>

        {/* Stats - Super Curved */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">
          {[
            { label: 'Balance', val: `$${(user?.balance ?? 0).toFixed(2)}` },
            { label: 'Invested', val: `$${investments.reduce((s, i) => s + i.amount, 0).toFixed(2)}` },
            { label: 'Returns', val: `$${investments.reduce((s, i) => s + i.expected_return, 0).toFixed(2)}`, color: 'text-green-400' },
            { label: 'Active', val: investments.filter(i => i.status === 'active').length }
          ].map((stat, i) => (
            <div key={i} className="bg-[#0A0A0A] border border-white/5 p-6 rounded-3xl">
              <p className="text-gray-500 text-sm mb-1">{stat.label}</p>
              <p className={`text-2xl font-bold ${stat.color || ''}`}>{stat.val}</p>
            </div>
          ))}
        </div>

        {/* Chart Section - Super Curved */}
        <div className="bg-[#0A0A0A] border border-white/5 p-8 rounded-[2.5rem] mb-10 shadow-2xl">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h2 className="text-gray-400 text-sm mb-2">Total Portfolio Value</h2>
              <div className="flex items-baseline gap-3">
                <span className="text-5xl font-bold tracking-tight">
                  ${displayedValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className="text-green-400 text-lg font-medium flex items-center gap-1">
                  <span className="inline-block w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  Live
                </span>
              </div>
              <p className="text-gray-500 text-sm mt-2">
                Growing every second based on your active investments
              </p>
            </div>
            <div className="text-right">
              <p className="text-gray-500 text-sm">24h Change</p>
              <p className="text-green-400 text-xl font-bold">+{((investments.reduce((s, i) => s + i.roi_percentage, 0) / Math.max(investments.length, 1)) / 365).toFixed(3)}%</p>
            </div>
          </div>
          <div ref={chartContainerRef} className="w-full" />
        </div>

        {/* Investment Cards - Curved */}
        <h2 className="text-xl font-semibold mb-6">Your Assets</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
          {investments.map((inv, i) => (
            <div key={inv.id} className="bg-[#0A0A0A] border border-white/5 rounded-[2rem] overflow-hidden group hover:border-green-500/30 transition-all">
              <div className="h-44 relative overflow-hidden">
                <img
                  src={cardImages[i % 2]}
                  className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-300"
                  alt={inv.package_name}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-transparent to-transparent" />
                <span className="absolute top-4 right-4 bg-green-500/20 backdrop-blur-sm text-green-400 text-xs font-medium px-3 py-1.5 rounded-full border border-green-500/30">
                  {inv.status}
                </span>
              </div>
              <div className="p-6">
                <h3 className="font-bold text-lg mb-4">{inv.package_name}</h3>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Invested</span>
                    <span className="text-white font-medium">${inv.amount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Expected Return</span>
                    <span className="text-green-400 font-medium">${inv.expected_return.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">ROI</span>
                    <span className="text-green-400 font-bold">{inv.roi_percentage}%</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal - Curved */}
      {showDepositModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-6">
          <div className="bg-[#0A0A0A] border border-white/10 p-8 rounded-[3rem] max-w-md w-full shadow-2xl">
            <h2 className="text-2xl font-bold mb-2">Deposit</h2>
            <p className="text-gray-500 text-sm mb-6">Add funds to your secure wallet.</p>
            <input 
              type="number" value={depositAmount} onChange={e => setDepositAmount(e.target.value)}
              className="w-full bg-black border border-white/5 rounded-2xl p-4 mb-6 outline-none focus:border-green-500 transition-colors"
              placeholder="0.00"
            />
            <div className="flex gap-4">
              <button onClick={() => setShowDepositModal(false)} className="flex-1 py-4 text-gray-400 font-bold">Cancel</button>
              <button onClick={handleDeposit} className="flex-1 py-4 bg-green-500 text-black font-bold rounded-2xl">{depositing ? '...' : 'Confirm'}</button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

export default Portfolio