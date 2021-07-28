export class RaribleConstant {
    public static readonly MIN_BID_AMOUNT = 0.001
    public static readonly MIN_BID_CURRENCY = 'wETH'
    public static readonly SERVICE_FEE = 0.025
    public static readonly DEFAULT_CURRENCY = 'ETH'

    public static CURRENCY: { [address: string]: string } = {
        ['0x0000000000000000000000000000000000000000']: 'ETH',

        // ropsten, rinkeby
        ['0xc778417e063141139fce010982780140aa0cd5ab']: 'WETH',

        // production
        ['0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2']: 'WETH'
    }
}
