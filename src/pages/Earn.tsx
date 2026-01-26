import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { API_BASE_URL } from '../config/api'
import soc2Icon from '../images/SOC2.png'
import insuredIcon from '../images/insured.svg'
import card1 from '../images/card1.png'
import card2 from '../images/card2.png'

const cardImages = [card1, card2]

interface Package {
  id: number
  name: string
  description: string
  min_investment: number
  max_investment: number | null
  roi_percentage: number
  duration_days: number
  clauses: string | null
  gradient: string
  is_active: number
}

const Earn = () => {
  const [packages, setPackages] = useState<Package[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null)
  const [investAmount, setInvestAmount] = useState('')
  const [investError, setInvestError] = useState('')
  const [investing, setInvesting] = useState(false)
  const { user, updateUser } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (user) {
      fetchPackages()
    } else {
      setLoading(false)
    }
  }, [user])

  const fetchPackages = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/packages`)
      const data = await res.json()
      setPackages(data)
    } catch (error) {
      console.error('Failed to fetch packages:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleInvest = async () => {
    if (!user) {
      navigate('/login')
      return
    }

    if (!selectedPackage) return

    const amount = parseFloat(investAmount)
    if (isNaN(amount) || amount <= 0) {
      setInvestError('Please enter a valid amount')
      return
    }

    if (amount < selectedPackage.min_investment) {
      setInvestError(`Minimum investment is $${selectedPackage.min_investment}`)
      return
    }

    if (selectedPackage.max_investment && amount > selectedPackage.max_investment) {
      setInvestError(`Maximum investment is $${selectedPackage.max_investment}`)
      return
    }

    if (user.balance < amount) {
      setInvestError('Insufficient balance. Please deposit funds first.')
      return
    }

    setInvesting(true)
    setInvestError('')

    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${API_BASE_URL}/api/investments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          package_id: selectedPackage.id,
          amount
        })
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Investment failed')
      }

      // Update user balance
      updateUser({ ...user, balance: user.balance - amount })

      setSelectedPackage(null)
      setInvestAmount('')
      navigate('/portfolio')
    } catch (error) {
      setInvestError(error instanceof Error ? error.message : 'Investment failed')
    } finally {
      setInvesting(false)
    }
  }

  if (!user) {
    return (
      <section className="px-6 py-12 bg-black min-h-[calc(100vh-200px)]">
        <div className="max-w-6xl mx-auto text-center py-20">
          <h1 className="text-white text-3xl font-bold mb-4">Investment Packages</h1>
          <p className="text-gray-400 mb-8">Please login to view and invest in packages</p>
          <Link
            to="/login"
            className="inline-block px-8 py-3 bg-green-500 text-black font-semibold rounded-xl hover:bg-green-400 transition-colors"
          >
            Login
          </Link>
        </div>
      </section>
    )
  }

  if (loading) {
    return (
      <section className="px-8 lg:px-16 py-12 bg-black min-h-[calc(100vh-200px)] flex items-center justify-center">
        <div className="text-white">Loading packages...</div>
      </section>
    )
  }

  return (
    <section className="px-4 sm:px-6 lg:px-16 py-8 sm:py-12 bg-black min-h-[calc(100vh-200px)]">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Investment Packages</h1>
          <p className="text-gray-400 text-sm sm:text-base">Choose a package that fits your investment goals</p>
        </div>

        {packages.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400">No packages available at the moment.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {packages.map((pkg) => (
              <div
                key={pkg.id}
                className="bg-black border border-white/10 rounded-2xl overflow-hidden hover:border-white/20 transition-colors cursor-pointer"
                onClick={() => setSelectedPackage(pkg)}
              >
                <div className="h-40 relative overflow-hidden">
                  <img
                    src={cardImages[packages.indexOf(pkg) % cardImages.length]}
                    alt={pkg.name}
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute top-3 right-3 bg-gray-900/80 text-white text-xs px-3 py-1 rounded-full flex items-center gap-1">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    Active
                  </span>
                  <div className="absolute bottom-3 left-3">
                    <span className="bg-black/60 text-white text-lg font-bold px-3 py-1 rounded-lg">
                      {pkg.roi_percentage}% ROI
                    </span>
                  </div>
                </div>
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="black">
                        <path d="M8 2L4 4V8C4 10.2091 5.79086 12 8 12C10.2091 12 12 10.2091 12 8V4L8 2Z"/>
                      </svg>
                    </div>
                    <h3 className="text-white font-semibold text-lg">{pkg.name}</h3>
                  </div>
                  <p className="text-gray-400 text-sm mb-4 line-clamp-2">{pkg.description}</p>

                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex items-center gap-2">
                      <img src={soc2Icon} alt="SOC2" className="w-5 h-5 object-contain" />
                      <span className="text-gray-400 text-xs">SOC 2 Compliant</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <img src={insuredIcon} alt="Insured" className="w-5 h-5 object-contain" />
                      <span className="text-gray-400 text-xs">Insured</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-800">
                    <div>
                      <p className="text-gray-500 text-xs">Min Investment</p>
                      <p className="text-white font-semibold">${pkg.min_investment}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-500 text-xs">Duration</p>
                      <span className="bg-green-500 text-black text-xs px-3 py-1 rounded-md font-medium">
                        {pkg.duration_days} days
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Investment Modal */}
      {selectedPackage && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-black border border-white/20 rounded-2xl p-4 sm:p-6 max-w-md w-full my-4">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h2 className="text-lg sm:text-xl font-bold text-white pr-2">Invest in {selectedPackage.name}</h2>
              <button
                onClick={() => {
                  setSelectedPackage(null)
                  setInvestAmount('')
                  setInvestError('')
                }}
                className="text-gray-400 hover:text-white flex-shrink-0"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="h-20 sm:h-24 rounded-xl mb-4 sm:mb-6 overflow-hidden">
              <img
                src={cardImages[packages.findIndex(p => p.id === selectedPackage.id) % cardImages.length]}
                alt={selectedPackage.name}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
              <div className="flex justify-between">
                <span className="text-gray-400">ROI</span>
                <span className="text-green-500 font-semibold">{selectedPackage.roi_percentage}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Duration</span>
                <span className="text-white">{selectedPackage.duration_days} days</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Min Investment</span>
                <span className="text-white">${selectedPackage.min_investment}</span>
              </div>
              {selectedPackage.max_investment && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Max Investment</span>
                  <span className="text-white">${selectedPackage.max_investment}</span>
                </div>
              )}
              {user && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Your Balance</span>
                  <span className="text-white">${user.balance.toFixed(2)}</span>
                </div>
              )}
            </div>

            {selectedPackage.clauses && (
              <div className="mb-6 p-4 bg-white/5 rounded-xl">
                <p className="text-gray-400 text-sm">{selectedPackage.clauses}</p>
              </div>
            )}

            {investError && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-xl text-sm mb-4">
                {investError}
              </div>
            )}

            <div className="mb-4 sm:mb-6">
              <label className="block text-gray-400 text-sm mb-2">Investment Amount</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                <input
                  type="number"
                  value={investAmount}
                  onChange={(e) => setInvestAmount(e.target.value)}
                  className="w-full bg-black border border-white/10 rounded-xl pl-8 pr-4 py-2.5 sm:py-3 text-white focus:outline-none focus:border-green-500 transition-colors text-sm sm:text-base"
                  placeholder={`Min: ${selectedPackage.min_investment}`}
                />
              </div>
              {investAmount && !isNaN(parseFloat(investAmount)) && (
                <p className="text-green-500 text-xs sm:text-sm mt-2">
                  Expected return: ${(parseFloat(investAmount) * (1 + selectedPackage.roi_percentage / 100)).toFixed(2)}
                </p>
              )}
            </div>

            <button
              onClick={handleInvest}
              disabled={investing}
              className="w-full bg-green-500 text-black font-semibold py-2.5 sm:py-3 rounded-xl hover:bg-green-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
            >
              {!user ? 'Login to Invest' : investing ? 'Processing...' : 'Confirm Investment'}
            </button>
          </div>
        </div>
      )}
    </section>
  )
}

export default Earn
