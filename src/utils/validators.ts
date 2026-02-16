// Wallet address validation
export function isValidWalletAddress(address: string): boolean {
  // Basic Ethereum address validation (0x + 40 hex characters)
  const ethereumRegex = /^0x[a-fA-F0-9]{40}$/;
  return ethereumRegex.test(address);
}

// Validate wallet address and throw error if invalid
export function validateWalletAddress(address: string): void {
  if (!address) {
    throw new Error('Wallet address is required');
  }

  if (!isValidWalletAddress(address)) {
    throw new Error(
      'Invalid wallet address format. Expected format: 0x followed by 40 hexadecimal characters'
    );
  }
}
