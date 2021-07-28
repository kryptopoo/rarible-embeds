export class Config {
    HomepageUrl = 'https://rarible.com'
    ImagesUrl = 'https://images.rarible.com'
    IpfsUrl = 'https://ipfs.rarible.com'
    DefaultAvatarUrl = 'https://ipfs.rarible.com/ipfs/QmfNA7QWXzSp5G7qwkR9DxR225AGbtxjtfGDKrX2s9TV2N'
    ProtocolApiUrl = 'https://api.rarible.com/protocol/v0.1'
    MarketplaceApiUrl = 'https://api-mainnet.rarible.com/marketplace/api/v2'
    Environment = 'production'

    constructor(env: string) {
        this.Environment = env ?? 'production'
        if (this.Environment.toLowerCase() === 'dev') {
            this.HomepageUrl = 'https://ropsten.rarible.com'
            this.ImagesUrl = ''
            this.IpfsUrl = 'https://ipfs.rarible.com'
            this.DefaultAvatarUrl = 'https://ipfs.rarible.com/ipfs/QmfNA7QWXzSp5G7qwkR9DxR225AGbtxjtfGDKrX2s9TV2N'
            this.ProtocolApiUrl = 'https://api-dev.rarible.com/protocol/v0.1'
            this.MarketplaceApiUrl = 'https://api-ropsten.rarible.com/marketplace/api/v3'
        }
        if (this.Environment.toLowerCase() === 'staging') {
            this.HomepageUrl = 'https://rinkeby.rarible.com'
            this.ImagesUrl = ''
            this.IpfsUrl = 'https://ipfs.rarible.com'
            this.DefaultAvatarUrl = 'https://ipfs.rarible.com/ipfs/QmfNA7QWXzSp5G7qwkR9DxR225AGbtxjtfGDKrX2s9TV2N'
            this.ProtocolApiUrl = 'https://rinkeby.rarible.com/protocol/v0.1'
            this.MarketplaceApiUrl = 'https://rinkeby.rarible.com/marketplace/api/v3'
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
        if (this.Environment.toLowerCase() === 'dev') {
            return `https://ropsten.etherscan.io/tx/${hash}`
        }
        if (this.Environment.toLowerCase() === 'dev') {
            return `https://rinkeby.etherscan.io/tx/${hash}`
        }
        return `https://etherscan.io/tx/${hash}`
    }
}
