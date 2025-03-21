import { isAddress, type PublicActions, type WalletClient } from 'viem';
import { base } from 'viem/chains';
import type { z } from 'zod';
import { WalletAnalyticsSchema } from './schemas.js';

export async function walletAnalyticsHandler(
  wallet: WalletClient & PublicActions,
  args: z.infer<typeof WalletAnalyticsSchema>,
): Promise<string> {
  const { address, limit } = args;
  
  // Use provided address or default to user's wallet
  const targetAddress = address || wallet.account?.address;
  
  if (!targetAddress || !isAddress(targetAddress, { strict: false })) {
    throw new Error(`Invalid address: ${targetAddress}`);
  }

  // Get basic account info
  const balance = await wallet.getBalance({ address: targetAddress });
  
  // Get transaction count
  const txCount = await wallet.getTransactionCount({ address: targetAddress });
  
  // Get recent transactions
  // For a production implementation, we would use an indexer or API
  // This is a simplified approach for the demo
  const blockNumber = await wallet.getBlockNumber();
  
  // Get last 10 blocks (simplified approach)
  const blocks = await Promise.all(
    Array.from({ length: Math.min(10, Number(blockNumber)) }, (_, i) =>
      wallet.getBlock({ blockNumber: blockNumber - BigInt(i) })
    )
  );
  
  // Extract transactions involving our address
  const recentTxs = [];
  for (const block of blocks) {
    if (recentTxs.length >= limit) break;
    
    // Get transaction hashes from block
    const txHashes = block.transactions.filter(tx => typeof tx === 'string') as string[];
    
    // For each transaction hash, get the full transaction
    for (const txHash of txHashes) {
      if (recentTxs.length >= limit) break;
      
      try {
        const tx = await wallet.getTransaction({ hash: txHash as `0x${string}` });
        
        // Check if transaction involves our address
        if (
          tx && 
          (tx.from.toLowerCase() === targetAddress.toLowerCase() || 
           (tx.to && tx.to.toLowerCase() === targetAddress.toLowerCase()))
        ) {
          recentTxs.push({
            hash: tx.hash,
            from: tx.from,
            to: tx.to,
            value: tx.value.toString(),
            blockNumber: Number(tx.blockNumber),
            timestamp: block.timestamp ? new Date(Number(block.timestamp) * 1000).toISOString() : null,
            direction: tx.from.toLowerCase() === targetAddress.toLowerCase() ? 'outgoing' : 'incoming',
          });
        }
      } catch (error) {
        // Skip failed transaction fetches
        console.error(`Failed to fetch transaction ${txHash}:`, error);
      }
    }
  }

  // Calculate basic analytics
  const outgoingTxs = recentTxs.filter(tx => tx.direction === 'outgoing');
  const incomingTxs = recentTxs.filter(tx => tx.direction === 'incoming');
  
  // Prepare analytics results
  const analytics = {
    address: targetAddress,
    balanceInEth: Number(balance) / 1e18,
    transactionCount: txCount,
    recentTransactions: recentTxs,
    analytics: {
      outgoingCount: outgoingTxs.length,
      incomingCount: incomingTxs.length,
      totalValueSent: outgoingTxs.reduce((sum, tx) => sum + Number(tx.value) / 1e18, 0),
      totalValueReceived: incomingTxs.reduce((sum, tx) => sum + Number(tx.value) / 1e18, 0),
    },
    blockchainInfo: {
      network: wallet.chain?.name || 'Base',
      chainId: wallet.chain?.id || base.id,
      latestBlock: Number(blockNumber)
    }
  };

  return JSON.stringify(analytics, null, 2);
}
