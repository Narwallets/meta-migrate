import * as nearAPI from "near-api-js"
import BaseLogic from "../../services/near"

export default class Logic extends BaseLogic {
    OLD_POOL_ID = 47 // ['f5cfbc74057c610c8ef151a439252680ac68c6dc.factory.bridge.near', 'wrap.near']
    NEW_POOL_ID = 1889 // ["meta-pool.near","f5cfbc74057c610c8ef151a439252680ac68c6dc.factory.bridge.near"]
    ADDRESS_METAPOOL: string = window.nearConfig.ADDRESS_METAPOOL
    ADDRESS_OCT: string = window.nearConfig.ADDRESS_OCT

    newFarmingStake?: string
    oldPosition?: {
        user_total_shares: string
        user_farm_shares: string
        user_lp_shares: string
        total_shares: string
        min_amounts: string[]
    }
    newPoolInfo?: {
        fee: number
        user_shares: string
        total_shares: string
        pool_amounts: string[]
    }
    stNEARPrice?: string
    minDepositAmount?: string
    wNEARBalanceOnRef?: string
    OCTBalanceOnRef?: string
    stNEARBalanceOnRef?: string
    stNEARBalance?: string
    nativeNEARBalance?: string
    lpSharesToStake?: string

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

    // get user stNEAR balance on Ref-finance
    async getOctBalanceOnRef(): Promise<string> {
        const balances: string[] = await this.getTokenBalancesOnRef([this.ADDRESS_OCT])
        return balances[0]
    }

    // get user wNEAR balance on Ref-finance
    async getWnearBalanceOnRef(): Promise<string> {
        const balances: string[] = await this.getTokenBalancesOnRef([window.nearConfig.ADDRESS_WNEAR])
        return balances[0]
    }

    getNewFarmingStake(): Promise<string> {
        return this.getFarmingStake(this.NEW_POOL_ID)
    }

    async getOldPosition(): Promise<{
        user_total_shares: string
        user_farm_shares: string
        user_lp_shares: string
        total_shares: string
        min_amounts: string[]
    }> {
        const [user_farm_shares, pool_info] = await Promise.all([
            this.getFarmingStake(this.OLD_POOL_ID),
            this.getPoolInfo(this.OLD_POOL_ID)
        ])

        const user_total_shares = (BigInt(user_farm_shares) + BigInt(pool_info.user_shares)).toString()

        const min_amounts = this.calcMinLPAmountsOut(user_total_shares, pool_info.total_shares, pool_info.pool_amounts)

        return {
            user_total_shares,
            user_farm_shares,
            user_lp_shares: pool_info.user_shares,
            total_shares: pool_info.total_shares,
            min_amounts
        }
    }

    async getNewPosition(): Promise<{
        user_total_shares: string
        user_farm_shares: string
        user_lp_shares: string
        total_shares: string
        min_amounts: string[]
    }> {
        const [user_farm_shares, pool_info] = await Promise.all([
            this.getFarmingStake(this.NEW_POOL_ID),
            this.getPoolInfo(this.NEW_POOL_ID)
        ])

        const user_total_shares = (BigInt(user_farm_shares) + BigInt(pool_info.user_shares)).toString()

        const min_amounts = this.calcMinLPAmountsOut(user_total_shares, pool_info.total_shares, pool_info.pool_amounts)

        return {
            user_total_shares,
            user_farm_shares,
            user_lp_shares: pool_info.user_shares,
            total_shares: pool_info.total_shares,
            min_amounts
        }
    }

