function getConfig(NEAR_ENV: string) {
    switch (NEAR_ENV) {
        case "production":
        case "mainnet":
            return {
                networkId: "mainnet",
                ADDRESS_METAPOOL: "meta-pool.near",
                ADDRESS_REF_EXCHANGE: "v2.ref-finance.near",
                ADDRESS_REF_FARMING: "v2.ref-farming.near",
                ADDRESS_WNEAR: "wrap.near",
                ADDRESS_OCT: "f5cfbc74057c610c8ef151a439252680ac68c6dc.factory.bridge.near",
                ADDRESS_META_TOKEN: "meta-token.near",
                nodeUrl: "https://rpc.mainnet.near.org",
                walletUrl: "https://wallet.near.org",
                helperUrl: "https://helper.mainnet.near.org"
            }
        case "development":
        case "testnet":
            return {
                networkId: "testnet",
                nodeUrl: "https://rpc.testnet.near.org",
                walletUrl: "https://wallet.testnet.near.org",
                helperUrl: "https://helper.testnet.near.org"
            }
        case "betanet":
            return {
                networkId: "betanet",
                nodeUrl: "https://rpc.betanet.near.org",
                walletUrl: "https://wallet.betanet.near.org",
                helperUrl: "https://helper.betanet.near.org"
            }
        case "local":
            return {
                networkId: "local",
                nodeUrl: "http://localhost:3030",
                keyPath: `${process.env.HOME}/.near/validator_key.json`,
                walletUrl: "http://localhost:4000/wallet"
            }
        case "test":
        case "ci":
            return {
                networkId: "shared-test",
                nodeUrl: "https://rpc.ci-testnet.near.org",
                masterAccount: "test.near"
            }
        case "ci-betanet":
            return {
                networkId: "shared-test-staging",
                nodeUrl: "https://rpc.ci-betanet.near.org",
                masterAccount: "test.near"
            }
        default:
            throw Error(`Unconfigured NEAR_ENVironment '${NEAR_ENV}'. Can be configured in src/services/nearConfig.ts.`)
    }
}

export { getConfig }
