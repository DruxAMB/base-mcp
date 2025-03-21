import { generateTool } from '../../utils.js';
import { walletAnalyticsHandler } from './handlers.js';
import { WalletAnalyticsSchema } from './schemas.js';

export const walletAnalyticsTool = generateTool({
  name: 'wallet_analytics',
  description: 'Analyze wallet activity and transaction history',
  inputSchema: WalletAnalyticsSchema,
  toolHandler: walletAnalyticsHandler,
});
