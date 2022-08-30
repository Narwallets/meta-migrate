import { NEAR_NOMINATION } from "near-api-js/lib/utils/format"
import BaseLogic from "../../services/near"

export default class Logic extends BaseLogic {
    STNEAR_WNEAR_POOL_ID: number = 535 // [ 'meta-pool.near', 'wrap.near' ]
    STNEAR_WNEAR_STABLE_POOL_ID: string = "3514"
    ADDRESS_METAPOOL: string = window.nearConfig.ADDRESS_METAPOOL
    ADDRESS_WNEAR: string = window.nearConfig.ADDRESS_WNEAR

    minDepositAmount?: string
    nativeNEARBalance?: string
    wNEARBalanceOnRef?: string
    NEARBalance?: string
    stNEARBalanceOnRef?: string
    stNEARBalance?: string
    poolInfo?: {
        user_shares: string
        total_shares: string
        pool_amounts: string[]
    }
    lpSharesToStake?: string
    poolShares?: string
    farmShares?: string
    isFarmActive?: boolean

    /**
     * take NEAR tokens, wrap 50% and stake 50% on metapool to get stNEAR
     *
     * @param allowance
     */
    async stepOneAction(allowance: string): Promise<void> {
        // const stakePercentage = 70
        // recipe wraps one half of provided NEAR
        // const amountToWrap = ((BigInt(allowance) * BigInt(100 - stakePercentage)) / BigInt("100")).toString()
        // recipe stakes one half of provided NEAR with metapool
        // const amountToStake = ((BigInt(allowance) * BigInt(stakePercentage)) / BigInt("100")).toString()

        this.passToWallet([
            // wrap half of provided NEAR tokens
            // this.nearToWnear(amountToWrap),
            // stake on metapool half of provided NEAR tokens
            this.nearToStnear(allowance)
        ])
    }

    /**
     * deposit on Ref, LP to wNear<>stNear and stake on farm
     *
     * @param amounts
     */
    async stepTwoAction(amounts: { stnearAmount: string; wnearAmount: string }): Promise<void> {
        const { stnearAmount, wnearAmount } = amounts

        // fetch metapool info and stNEAR<>wNEAR pool info
        const { total_shares, pool_amounts } = await this.getPoolInfo(this.STNEAR_WNEAR_STABLE_POOL_ID)
        // estimate received LP shares
        const lpShares: string = this.calcLpSharesFromAmountsForStableStNearNear(total_shares, pool_amounts, [
            stnearAmount,
            wnearAmount
        ])

        let actions = [
            // deposit both tokens on ref-finance
            // this.depositTokensOnRef([
            //     { token: window.nearConfig.ADDRESS_METAPOOL, amount: stnearAmount },
            //     { token: window.nearConfig.ADDRESS_WNEAR, amount: wnearAmount }
            // ]),
            // rovide liquidity to stNEAR<>wNEAR pool
            this.addLiquidityToStnearWnearStable(stnearAmount, [stnearAmount, wnearAmount], this.lpSharesToStake!)
            // this.addLiquidityToStnearWnearStable([{ pool_id: this.STNEAR_WNEAR_STABLE_POOL_ID, amounts: [stnearAmount, wnearAmount]}])
        ]

        if (this.isFarmActive) {
            // stake on farm
            actions.push(this.farmStakeV2(lpShares, this.STNEAR_WNEAR_STABLE_POOL_ID))
        }

        this.passToWallet(actions)
    }

    async addLiquidityAndFarm(amounts: { stnearAmount: string; nearAmount: string }): Promise<void> {
        const { stnearAmount, nearAmount } = amounts

        // fetch metapool info and stNEAR<>wNEAR pool info
        // const { total_shares, pool_amounts } = await this.getPoolInfo(this.STNEAR_WNEAR_STABLE_POOL_ID)
        // estimate received LP shares
        const lpShares: string = this.calcLpSharesFromAmountsForStableStNearNear(
            "0",
            ["1", "1"],
            [stnearAmount, nearAmount]
        )

        let actions = [
            // deposit both tokens on ref-finance
            // this.depositTokensOnRef([
            //     { token: window.nearConfig.ADDRESS_METAPOOL, amount: stnearAmount },
            //     { token: window.nearConfig.ADDRESS_WNEAR, amount: wnearAmount }
            // ]),
            // rovide liquidity to stNEAR<>wNEAR pool
            this.addLiquidityToStnearWnearStableV2(stnearAmount, nearAmount, lpShares)
            // this.addLiquidityToStnearWnearStable([{ pool_id: this.STNEAR_WNEAR_STABLE_POOL_ID, amounts: [stnearAmount, wnearAmount]}])
        ]

        if (this.isFarmActive) {
            // stake on farm
            actions.push(this.farmStakeV2(lpShares, this.STNEAR_WNEAR_STABLE_POOL_ID))
        }

        this.passToWallet(actions)
    }

    async stnearWnearFarmingStake(): Promise<string> {
        const stake_shares: string = await this.getFarmingStake(this.STNEAR_WNEAR_POOL_ID)
        return stake_shares
    }
}
