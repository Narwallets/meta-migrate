import * as nearAPI from "near-api-js"
import BaseLogic from "../../services/near"
import bigSqrt from "bigint-isqrt"

export default class Logic extends BaseLogic {
    STNEAR_META_POOL_ID: number = 1923 // [ 'meta-pool.near', 'meta-token.near' ]
    // see https://github.com/ref-finance/ref-contracts/blob/02efebfdce98a1283d3c9d7eb531a932166ec95d/ref-exchange/src/utils.rs#L25
    // example: fee = 30 means actual fee is 30 / 10_000 = 0.003 => 0.3%
    REF_FEE_DIVISOR: number = 10_000
    ADDRESS_METAPOOL: string = window.nearConfig.ADDRESS_METAPOOL
    ADDRESS_META_TOKEN: string = window.nearConfig.ADDRESS_META_TOKEN
    nativeNEARBalance?: string
    minDepositAmount?: string
    stNEARPrice?: string
    METABalanceOnRef?: string
    METABalance?: string
    stNEARBalanceOnRef?: string
    stNEARBalance?: string
    poolInfo?: {
        fee: number
        user_shares: string
        total_shares: string
        pool_amounts: string[]
    }
    lpSharesToStake?: string
    poolShares?: string
    farmShares?: string
    METAOut?: string
    stNEARToSwap?: string
    stNEARReceived?: string

    /**
     * take NEAR tokens, stake all on metapool to get stNEAR
     * swap half of stNEAR to $META on $REF
     *
     * @param params
     */
    async stepOneAction(params: { near_amount: string; min_meta_out: string }) {
        const { near_amount, min_meta_out } = params
        // recipe stakes all provided NEAR with metapool
        const amountToStake: string = near_amount
        // fetch metapool info and stNEAR<>META pool info
        const [{ st_near_price }, { pool_amounts }] = await Promise.all([
            this.getMetapoolInfo(),
            this.getPoolInfo(this.STNEAR_META_POOL_ID)
        ])
        // get expected amount of stNEAR user gets by staking amountToStake
        const estimatedStnearAmount: string = this.estimateStnearOut(amountToStake, st_near_price, 10)
        // we'll swap half the stNEAR amount to META
        const amountToSwap: string = (BigInt(estimatedStnearAmount) / BigInt("2")).toString()

        this.passToWallet([
            this.nearToStnear(amountToStake),
            this.instantSwap({
                pool_id: this.STNEAR_META_POOL_ID,
                token_in: this.ADDRESS_METAPOOL,
                amount_in: amountToSwap,
                token_out: this.ADDRESS_META_TOKEN,
                min_amount_out: min_meta_out
            })
        ])
    }

    /**
     * deposit on Ref, LP to stNear<>Meta and stake on farm
     *
     * @param amounts
     */
    async stepTwoAction(amounts: { stnearAmount: string; metaAmount: string }): Promise<void> {
        const { stnearAmount, metaAmount } = amounts

        // fetch metapool info and stNEAR<>wNEAR pool info
        const { total_shares, pool_amounts } = await this.getPoolInfo(this.STNEAR_META_POOL_ID)
        // estimate received LP shares
        const lpShares: string = this.calcLpSharesFromAmounts(total_shares, pool_amounts, [stnearAmount, metaAmount])

        this.passToWallet([
            // deposit both tokens on ref-finance
            this.depositTokensOnRef([
                { token: window.nearConfig.ADDRESS_METAPOOL, amount: stnearAmount },
                { token: window.nearConfig.ADDRESS_META_TOKEN, amount: metaAmount }
            ]),
            // rovide liquidity to stNEAR<>wNEAR pool
            this.addLiquidity([{ pool_id: this.STNEAR_META_POOL_ID, amounts: [stnearAmount, metaAmount] }]),
            // stake on farm
            this.farmStake(lpShares, this.STNEAR_META_POOL_ID)
        ])
    }

    async estimateMetaOut(amountIn: string): Promise<string> {
        console.log(amountIn)
        if (BigInt(amountIn) === BigInt("0")) return "0"

        const amountOut: string = await this.getPoolReturn({
            pool_id: this.STNEAR_META_POOL_ID,
            token_in: this.ADDRESS_METAPOOL,
            amount_in: amountIn,
            token_out: this.ADDRESS_META_TOKEN
        })

        // set slippage to 0.5%
        const withSlippage = ((BigInt(amountOut) * BigInt("995")) / BigInt("1000")).toString()
        return withSlippage
    }

    applyPoolFee(fee: number, input: bigint): bigint {
        return (input * BigInt(this.REF_FEE_DIVISOR - fee)) / BigInt(this.REF_FEE_DIVISOR)
    }

    estimateStnearIn(
        stnearTotal: string,
        poolInfo: {
            fee: number
            pool_amounts: string[]
        }
    ): string {
        // return (BigInt(stnearTotal) / BigInt("2")).toString()
        const userStnear: bigint = BigInt(stnearTotal)
        const { fee, pool_amounts } = poolInfo
        const [rStnearStr, rMetaStr]: string[] = pool_amounts
        // stNEAR pool reserve
        const rStnear: bigint = BigInt(rStnearStr)
        // META pool reserve
        const rMeta: bigint = BigInt(rMetaStr)
        // pool constant from x * y = k
        const k: bigint = rStnear * rMeta

        const term_1: bigint = this.applyPoolFee(fee, k) + k
        const term_2: bigint = bigSqrt(
            k * k +
                this.applyPoolFee(fee, BigInt("2") * k * k) +
                (k * k * BigInt((this.REF_FEE_DIVISOR - fee) ** 2)) / BigInt(this.REF_FEE_DIVISOR ** 2) +
                this.applyPoolFee(fee, BigInt("4") * rMeta * userStnear * k)
        )
        const term_3: bigint = this.applyPoolFee(fee, BigInt("2") * rMeta)

        return (-(term_1 - term_2) / term_3).toString()
    }
}
