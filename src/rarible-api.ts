import axios, { AxiosResponse } from 'axios'

export class RaribleApi {
    private protocolUrl: string
    private marketplaceUrl: string

    constructor(protocolApiUrl: string, marketplaceApiUrl: string) {
        this.protocolUrl = protocolApiUrl
        this.marketplaceUrl = marketplaceApiUrl
    }

    // PROTOCOL APIS
    public getItemById(itemId: string) {
        let url = `${this.protocolUrl}/ethereum/nft/items/${itemId}`
        return axios.get(url)
    }

    public getItemMetaById(itemId: string) {
        let url = `${this.protocolUrl}/ethereum/nft/items/${itemId}/meta`
        return axios.get(url)
    }

    // MARKETPLACE APIS
    public getProfiles(addresses: string[]) {
        let url = `${this.marketplaceUrl}/profiles/list`
        return axios.post(url, addresses)
    }

    public getOwnershipsByItem(itemId: string) {
        let url = `${this.marketplaceUrl}/items/${itemId}/ownerships`
        return axios.get(url)
    }

    public getAuctionsByIds(ids: string[]) {
        let url = `${this.marketplaceUrl}/auctions/byIds`
        return axios.post(url, ids)
    }

    public getOfferssByItem(itemId: string) {
        let url = `${this.marketplaceUrl}/items/${itemId}/offers`
        return axios.get(url)
    }

    public getOrderByOwnership(ownershipId: string) {
        let url = `${this.marketplaceUrl}/ownerships/${ownershipId}/order`
        return axios.get(url)
    }

    public prepareTransaction(orderId: string, marker: string, amount: number) {
        let url = `${this.marketplaceUrl}/orders/${orderId}/prepareTransaction`
        return axios.post(url, { maker: marker, amount: amount })
    }

    public getMarketMappingItems(itemIds: string[]) {
        let url = `${this.marketplaceUrl}/items/map`
        return axios.post(url, itemIds)
    }

    // get multiple requests
    public getAll = (values: (AxiosResponse | Promise<AxiosResponse>)[]): Promise<any> => {
        return new Promise((resolve, reject) => {
            axios
                .all(values)
                .then(
                    axios.spread((...responses) => {
                        resolve(responses.map((res) => res.data))
                    })
                )
                .catch((error) => {
                    reject(error)
                })
        })
    }
}