    /**
     * add liquidity to stNEAR<>OCT farm,
     *
     * @param amount_stnear
     * @param lp_amounts
     * @returns
     */
    // deposit stNEAR then add liquidity to OCT<>stNEAR pool
    async addLiquidityToStnearOct(
        amount_stnear: string,
        lp_amounts: string[]
    ): Promise<nearAPI.transactions.Transaction[]> {
        const preTXs: Promise<nearAPI.transactions.Transaction>[] = []
        const metapoolActions: nearAPI.transactions.Action[] = []
        // use this to increase storage balance on ref before depositing stNEAR
        const refActions_1: nearAPI.transactions.Action[] = []
        // use this for actions related to LP
        const refActions_2: nearAPI.transactions.Action[] = []

        // query user storage on ref
        const storage_balance: any = await window.account.viewFunction(
            window.nearConfig.ADDRESS_REF_EXCHANGE,
            "storage_balance_of",
            {
                account_id: window.account.accountId
            }
        )

        // check if storage is enough for a new token deposit
        if (storage_balance === null || BigInt(storage_balance.available) <= BigInt(this.MIN_DEPOSIT_PER_TOKEN)) {
            refActions_1.push(
                nearAPI.transactions.functionCall(
                    "storage_deposit", // contract method to deposit NEAR for wNEAR
                    {},
                    20_000_000_000_000, // attached gas
                    this.ONE_MORE_DEPOSIT_AMOUNT // amount of NEAR to deposit and wrap
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
        const min_lp_amounts: string[] = lp_amounts.map(amount => {
            return ((BigInt(amount) * BigInt("999")) / BigInt("1000")).toString()
        })

        // add liquidity to $OCT <-> $stNEAR
        // no need to check for storage as storage deposit
        // is take from attached deposit for this action
        refActions_2.push(
            nearAPI.transactions.functionCall(
                "add_liquidity",
                {
                    pool_id: this.NEW_POOL_ID,
                    amounts: lp_amounts,
                    min_amounts: min_lp_amounts
                },
                100_000_000_000_000,
                this.LP_STORAGE_AMOUNT
            )
        )

        if (refActions_1.length > 0) {
            preTXs.push(this.makeTransaction(window.nearConfig.ADDRESS_REF_EXCHANGE, refActions_1))
        }
        if (metapoolActions.length > 0) {
            preTXs.push(this.makeTransaction(window.nearConfig.ADDRESS_METAPOOL, metapoolActions))
        }
        preTXs.push(this.makeTransaction(window.nearConfig.ADDRESS_REF_EXCHANGE, refActions_2))
        const TXs: nearAPI.transactions.Transaction[] = await Promise.all(preTXs)

        return TXs
    }

    // remove liquidity from OCT<>wNEAR pool
    async removeLiquidityOctWnear(
        user_shares: string,
        min_amounts: string[]
    ): Promise<nearAPI.transactions.Transaction[]> {
        const actions: nearAPI.transactions.Action[] = []

        // query user storage
        const storage_balance: any = await window.account.viewFunction(
            window.nearConfig.ADDRESS_REF_EXCHANGE,
            "storage_balance_of",
            {
                account_id: window.account.accountId
            }
        )

        if (storage_balance === null || BigInt(storage_balance.available) <= BigInt(this.MIN_DEPOSIT_PER_TOKEN)) {
            actions.push(
                nearAPI.transactions.functionCall(
                    "storage_deposit", // contract method to deposit NEAR for wNEAR
                    {},
                    20_000_000_000_000, // attached gas
                    this.ONE_MORE_DEPOSIT_AMOUNT // amount of NEAR to deposit and wrap
                )
            )
        }

        actions.push(
            nearAPI.transactions.functionCall(
                "remove_liquidity",
                {
                    pool_id: this.OLD_POOL_ID,
                    shares: user_shares,
                    min_amounts: min_amounts
                },
                50_000_000_000_000,
                "1" // one yocto
            )
        )

        const TX: nearAPI.transactions.Transaction = await this.makeTransaction(
            window.nearConfig.ADDRESS_REF_EXCHANGE,
            actions
        )

        return [TX]
    }

    // withdraw wNEAR from Ref account and unwrap it
    async wnearToNear(wnear_amount: string): Promise<nearAPI.transactions.Transaction[]> {
        const wNearActions_1: nearAPI.transactions.Action[] = []
        const refActions: nearAPI.transactions.Action[] = []
        const wNearActions_2: nearAPI.transactions.Action[] = []

        // query user storage balance on ref contract
        const refStorage: any = await window.account.viewFunction(
            window.nearConfig.ADDRESS_REF_EXCHANGE,
            "storage_balance_of",
            {
                account_id: window.account.accountId
            }
        )
        if (!refStorage || BigInt(refStorage.total) <= BigInt("0")) {
            refActions.push(
                nearAPI.transactions.functionCall(
                    "storage_deposit",
                    {},
                    30_000_000_000_000,
                    this.ONE_MORE_DEPOSIT_AMOUNT
                )
            )
        }
        // withdraw wNEAR from Ref action
        refActions.push(
            nearAPI.transactions.functionCall(
                "withdraw",
                {
                    token_id: window.nearConfig.ADDRESS_WNEAR,
                    // amount: utils.format.parseNearAmount(amount),
                    amount: wnear_amount
                },
                100_000_000_000_000,
                "1" // one yocto
            )
        )

        // query user storage balance on wNEAR contract
        const wnearStorage: any = await window.account.viewFunction(
            window.nearConfig.ADDRESS_WNEAR,
            "storage_balance_of",
            {
                account_id: window.account.accountId
            }
        )

        if (!wnearStorage || BigInt(wnearStorage.total) <= BigInt("0")) {
            wNearActions_1.push(
                nearAPI.transactions.functionCall(
                    "storage_deposit",
                    {},
                    30_000_000_000_000,
                    this.NEW_ACCOUNT_STORAGE_COST
                )
            )
        }
        // unwrap wNEAR action
        wNearActions_2.push(
            nearAPI.transactions.functionCall(
                "near_withdraw",
                {
                    amount: wnear_amount
                },
                10_000_000_000_000,
                "1" // one yocto
            )
        )

        const preTXs: Promise<nearAPI.transactions.Transaction>[] = []

        if (wNearActions_1.length > 0) {
            preTXs.push(this.makeTransaction(window.nearConfig.ADDRESS_WNEAR, wNearActions_1))
        }
        preTXs.push(this.makeTransaction(window.nearConfig.ADDRESS_REF_EXCHANGE, refActions))
        preTXs.push(this.makeTransaction(window.nearConfig.ADDRESS_WNEAR, wNearActions_2))

        const TXs = await Promise.all(preTXs)

        return TXs
    }

    exitOldPosition(staked_amount: string, user_total_shares: string, min_amounts: string[]) {
        this.passToWallet([
            // if user has LP shares on farm, unstake them
            ...(BigInt(staked_amount) > BigInt("0") ? [this.farmUnstake(staked_amount, this.OLD_POOL_ID)] : []),

            // remove liquidity from OCT <-> wNEAR pool
            this.removeLiquidityOctWnear(user_total_shares, min_amounts),

            // withdraw wNEAR from Ref and unwrap it
            this.wnearToNear(min_amounts[1])
        ])
    }

    getNewPoolInfo(): Promise<{
        fee: number
        user_shares: string
        total_shares: string
        pool_amounts: string[]
    }> {
        return this.getPoolInfo(this.NEW_POOL_ID)
    }

    // action: LP to new pool and stake on farm
    addLiquidityAndStake(amount_stnear: string, lp_amounts: string[], lp_shares_to_stake: string) {
        this.passToWallet([
            this.addLiquidityToStnearOct(amount_stnear, lp_amounts),
            this.farmStake(lp_shares_to_stake, this.NEW_POOL_ID)
        ])
    }
}
