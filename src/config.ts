export class Config {
    HomepageUrl = 'https://rarible.com'
    ImagesUrl = 'https://images.rarible.com'
    IpfsUrl = 'https://ipfs.rarible.com'
    DefaultAvatarUrl = 'https://ipfs.rarible.com/ipfs/QmfNA7QWXzSp5G7qwkR9DxR225AGbtxjtfGDKrX2s9TV2N'
    ProtocolApiUrl = 'https://ethereum-api.rarible.org/v0.1'
    MarketplaceApiUrl = 'https://api-mainnet.rarible.com/marketplace/api/v4'
    EtherScanUrl = 'https://etherscan.io'
    Environment = 'production'

    constructor(env: string) {
        if (env.toLowerCase() === 'dev') {
            this.Environment = env
            this.HomepageUrl = 'https://ropsten.rarible.com'
            this.ImagesUrl = ''
            this.IpfsUrl = 'https://ipfs.rarible.com'
            this.DefaultAvatarUrl = 'https://ipfs.rarible.com/ipfs/QmfNA7QWXzSp5G7qwkR9DxR225AGbtxjtfGDKrX2s9TV2N'
            this.ProtocolApiUrl = 'https://ethereum-api-dev.rarible.org/v0.1'
            this.MarketplaceApiUrl = 'https://api-ropsten.rarible.com/marketplace/api/v4'
            this.EtherScanUrl = 'https://ropsten.etherscan.io'
        }
        if (env.toLowerCase() === 'staging') {
            this.Environment = env
            this.HomepageUrl = 'https://rinkeby.rarible.com'
            this.ImagesUrl = ''
            this.IpfsUrl = 'https://ipfs.rarible.com'
            this.DefaultAvatarUrl = 'https://ipfs.rarible.com/ipfs/QmfNA7QWXzSp5G7qwkR9DxR225AGbtxjtfGDKrX2s9TV2N'
            this.ProtocolApiUrl = 'https://ethereum-api-staging.rarible.org/v0.1'
            this.MarketplaceApiUrl = 'https://api-rinkeby.rarible.com/marketplace/api/v4'
            this.EtherScanUrl = 'https://rinkeby.etherscan.io'
        }
    }

    public getImageUrl(baseUrl: string) {
        if (baseUrl && baseUrl.startsWith('ipfs')) return `${this.IpfsUrl}/${baseUrl.replace('ipfs://', '')}`
        if (baseUrl && baseUrl.startsWith('http')) return baseUrl

        return this.DefaultAvatarUrl
    }

    public getAvatarUrl(baseUrl: string) {
        if (baseUrl && baseUrl.startsWith('ipfs')) return `${this.IpfsUrl}/${baseUrl.replace('ipfs://', '')}`
        if (baseUrl && baseUrl.startsWith('http')) return baseUrl

        return this.DefaultAvatarUrl
    }

    public getUserUrl(shortUrl: string, id: string) {
        const userUrl = shortUrl ? `${this.HomepageUrl}/${shortUrl}` : `${this.HomepageUrl}/user/${id}`
        return `${userUrl}`
    }

    public getCollectionUrl(shortUrl: string, id: string) {
        const collectionUrl = shortUrl ? `${this.HomepageUrl}/collection/${shortUrl}` : `${this.HomepageUrl}/collection/${id}`
        return `${collectionUrl}`
    }

    public getItemUrl(itemId: string) {
        return `${this.HomepageUrl}/token/${itemId}`
    }

    public getEtherscanUrl = (hash: string) => {
        return `${this.EtherScanUrl}/tx/${hash}`
    }
}
