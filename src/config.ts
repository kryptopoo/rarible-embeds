export class Config {
    HomepageUrl = 'https://rarible.com'
    ImagesUrl = 'https://images.rarible.com'
    IpfsUrl = 'https://ipfs.rarible.com'
    DefaultAvatarUrl = 'https://ipfs.rarible.com/ipfs/QmfNA7QWXzSp5G7qwkR9DxR225AGbtxjtfGDKrX2s9TV2N'
    ProtocolApiUrl = 'https://api.rarible.com/protocol/v0.1'
    MarketplaceApiUrl = 'https://api-mainnet.rarible.com/marketplace/api/v2'
    IsDevEnvironment = false

    constructor(env: string) {
        this.IsDevEnvironment = env && env.toLowerCase() === 'dev'
        if (this.IsDevEnvironment) {
            this.HomepageUrl = 'https://ropsten.rarible.com'
            this.ImagesUrl = ''
            this.IpfsUrl = 'https://ipfs.rarible.com'
            this.DefaultAvatarUrl = 'https://ipfs.rarible.com/ipfs/QmfNA7QWXzSp5G7qwkR9DxR225AGbtxjtfGDKrX2s9TV2N'
            this.ProtocolApiUrl = 'https://api-dev.rarible.com/protocol/v0.1'
            this.MarketplaceApiUrl = 'https://api-ropsten.rarible.com/marketplace/api/v3'
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
        return this.IsDevEnvironment ? `https://ropsten.etherscan.io/tx/${hash}` : `https://etherscan.io/tx/${hash}`
    }
}
