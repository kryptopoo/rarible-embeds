import axios, { AxiosResponse } from "axios";

export class RaribleApi {
  private protocolUrl = "https://api.rarible.com/protocol/v0.1"
  private marketplaceUrl = "https://api-mainnet.rarible.com/marketplace/api/v2"
  private ipfsUrl = "https://ipfs.rarible.com/"
  private defaultAvatarUrl = "https://ipfs.rarible.com/ipfs/QmfNA7QWXzSp5G7qwkR9DxR225AGbtxjtfGDKrX2s9TV2N"

  constructor() {
  }

  // PROTOCOL APIS
  public getItemById(itemId: string) {
    let url = `${this.protocolUrl}/ethereum/nft/items/${itemId}`
    return axios.get(url);
  }

  public getItemMetaById(itemId: string) {
    let url = `${this.protocolUrl}/ethereum/nft/items/${itemId}/meta`
    return axios.get(url);
  }

  // MARKETPLACE APIS
  public getProfiles(addresses: string[]) {
    let url = `${this.marketplaceUrl}/profiles/list`
    return axios.post(url, addresses);
  }

  public getOwnershipsByItem(itemId: string) {
    let url = `${this.marketplaceUrl}/items/${itemId}/ownerships`
    return axios.get(url);
  }

  public getAuctionsByIds(ids: string[]) {
    let url = `${this.marketplaceUrl}/auctions/byIds`
    return axios.post(url, ids);
  }

  public getOfferssByItem(itemId: string) {
    let url = `${this.marketplaceUrl}/items/${itemId}/offers`
    return axios.get(url)
  }

  public getCardInfo = (itemId: string): Promise<any> => {
    return new Promise((resolve, reject) => {
      axios
        .all([this.getItemById(itemId), this.getItemMetaById(itemId)])
        .then(
          axios.spread((...responses) => {
            const itemData = responses[0].data
            const itemMetaData = responses[1].data
            console.log("itemData", itemData)
            console.log("itemMetaData", itemMetaData)

            let collections = [itemData.id.replace(`:${itemData.tokenId}`, '')];
            let owners = itemData.owners;
            let creators = itemData.creators.map((c: any) => c.account)
            axios.all([this.getProfiles(collections), this.getProfiles(creators), this.getProfiles(owners)])
              .then(axios.spread((...resProfiles) => {
                let collectionProfiles = resProfiles[0].data
                let creatorProfiles = resProfiles[1].data
                let ownerProfiles = resProfiles[2].data

                console.log('collectionProfiles', collectionProfiles)
                console.log('ownerProfiles', ownerProfiles)
                console.log('creatorProfiles', creatorProfiles)

                const cardInfo = {
                  id: itemData.id,
                  tokenId: itemData.tokenId,
                  contract: itemData.contract,
                  name: itemMetaData.name,
                  description: itemMetaData.description,
                  attributes: itemMetaData.attributes,
                  image: itemMetaData.image,
                  totalSupply: itemData.supply,
                  availableSupply: itemData.supply,
                  collections: collectionProfiles.map((c: any) => ({
                    id: c.id,
                    name: c.name,
                    image: c.image ? (c.image.indexOf('ipfs') > -1 ? c.image.replace('ipfs://', this.ipfsUrl) : `${this.ipfsUrl}/ipfs/${c.image}`) : this.defaultAvatarUrl,
                    shortUrl: c.shortUrl,
                    verified: c.badges.indexOf('VERIFIED') > -1
                  })),
                  creators: creatorProfiles.map((c: any) => ({
                    id: c.id,
                    name: c.name,
                    image: c.image ? c.image.replace('ipfs://', this.ipfsUrl) : this.defaultAvatarUrl,
                    shortUrl: c.shortUrl,
                    verified: c.badges.indexOf('VERIFIED') > -1
                  })),
                  owners: ownerProfiles.map((c: any) => ({
                    id: c.id,
                    name: c.name,
                    image: c.image ? c.image.replace('ipfs://', this.ipfsUrl) : this.defaultAvatarUrl,
                    shortUrl: c.shortUrl,
                    verified: c.badges.indexOf('VERIFIED') > -1
                  })),
                };

                resolve(cardInfo);
              }))
          })
        )
        .catch((error) => {
          reject(error);
        });
    });
  };

  // marketplace
  public getMarketInfo = (itemId: string): Promise<any> => {
    return new Promise((resolve, reject) => {
      axios
        .all([this.getOwnershipsByItem(itemId), this.getOfferssByItem(itemId)])
        .then(
          axios.spread((...responses) => {
            const resOwnerships = responses[0];
            const resOfferss = responses[1];

            console.log("resOwnerships", resOwnerships);
            console.log("resOfferss", resOfferss);

            let marketInfo = {
              lowestFixedPrice: {
                price: 0,
                priceEth: 0,
              },
              highestBid: {
                price: 0,
                priceEth: 0,
                currency: "",
              },
              likes: 0,
              selling: 0,
              sold: 0,
              stock: 0,
              notForSale: 0,
              auctions: 0
            };

            for (let i = 0; i < resOwnerships.data.length; i++) {
              marketInfo.likes = resOwnerships.data[i].likes;

              if (resOwnerships.data[i].status == "FIXED_PRICE") {
                marketInfo.selling += resOwnerships.data[i].selling;
                marketInfo.sold += resOwnerships.data[i].sold;
                marketInfo.stock += resOwnerships.data[i].stock;

                if (marketInfo.lowestFixedPrice.price == 0 || marketInfo.lowestFixedPrice.price > resOwnerships.data[i].price) {
                  marketInfo.lowestFixedPrice.price =
                    resOwnerships.data[i].price;
                  marketInfo.lowestFixedPrice.priceEth =
                    resOwnerships.data[i].priceEth;
                }
              }

              if (resOwnerships.data[i].status == "NOT_FOR_SALE")
                marketInfo.notForSale += 1;

              if (resOwnerships.data[i].status == "AUCTION")
                marketInfo.auctions += 1;
            }

            for (let i = 0; i < resOfferss.data.length; i++) {
              if (resOfferss.data[i].buyPriceEth > marketInfo.highestBid.priceEth) {
                marketInfo.highestBid.price = resOfferss.data[i].buyPrice;
                marketInfo.highestBid.priceEth = resOfferss.data[i].buyPriceEth;
                marketInfo.highestBid.currency =
                  resOfferss.data[i].makeCurrency.symbol;
              }
            }

            resolve(marketInfo);
          })
        )
        .catch((error) => {
          reject(error);
        });
    });
  };

  public getOrderByOwnership(ownershipId: string) {
    // https://api-mainnet.rarible.com/marketplace/api/v2/ownerships/0xd07dc4262bcdbf85190c01c996b4c06a461d2430%3A485193%3A0xfcfb72b3b33e2c1628ef991e1c9295fd44551009/order
    let url = `${this.marketplaceUrl}/ownerships/${ownershipId}/order`
    return axios.get(url)
  }

  public prepareTransaction(orderId: string, marker: string, amount: number) {
    //https://api-mainnet.rarible.com/marketplace/api/v2/orders/0x48af7aa29c7d38141de0e9b3892ff0d090314a9e5849d85340ca73a4fca34552/prepareTransaction
    let url = `${this.marketplaceUrl}/orders/${orderId}/prepareTransaction`
    return axios.post(url, { maker: marker, amount: amount })
  }

  public getMarketMappingItems(itemIds: string[]) {
    // https://api-mainnet.rarible.com/marketplace/api/v2/items/map
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
            resolve(responses.map(res => res.data));
          })
        )
        .catch((error) => {
          reject(error);
        });
    })
  }
}
