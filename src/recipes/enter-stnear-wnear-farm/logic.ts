import * as nearAPI from "near-api-js"
import BaseLogic from "../../services/near"

export default class Logic extends BaseLogic {
    STNEAR_WNEAR_POOL_ID: number = 535 // [ 'meta-pool.near', 'wrap.near' ]

    minDepositAmount?: string
    nativeNEARBalance?: string
    wNEARBalanceOnRef?: string
    stNEARBalanceOnRef?: string
    stNEARBalance?: string

    /**
     * take NEAR tokens, wrap 50% and stake 50% on metapool to get stNEAR
     *
     * @param allowance
     */
    async stepOneAction (allowance: string): Promise<void> {
        // recipe wraps one half of provided NEAR
        const amountToWrap = (BigInt(allowance) / BigInt("2")).toString()
        // recipe stakes one half of provided NEAR with metapool
        const amountToStake = (BigInt(allowance) / BigInt("2")).toString()

        this.passToWallet([
            // wrap half of provided NEAR tokens
            this.nearToWnear(amountToWrap),
            // stake on metapool half of provided NEAR tokens
            this.nearToStnear(amountToStake)
        ])
    }

    /**
     * deposit on Ref, LP to wNear<>stNear and stake on farm
     * 
     * @param amounts 
     */
    async stepTwoAction (amounts: {
        stnearAmount: string,
        wnearAmount: string
    }): Promise<void> {
        const { stnearAmount, wnearAmount } = amounts;

        // fetch metapool info and stNEAR<>wNEAR pool info
        const { total_shares, pool_amounts } = await this.getPoolInfo(this.STNEAR_WNEAR_POOL_ID)
        // estimate received LP shares
        const lpShares: string = this.calcLpSharesFromAmounts(total_shares, pool_amounts, [
            stnearAmount,
            wnearAmount
        ])

        this.passToWallet([
            // deposit both tokens on ref-finance
            this.depositTokensOnRef([
                { token: window.nearConfig.ADDRESS_METAPOOL, amount: stnearAmount },
                { token: window.nearConfig.ADDRESS_WNEAR, amount: wnearAmount }
            ]),
            // rovide liquidity to stNEAR<>wNEAR pool
            this.addLiquidity([{ pool_id: this.STNEAR_WNEAR_POOL_ID, amounts: [stnearAmount, wnearAmount] }]),
            // stake on farm
            this.farmStake(lpShares, this.STNEAR_WNEAR_POOL_ID)
        ])
    }

    async stnearWnearFarmingStake (): Promise<string> {
        const stake_shares: string = await this.getFarmingStake(this.STNEAR_WNEAR_POOL_ID)
        return stake_shares
    }
}
