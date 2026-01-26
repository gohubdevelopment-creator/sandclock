import soc2Icon from '../images/SOC2.png'
import insuredIcon from '../images/insured.svg'
import logoIcon from '../images/image.png'
import card1 from '../images/card1.png'
import card2 from '../images/card2.png'

interface VaultCard {
  title: string;
  description: string;
  tvl: string;
  protocol: string;
  image: string;
}

const VaultCards = () => {
  const vaults: VaultCard[] = [
    {
      title: 'ETH Real Yield',
      description: 'Capital-efficient ETH strategy to amplify staking yield via recursive leveraged staking.',
      tvl: '$11.5K',
      protocol: 'Aave',
      image: card1,
    },
    {
      title: 'USDC Stable Yield',
      description: "Multi-pronged strategy utilizing Aave and Ethereum's Proof-of-Stake yield to generate a return on USDC deposits.",
      tvl: '$3.1K',
      protocol: 'Aave',
      image: card2,
    },
  ];

  return (
    <section className="px-8 lg:px-16 py-12 bg-black border-b border-white/10">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {vaults.map((vault) => (
            <div
              key={vault.title}
              className="bg-black border border-white/10 rounded-3xl overflow-hidden hover:border-white/20 transition-colors cursor-pointer"
            >
              <div className="h-44 lg:h-52 relative overflow-hidden">
                <img src={vault.image} alt={vault.title} className="w-full h-full object-cover" />
                <span className="absolute top-4 right-4 bg-gray-900/80 text-white text-sm px-4 py-1.5 rounded-full flex items-center gap-2">
                  <img src={logoIcon} alt="Logo" className="w-5 h-5 object-contain" />
                  Managed
                </span>
              </div>
              <div className="p-6 lg:p-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                    <svg width="20" height="20" viewBox="0 0 16 16" fill="black">
                      <path d="M8 2L4 4V8C4 10.2091 5.79086 12 8 12C10.2091 12 12 10.2091 12 8V4L8 2Z"/>
                    </svg>
                  </div>
                  <h3 className="text-white font-semibold text-xl lg:text-2xl">{vault.title}</h3>
                </div>
                <p className="text-gray-400 text-base lg:text-lg mb-6 line-clamp-2">{vault.description}</p>

                <div className="flex items-center gap-6 mb-6">
                  <div className="flex items-center gap-2">
                    <img src={soc2Icon} alt="SOC2" className="w-5 h-5 object-contain" />
                    <span className="text-gray-400 text-sm lg:text-base">SOC 2 Compliant</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <img src={insuredIcon} alt="Insured" className="w-5 h-5 object-contain" />
                    <span className="text-gray-400 text-sm lg:text-base">Insured up to $10k / wallet</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-5 border-t border-gray-800">
                  <div>
                    <p className="text-gray-500 text-sm mb-1">TVL</p>
                    <p className="text-white font-bold text-lg lg:text-xl">{vault.tvl}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-500 text-sm mb-1">Protocol</p>
                    <p className="text-white font-bold text-lg lg:text-xl">{vault.protocol}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default VaultCards;
