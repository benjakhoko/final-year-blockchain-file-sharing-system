import React, { useState } from 'react';
import { useWeb3 } from '../../context/Web3Context';
import { 
  WalletIcon, 
  ArrowTopRightOnSquareIcon,
  CheckCircleIcon,
  XCircleIcon 
} from '@heroicons/react/24/outline';

const WalletConnector = () => {
  const { 
    account, 
    chainId, 
    loading, 
    connectWallet, 
    disconnectWallet,
    isMetaMaskInstalled 
  } = useWeb3();
  
  const [showDetails, setShowDetails] = useState(false);

  const shortenAddress = (address) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  const getNetworkName = (chainId) => {
    const networks = {
      1: 'Ethereum Mainnet',
      3: 'Ropsten',
      4: 'Rinkeby',
      5: 'Goerli',
      42: 'Kovan',
      56: 'Binance Smart Chain',
      97: 'BSC Testnet',
      137: 'Polygon',
      80001: 'Mumbai',
      1337: 'Ganache',
      31337: 'Hardhat'
    };
    return networks[chainId] || `Unknown Network (${chainId})`;
  };

  if (!isMetaMaskInstalled) {
    return (
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <WalletIcon className="h-5 w-5 text-yellow-400" />
          </div>
          <div className="ml-3">
            <p className="text-sm text-yellow-700">
              MetaMask is not installed.{' '}
              <a 
                href="https://metamask.io/download/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="font-medium underline text-yellow-700 hover:text-yellow-600"
              >
                Install MetaMask
              </a>
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!account) {
    return (
      <button
        onClick={connectWallet}
        disabled={loading}
        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
      >
        <WalletIcon className="h-5 w-5 mr-2" />
        {loading ? 'Connecting...' : 'Connect Wallet'}
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowDetails(!showDetails)}
        className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
        {shortenAddress(account)}
      </button>

      {showDetails && (
        <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 z-50">
          <div className="p-4">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Wallet Details</h3>
            
            <div className="space-y-2">
              <div>
                <p className="text-xs text-gray-500">Address</p>
                <p className="text-sm font-mono break-all">{account}</p>
              </div>
              
              <div>
                <p className="text-xs text-gray-500">Network</p>
                <p className="text-sm">{getNetworkName(chainId)}</p>
              </div>
              
              <div>
                <p className="text-xs text-gray-500">Chain ID</p>
                <p className="text-sm">{chainId}</p>
              </div>
            </div>

            <div className="mt-4 flex space-x-2">
              <a
                href={`https://etherscan.io/address/${account}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 inline-flex justify-center items-center px-3 py-2 border border-gray-300 shadow-sm text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                View on Explorer
                <ArrowTopRightOnSquareIcon className="h-3 w-3 ml-1" />
              </a>
              
              <button
                onClick={disconnectWallet}
                className="flex-1 inline-flex justify-center items-center px-3 py-2 border border-transparent text-xs font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
              >
                <XCircleIcon className="h-3 w-3 mr-1" />
                Disconnect
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WalletConnector;