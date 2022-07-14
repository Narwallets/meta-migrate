import * as nearAPI from "near-api-js"
import BaseLogic from "../../services/near"

export default class Logic extends BaseLogic {
    OLD_POOL_ID = 535 // ['meta-pool.near', 'wrap.near']
    NEW_POOL_ID = 3514 // ["meta-pool.near","wrap.near"] stable
    ADDRESS_METAPOOL: string = window.nearConfig.ADDRESS_METAPOOL
    ADDRESS_WNEAR: string = window.nearConfig.ADDRESS_WNEAR

    newFarmingStake?: string
    oldPosition?: {
        user_total_shares: string
        user_farm_shares: string
        user_lp_shares: string
        total_shares: string
        min_amounts: string[]
    }
    newPoolInfo?: {
        user_shares: string
        total_shares: string
        amounts: string[]
    }
    stNEARPrice?: string
    minDepositAmount?: string
    wNEARBalanceOnRef?: string
    OCTBalanceOnRef?: string
    stNEARBalanceOnRef?: string
    stNEARBalance?: string
    nativeNEARBalance?: string
    lpSharesToStake?: string
    isFarmActive?: boolean

    stepTwoAction(amount: string): void {
        this.passToWallet([this.nearToStnear(amount)])
    }

    getOldFarmingStake(): Promise<string> {
        return this.getFarmingStake(this.OLD_POOL_ID)
    }

    // get user stNEAR on metapool
    async getStnearBalance(): Promise<string> {
        const balances: string[] = await this.getTokenBalances([this.ADDRESS_METAPOOL])
        return balances[0]
    }

    // get user stNEAR balance on Ref-finance
    async getStnearBalanceOnRef(): Promise<string> {
        const balances: string[] = await this.getTokenBalancesOnRef([this.ADDRESS_METAPOOL])
        return balances[0]
    }

    // get user OCT balance
    async getWnearBalanceOnRef(): Promise<string> {
        const balance: string = await this.getTokenBalance(this.ADDRESS_WNEAR)
        // console.log(`Balance wNear: ${balance}`)
        return balance
    }

    getNewFarmingStake(): Promise<string> {
        return this.getFarmingStake(this.NEW_POOL_ID)
    }

    getOldPosition(): Promise<{
        user_total_shares: string
        user_farm_shares: string
        user_lp_shares: string
        total_shares: string
        min_amounts: string[]
    }> {
        return this.getPosition(this.OLD_POOL_ID)
    }

    getNewPosition(): Promise<{
        user_total_shares: string
        user_farm_shares: string
        user_lp_shares: string
        total_shares: string
        min_amounts: string[]
    }> {
        return this.getPosition(this.NEW_POOL_ID)
    }

    /**
     * add liquidity to stNEAR<>OCT farm,
     * TODO: use a generic addLiquidity function
     *
     * @param amount_stnear
     * @param lp_amounts
     * @returns
     */
    // deposit stNEAR then add liquidity to OCT<>stNEAR pool
    async addLiquidityToStnearWnearStable(
        amount_stnear: string,
        lp_amounts: string[]
    ): Promise<nearAPI.transactions.Transaction[]> {
        const preTXs: Promise<nearAPI.transactions.Transaction>[] = []
        const metapoolActions: nearAPI.transactions.Action[] = []
        // use this to increase storage balance on ref before depositing stNEAR
        const refActions_1: nearAPI.transactions.Action[] = []
        const wNearActions: nearAPI.transactions.Action[] = []
        // use this for actions related to LP
        const refActions_2: nearAPI.transactions.Action[] = []
        // Ref changed and doesn't hold more tokens. This function should
        // stop receiving amount_stnear as parameter
        amount_stnear = lp_amounts[0]
        const amount_wnear = lp_amounts[1]

        if (BigInt(amount_wnear) > BigInt("0")) {
            wNearActions.push(
                nearAPI.transactions.functionCall(
                    "ft_transfer_call",
                    {
                        receiver_id: window.nearConfig.ADDRESS_REF_EXCHANGE,
                        amount: amount_wnear,
                        msg: ""
                    },
                    150_000_000_000_000,
                    "1" // one yocto
                )
            )
        }

        // deposit stNEAR on ref-finance. Assumptions:
        // 1- ref-finance contract already has storage deposit on stNEAR contract
        // 2- stNEAR is on the ref-finance global token whitelist
        if (BigInt(amount_stnear) > BigInt("0")) {
            metapoolActions.push(
                nearAPI.transactions.functionCall(
                    "ft_transfer_call",
                    {
                        receiver_id: window.nearConfig.ADDRESS_REF_EXCHANGE,
                        amount: amount_stnear,
                        msg: ""
                    },
                    150_000_000_000_000,
                    "1" // one yocto
                )
            )
        }

        // set slippage protection to 0.1%
        // const min_lp_amounts: string[] = lp_amounts.map(amount => {
        //     return ((BigInt(amount) * BigInt("995")) / BigInt("1000")).toString()
        // })

        const min_shares: string = this.lpSharesToStake!

        // add liquidity to $OCT <-> $stNEAR
        // no need to check for storage as storage deposit
        // is take from attached deposit for this action
        refActions_2.push(
            nearAPI.transactions.functionCall(
                "add_stable_liquidity",
                {
                    pool_id: this.NEW_POOL_ID,
                    amounts: lp_amounts,
                    min_shares: min_shares
                },
                100_000_000_000_000,
                this.LP_STORAGE_AMOUNT
            )
        )

        if (refActions_1.length > 0) {
            preTXs.push(this.makeTransaction(window.nearConfig.ADDRESS_REF_EXCHANGE, refActions_1))
        }
        if (wNearActions.length > 0) {
            preTXs.push(this.makeTransaction(window.nearConfig.ADDRESS_WNEAR, wNearActions))
        }
        if (metapoolActions.length > 0) {
            preTXs.push(this.makeTransaction(window.nearConfig.ADDRESS_METAPOOL, metapoolActions))
        }
        preTXs.push(this.makeTransaction(window.nearConfig.ADDRESS_REF_EXCHANGE, refActions_2))
        const TXs: nearAPI.transactions.Transaction[] = await Promise.all(preTXs)

        return TXs
    }

    async getNewPoolInfo(): Promise<{
        user_shares: string
        total_shares: string
        amounts: string[]
    }> {
        const user_shares = await window.account.viewFunction(
            window.nearConfig.ADDRESS_REF_EXCHANGE,
            "get_pool_shares",
            {
                pool_id: this.NEW_POOL_ID,
                account_id: window.account.accountId
            }
        )

        const {
            amounts,
            shares_total_supply: total_shares
        }: {
            amounts: string[]
            shares_total_supply: string
        } = await window.account.viewFunction(window.nearConfig.ADDRESS_REF_EXCHANGE, "get_pool", {
            pool_id: this.NEW_POOL_ID
        })

        return { user_shares, total_shares, amounts }
    }

    // action: LP to new pool and stake on farm
    async addLiquidityAndStake(amount_stnear: string, lp_amounts: string[], lp_shares_to_stake: string): Promise<void> {
        let actions = [this.addLiquidityToStnearWnearStable(amount_stnear, lp_amounts)]
        if (this.isFarmActive) {
            actions.push(this.farmStake(lp_shares_to_stake, this.NEW_POOL_ID))
        }
        this.passToWallet(actions)
    }
}
