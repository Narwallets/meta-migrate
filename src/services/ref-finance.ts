class SwapAction {
    /// Pool which should be used for swapping.
    pool_id!: number
    /// Token to swap from.
    token_in!: string
    /// Amount to exchange.
    /// If amount_in is None, it will take amount_out from previous step.
    /// Will fail if amount_in is None on the first step.
    amount_in!: string
    /// Token to swap into.
    token_out!: string
    /// Required minimum amount of token_out.
    min_amount_out!: string
}

export { SwapAction }
